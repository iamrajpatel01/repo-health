from __future__ import annotations

import argparse
import json
import logging
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

from git_walker import GitWalker
from ast_parser import CodeParser
from graph_engine import RepoGraph

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger(__name__)

_ANOMALY_THRESHOLD: float = 5.0
_MAX_FILE_BYTES: int = 2 * 1024 * 1024   
_BUS_FACTOR_THRESHOLD: float = 0.80

def _read_file_at_commit(repo_path: Path, commit_hash: str, file_path: str) -> str | None:
    try:
        result = subprocess.run(
            ["git", "show", f"{commit_hash}:{file_path}"],
            cwd=repo_path, capture_output=True, check=True, timeout=15,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return None

    raw_bytes = result.stdout
    if len(raw_bytes) > _MAX_FILE_BYTES:
        return None
    return raw_bytes.decode("utf-8", errors="replace")

def _get_surgical_diff(repo_path: Path, commit_hash: str, anomaly_file: str) -> str:
    """
    STRICT COMPLIANCE: Extracts only a highly constrained patch (max 15 lines) 
    for the exact file that triggered the architectural break. $0 token waste.
    """
    if not anomaly_file:
        return "Diff unavailable."
    try:
        # -U1 means only 1 line of context, keeping the diff extremely surgical
        result = subprocess.run(
            ["git", "diff", "-U1", f"{commit_hash}^", commit_hash, "--", anomaly_file],
            cwd=repo_path, capture_output=True, text=True, check=True, timeout=15, encoding="utf-8", errors="replace"
        )
        lines = result.stdout.split('\n')
        # Strip git headers, keep only the actual code changes
        patch_lines = [l for l in lines if l.startswith(('+', '-')) and not l.startswith(('+++', '---'))]
        return "\n".join(patch_lines[:15]) # Hard cap at 15 lines
    except Exception as exc:
        logger.debug("Could not extract surgical diff: %s", exc)
        return "Diff extraction failed."

def _compute_node_bus_factors(file_authors: dict[str, dict[str, int]]) -> dict[str, float]:
    """Calculates Bus Factor mathematically per-file (node), not per-module."""
    result: dict[str, float] = {}
    for filepath, author_map in file_authors.items():
        total = sum(author_map.values())
        if total == 0:
            result[filepath] = 10.0
            continue
        max_share = max(author_map.values()) / total
        # Returns 1.0 (Critical) if one author owns > 80% of the node
        result[filepath] = 1.0 if max_share >= _BUS_FACTOR_THRESHOLD else float(len(author_map))
    return result

def _build_llm_trigger(
    anomaly_detected: bool, prev_score: float, curr_score: float, 
    commit_hash: str, repo_path: Path, topo_delta: str, anomaly_file: str
) -> dict[str, Any]:
    payload: dict[str, Any] = {"anomaly_detected": anomaly_detected}
    if anomaly_detected:
        drop = round(prev_score - curr_score, 2)
        payload["trigger_reason"] = f"Score dropped by {drop} points in commit {commit_hash[:10]} due to structural changes in {anomaly_file or 'the architecture'}."
        # Pass ONLY the surgical 10-line diff to the LLM
        payload["git_diff_snippet"] = _get_surgical_diff(repo_path, commit_hash, anomaly_file)
        if topo_delta:
            payload["topological_delta"] = topo_delta
    return payload

def run_pipeline(repo_path: Path, output_path: Path, max_commits: int = 1000) -> None:
    logger.info("Initialising components for repo: %s", repo_path)
    walker, parser, rg = GitWalker(repo_path), CodeParser(), RepoGraph()

    commits = walker.get_all_commits_data()
    total = len(commits)
    prev_score = 100.0
    results: list[dict[str, Any]] = []

    # Track data strictly at the File (Node) level
    file_authors: dict[str, dict[str, int]] = {}
    file_churn: dict[str, int] = {}
    prev_edges: set[tuple[str, str]] = set()

    if total == 0: return

    logger.info("Starting $0 deterministic graph ingestion...")
    pipeline_start = time.monotonic()

    for idx, (commit_hash, timestamp, author) in enumerate(commits, start=1):
        if idx > max_commits: break
        
        changed_files = walker.get_changed_files(commit_hash)
        parsed_files: dict[str, dict[str, Any]] = {}

        for cf in changed_files:
            # Track Bus Factor per node
            file_authors.setdefault(cf.path, {})
            file_authors[cf.path][author] = file_authors[cf.path].get(author, 0) + cf.additions
            # Track Churn per node (Hotspot Risk part 1)
            file_churn[cf.path] = file_churn.get(cf.path, 0) + 1

            content = _read_file_at_commit(repo_path, commit_hash, cf.path)
            if content is not None:
                parsed_files[cf.path] = parser.parse_file(cf.path, content)
        
        node_bus_factors = _compute_node_bus_factors(file_authors)
        
        # Inject exact metrics into the graph math engine
        rg.update_commit_state(commit_hash, parsed_files, node_bus_factors, file_churn)
        
        curr_edges = set(rg.graph.edges())
        new_edges = curr_edges - prev_edges
        topo_delta = ""
        anomaly_file = ""

        if new_edges:
            samples = list(new_edges)[:5] 
            lines = [f"  {s} → {t}" for s, t in samples]
            topo_delta = f"Introduced {len(new_edges)} new dependency edge(s):\n" + "\n".join(lines)
            if rg.calculate_metrics()["dependency_cycles"] > 0:
                topo_delta += "\nWARNING: Created a circular dependency cycle."
            anomaly_file = list(new_edges)[0][0] # Target the exact file that created the edge
        elif changed_files:
            anomaly_file = changed_files[0].path
            
        prev_edges = curr_edges
        
        metrics = rg.calculate_metrics()
        curr_score = metrics["overall_score"]
        score_drop = prev_score - curr_score
        anomaly = score_drop > _ANOMALY_THRESHOLD

        llm_trigger = _build_llm_trigger(anomaly, prev_score, curr_score, commit_hash, repo_path, topo_delta, anomaly_file)
        
        results.append({
            "commit_hash": commit_hash,
            "timestamp": timestamp,
            "author": author,
            "health_metrics": metrics,
            "graph_state": rg.export_graph_state(),
            "llm_trigger_payload": llm_trigger,
        })
        prev_score = curr_score

    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=2, ensure_ascii=False)
    logger.info("Done. Output: %s", output_path)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("repo", nargs="?", default=".")
    p.add_argument("--output", "-o", default="pipeline_output.json")
    p.add_argument("--max-commits", "-n", type=int, default=1000)
    args = p.parse_args()
    
    repo_path = Path(args.repo).resolve()
    out_path = Path(args.output).resolve()
    run_pipeline(repo_path, out_path, max_commits=args.max_commits)
