/**
 * @file repo.ts
 * @description Core TypeScript data contracts for Repo Health Intelligence.
 *
 * Architecture: TWO-TIER PAYLOAD SEPARATION
 *   - TimelineCommit  → lightweight, used for timeline chart + KPI cards
 *   - CommitDetails   → heavy, loaded on-demand when a commit is clicked
 *
 * This prevents large payloads from freezing the dashboard on load.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTWEIGHT TIER — used by timeline, KPI cards, Bollinger analytics
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthMetrics {
  /** Composite repository health score: 0–100 */
  overall_score: number;
  /** Number of circular dependency cycles detected */
  dependency_cycles: number;
  /** Aggregated cyclomatic complexity across all modules */
  complexity_total: number;
  /** Count of modules flagged as key-person risk */
  key_person_risks: number;
}

/**
 * Lightweight commit object.
 * Used ONLY for: timeline chart rendering, KPI cards, Bollinger Band analytics.
 * MUST NOT contain graph_state or any heavy payload.
 */
export interface TimelineCommit {
  /** SHA-1 commit hash (abbreviated 7-char format) */
  commit_hash: string;
  /** ISO 8601 timestamp string */
  timestamp: string;
  /** Net lines changed in this commit (+/−) */
  delta: number;
  /** Lightweight health snapshot for this commit */
  health_metrics: HealthMetrics;
}

// ─────────────────────────────────────────────────────────────────────────────
// HEAVY TIER — loaded on-demand per commit click
// ─────────────────────────────────────────────────────────────────────────────

/** A node in the dependency graph representing a module or file */
export interface GraphNode {
  /** Unique node identifier (usually file path or module name) */
  id: string;
  /** Logical grouping / layer (e.g., "service", "controller", "util") */
  group: string;
  /** Cyclomatic complexity score for this node */
  complexity_score: number;
  /** Bus factor — minimum number of contributors needed to maintain this node */
  bus_factor: number;
}

/** A directed edge between two nodes in the dependency graph */
export interface GraphEdge {
  /** Unique edge identifier */
  id: string;
  /** Source node id */
  source: string;
  /** Target node id */
  target: string;
  /** True if this edge forms part of a detected dependency cycle */
  is_violation: boolean;
}

/** Full dependency graph snapshot for a commit */
export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Bus factor analysis per module.
 * Uses "author_entropy" (information-theoretic term) rather than
 * "ownership percentage" to reflect the statistical spread of contributions.
 */
export interface BusFactorData {
  /** Module or file path being analyzed */
  module: string;
  /**
   * Shannon entropy of author contribution distribution.
   * Low entropy = high concentration = high bus factor risk.
   */
  author_entropy: number;
  /** Normalized 0–1 score: 1 = all commits by one author (maximum risk) */
  concentration_score: number;
  /** Categorical risk classification */
  risk_level: "low" | "medium" | "high" | "critical";
}

/**
 * Hotspot analysis for a file.
 * hotspot_risk = git_churn × complexity (multiplicative risk model)
 */
export interface HotspotData {
  /** Relative file path within the repository */
  file_path: string;
  /** Normalized git churn score: commit frequency × line volatility */
  churn_score: number;
  /** Cyclomatic complexity score for this file */
  complexity_score: number;
  /** Composite hotspot risk score = churn_score × complexity_score */
  hotspot_risk: number;
}

/**
 * Payload for selective LLM invocation.
 *
 * SURGICAL AI USAGE CONSTRAINT:
 * git_diff_snippet is intentionally limited to MAXIMUM 15 LINES.
 * This enforces token efficiency and avoids LLM context window waste.
 */
export interface LLMTriggerPayload {
  /** True if a statistical anomaly was detected at this commit */
  anomaly_detected: boolean;
  /** Human-readable explanation of what triggered LLM analysis */
  trigger_reason: string;
  /** The specific file targeted for LLM review */
  target_file: string;
  /**
   * Surgical diff snippet — strictly ≤ 15 lines.
   * Each element is one line of unified diff output.
   */
  git_diff_snippet: string[];
}

/**
 * Heavy commit detail object.
 * Loaded ONLY when a commit is clicked — never included in timeline payloads.
 * Indexed by commit_hash for O(1) lookup.
 */
export interface CommitDetails {
  /** SHA-1 commit hash matching the parent TimelineCommit */
  commit_hash: string;
  /** Full dependency graph snapshot at this commit */
  graph_state: GraphState;
  /** LLM trigger payload for surgical AI analysis */
  llm_trigger_payload: LLMTriggerPayload;
  /** Bus factor analysis for modules affected by this commit */
  bus_factor_data: BusFactorData[];
  /** Hotspot analysis for files touched in this commit */
  hotspot_data: HotspotData[];
}
