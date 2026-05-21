from __future__ import annotations
import logging
import math
from typing import Any
import networkx as nx

logger = logging.getLogger(__name__)

_MAX_CYCLE_LENGTH: int = 10
_PENALTY_PER_CYCLE: float = 5.0
_EXTREME_COMPLEXITY_THRESHOLD: int = 20
_PENALTY_PER_EXTREME_NODE: float = 2.0
_GRID_SPACING_X: int = 220
_GRID_SPACING_Y: int = 130

class RepoGraph:
    def __init__(self) -> None:
        self._graph: nx.DiGraph = nx.DiGraph()
        self._cycle_cache: list[list[str]] | None = None
        self._violation_edges: set[tuple[str, str]] = set()
        self._node_bus_factors: dict[str, float] = {}
        self._node_churn: dict[str, int] = {}

    @property
    def graph(self) -> nx.DiGraph:
        return self._graph

    def update_commit_state(
        self,
        commit_hash: str,
        parsed_files: dict[str, dict[str, Any]],
        node_bus_factors: dict[str, float] | None = None,
        node_churn: dict[str, int] | None = None,
    ) -> None:
        if node_bus_factors is not None:
            self._node_bus_factors = node_bus_factors
        if node_churn is not None:
            self._node_churn = node_churn

        if not parsed_files: return

        for file_path, parse_result in parsed_files.items():
            functions: list[dict] = parse_result.get("functions", [])
            imports: list[str] = parse_result.get("imports", [])

            if not self._graph.has_node(file_path):
                self._graph.add_node(file_path)

            stale_successors = list(self._graph.successors(file_path))
            for successor in stale_successors:
                self._graph.remove_edge(file_path, successor)

            complexity_score: int = sum(fn.get("complexity", 1) for fn in functions)
            self._graph.nodes[file_path].update({
                "complexity_score": complexity_score,
                "functions": functions,
                "last_commit": commit_hash,
            })

            for imported_module in imports:
                if not self._graph.has_node(imported_module):
                    self._graph.add_node(imported_module, complexity_score=0, functions=[], last_commit=None)
                self._graph.add_edge(file_path, imported_module)

        self._cycle_cache = None
        self._violation_edges = set()

    def calculate_metrics(self) -> dict[str, Any]:
        cycles = self._get_cycles()
        cycle_count = len(cycles)
        complexity_scores = [data.get("complexity_score", 0) for _, data in self._graph.nodes(data=True)]
        extreme_nodes = sum(1 for c in complexity_scores if c > _EXTREME_COMPLEXITY_THRESHOLD)

        raw_score = 100.0 - (cycle_count * _PENALTY_PER_CYCLE) - (extreme_nodes * _PENALTY_PER_EXTREME_NODE)
        return {
            "overall_score": round(max(0.0, min(100.0, raw_score)), 2),
            "complexity_total": sum(complexity_scores),
            "dependency_cycles": cycle_count,
            "node_count": self._graph.number_of_nodes(),
            "edge_count": self._graph.number_of_edges(),
        }

    def export_graph_state(self) -> dict[str, Any]:
        self._get_cycles()
        nodes: list[dict[str, Any]] = []
        edges: list[dict[str, Any]] = []

        all_nodes = list(self._graph.nodes(data=True))
        cols = max(1, math.ceil(math.sqrt(len(all_nodes))))

        for idx, (node_id, attrs) in enumerate(all_nodes):
            row = idx // cols
            col = idx % cols
            label = node_id.split("/")[-1] if "/" in node_id else node_id
            
            # MATH RULE: Hotspot Risk = Node Degree (Connections) + Git Churn
            in_degree = self._graph.in_degree(node_id) if self._graph.has_node(node_id) else 0
            out_degree = self._graph.out_degree(node_id) if self._graph.has_node(node_id) else 0
            churn = self._node_churn.get(node_id, 0)
            hotspot_risk = in_degree + out_degree + churn

            nodes.append({
                "id": node_id,
                "type": "default",
                "data": {
                    "label": label,
                    "complexity_score": attrs.get("complexity_score", 0),
                    "bus_factor": self._node_bus_factors.get(node_id, 10.0),  # File-level bus factor
                    "hotspot_risk": hotspot_risk  # Exported to the frontend!
                },
                "position": {"x": col * _GRID_SPACING_X, "y": row * _GRID_SPACING_Y},
            })

        for src, tgt in self._graph.edges():
            is_violation = (src, tgt) in self._violation_edges
            edges.append({
                "id": f"{src}->{tgt}",
                "source": src,
                "target": tgt,
                "is_violation": is_violation,
                "animated": is_violation,
            })

        return {"nodes": nodes, "edges": edges}

    def _get_cycles(self) -> list[list[str]]:
        if self._cycle_cache is not None: return self._cycle_cache
        try:
            raw_cycles = list(nx.simple_cycles(self._graph, length_bound=_MAX_CYCLE_LENGTH))
        except Exception:
            raw_cycles = []
        self._cycle_cache = raw_cycles
        self._violation_edges = set()
        for cycle in raw_cycles:
            for i, node in enumerate(cycle):
                self._violation_edges.add((node, cycle[(i + 1) % len(cycle)]))
        return self._cycle_cache
