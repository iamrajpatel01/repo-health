import type { CommitDetails } from "@/types/repo";

// Heavy detail objects for anomaly commits only.
// Indexed by commit_hash for O(1) lookup from DashboardContext.
export const MOCK_COMMIT_DETAILS: Record<string, CommitDetails> = {
  "a1b2c3d": {
    commit_hash: "a1b2c3d",
    graph_state: {
      nodes: [
        { id: "src/auth/session.ts", group: "service", complexity_score: 38, bus_factor: 1 },
        { id: "src/db/pool.ts", group: "util", complexity_score: 22, bus_factor: 2 },
        { id: "src/api/routes.ts", group: "controller", complexity_score: 45, bus_factor: 1 },
        { id: "src/middleware/rate-limit.ts", group: "middleware", complexity_score: 17, bus_factor: 3 },
      ],
      edges: [
        { id: "e1", source: "src/api/routes.ts", target: "src/auth/session.ts", is_violation: false },
        { id: "e2", source: "src/auth/session.ts", target: "src/db/pool.ts", is_violation: false },
        { id: "e3", source: "src/db/pool.ts", target: "src/api/routes.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "Health score dropped 24 points below lower Bollinger Band",
      target_file: "src/auth/session.ts",
      git_diff_snippet: [
        "- const SESSION_TIMEOUT = 3600;",
        "+ const SESSION_TIMEOUT = 0; // TEMP disable for load test",
        "  ",
        "- if (!token || isExpired(token)) {",
        "+   // if (!token || isExpired(token)) {",
        "+   // TODO: re-enable auth",
        "    return next();",
        "  }",
        "+ // auth bypass committed by mistake",
        "- validateCsrf(req);",
      ],
    },
    bus_factor_data: [
      { module: "src/auth/session.ts", author_entropy: 0.12, concentration_score: 0.91, risk_level: "critical" },
      { module: "src/db/pool.ts", author_entropy: 0.55, concentration_score: 0.45, risk_level: "medium" },
      { module: "src/api/routes.ts", author_entropy: 0.08, concentration_score: 0.95, risk_level: "critical" },
    ],
    hotspot_data: [
      { file_path: "src/auth/session.ts", churn_score: 9.2, complexity_score: 38, hotspot_risk: 349.6 },
      { file_path: "src/api/routes.ts", churn_score: 7.8, complexity_score: 45, hotspot_risk: 351.0 },
    ],
  },

  "b2c3d4e": {
    commit_hash: "b2c3d4e",
    graph_state: {
      nodes: [
        { id: "src/payment/processor.ts", group: "service", complexity_score: 62, bus_factor: 1 },
        { id: "src/payment/validator.ts", group: "util", complexity_score: 28, bus_factor: 2 },
        { id: "src/notification/email.ts", group: "service", complexity_score: 19, bus_factor: 4 },
        { id: "src/queue/worker.ts", group: "worker", complexity_score: 41, bus_factor: 1 },
      ],
      edges: [
        { id: "e1", source: "src/payment/processor.ts", target: "src/payment/validator.ts", is_violation: false },
        { id: "e2", source: "src/payment/processor.ts", target: "src/notification/email.ts", is_violation: false },
        { id: "e3", source: "src/queue/worker.ts", target: "src/payment/processor.ts", is_violation: false },
        { id: "e4", source: "src/payment/validator.ts", target: "src/queue/worker.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "Dependency cycle introduced in payment subsystem; complexity_total spiked +180",
      target_file: "src/payment/processor.ts",
      git_diff_snippet: [
        "+ import { enqueue } from '../queue/worker';",
        "  ",
        "  async function processPayment(payload: PaymentPayload) {",
        "-   await validate(payload);",
        "+   await validate(payload);",
        "+   await enqueue({ type: 'payment_retry', payload });",
        "  }",
        "+ // This import creates a cycle: processor → worker → validator → worker",
      ],
    },
    bus_factor_data: [
      { module: "src/payment/processor.ts", author_entropy: 0.09, concentration_score: 0.94, risk_level: "critical" },
      { module: "src/queue/worker.ts", author_entropy: 0.15, concentration_score: 0.87, risk_level: "high" },
    ],
    hotspot_data: [
      { file_path: "src/payment/processor.ts", churn_score: 11.4, complexity_score: 62, hotspot_risk: 706.8 },
      { file_path: "src/queue/worker.ts", churn_score: 6.3, complexity_score: 41, hotspot_risk: 258.3 },
    ],
  },

  "c3d4e5f": {
    commit_hash: "c3d4e5f",
    graph_state: {
      nodes: [
        { id: "src/config/env.ts", group: "config", complexity_score: 8, bus_factor: 5 },
        { id: "src/cache/redis.ts", group: "util", complexity_score: 31, bus_factor: 1 },
        { id: "src/models/user.ts", group: "model", complexity_score: 24, bus_factor: 2 },
        { id: "src/api/users.ts", group: "controller", complexity_score: 37, bus_factor: 2 },
        { id: "src/analytics/tracker.ts", group: "service", complexity_score: 55, bus_factor: 1 },
      ],
      edges: [
        { id: "e1", source: "src/api/users.ts", target: "src/models/user.ts", is_violation: false },
        { id: "e2", source: "src/models/user.ts", target: "src/cache/redis.ts", is_violation: false },
        { id: "e3", source: "src/analytics/tracker.ts", target: "src/models/user.ts", is_violation: false },
        { id: "e4", source: "src/cache/redis.ts", target: "src/analytics/tracker.ts", is_violation: true },
        { id: "e5", source: "src/analytics/tracker.ts", target: "src/cache/redis.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "Mutual dependency cycle between redis.ts and tracker.ts detected",
      target_file: "src/analytics/tracker.ts",
      git_diff_snippet: [
        "+ import { getCache, setCache } from '../cache/redis';",
        "  ",
        "  export async function trackEvent(event: AnalyticsEvent) {",
        "+   const cached = await getCache(`event:${event.type}`);",
        "+   if (cached) return cached;",
        "    const result = await persistEvent(event);",
        "+   await setCache(`event:${event.type}`, result);",
        "    return result;",
        "  }",
      ],
    },
    bus_factor_data: [
      { module: "src/cache/redis.ts", author_entropy: 0.11, concentration_score: 0.92, risk_level: "critical" },
      { module: "src/analytics/tracker.ts", author_entropy: 0.08, concentration_score: 0.96, risk_level: "critical" },
      { module: "src/models/user.ts", author_entropy: 0.44, concentration_score: 0.58, risk_level: "medium" },
    ],
    hotspot_data: [
      { file_path: "src/analytics/tracker.ts", churn_score: 14.1, complexity_score: 55, hotspot_risk: 775.5 },
      { file_path: "src/cache/redis.ts", churn_score: 8.7, complexity_score: 31, hotspot_risk: 269.7 },
    ],
  },

  "d4e5f6a": {
    commit_hash: "d4e5f6a",
    graph_state: {
      nodes: [
        { id: "src/search/indexer.ts", group: "service", complexity_score: 71, bus_factor: 1 },
        { id: "src/search/query-parser.ts", group: "util", complexity_score: 48, bus_factor: 1 },
        { id: "src/db/migrations/0012.ts", group: "migration", complexity_score: 15, bus_factor: 2 },
      ],
      edges: [
        { id: "e1", source: "src/search/indexer.ts", target: "src/search/query-parser.ts", is_violation: false },
        { id: "e2", source: "src/search/query-parser.ts", target: "src/search/indexer.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "key_person_risks reached 9 — single author owns 94% of search subsystem",
      target_file: "src/search/indexer.ts",
      git_diff_snippet: [
        "- // Simple linear scan",
        "+ // Inverted index with BM25 ranking",
        "+ export class BM25Indexer {",
        "+   private k1 = 1.5;",
        "+   private b = 0.75;",
        "+   private index: Map<string, PostingList> = new Map();",
        "+   ",
        "+   score(term: string, docId: string): number {",
        "+     const tf = this.termFrequency(term, docId);",
        "+     const idf = this.inverseDocFrequency(term);",
        "+     return idf * ((tf * (this.k1 + 1)) / (tf + this.k1));",
        "+   }",
        "+ }",
      ],
    },
    bus_factor_data: [
      { module: "src/search/indexer.ts", author_entropy: 0.06, concentration_score: 0.97, risk_level: "critical" },
      { module: "src/search/query-parser.ts", author_entropy: 0.07, concentration_score: 0.96, risk_level: "critical" },
    ],
    hotspot_data: [
      { file_path: "src/search/indexer.ts", churn_score: 16.2, complexity_score: 71, hotspot_risk: 1150.2 },
      { file_path: "src/search/query-parser.ts", churn_score: 9.4, complexity_score: 48, hotspot_risk: 451.2 },
    ],
  },

  "e5f6a7b": {
    commit_hash: "e5f6a7b",
    graph_state: {
      nodes: [
        { id: "src/api/gateway.ts", group: "controller", complexity_score: 82, bus_factor: 1 },
        { id: "src/auth/jwt.ts", group: "service", complexity_score: 33, bus_factor: 2 },
        { id: "src/rate-limiter/sliding-window.ts", group: "middleware", complexity_score: 44, bus_factor: 1 },
        { id: "src/logging/audit.ts", group: "util", complexity_score: 27, bus_factor: 3 },
      ],
      edges: [
        { id: "e1", source: "src/api/gateway.ts", target: "src/auth/jwt.ts", is_violation: false },
        { id: "e2", source: "src/api/gateway.ts", target: "src/rate-limiter/sliding-window.ts", is_violation: false },
        { id: "e3", source: "src/api/gateway.ts", target: "src/logging/audit.ts", is_violation: false },
        { id: "e4", source: "src/rate-limiter/sliding-window.ts", target: "src/api/gateway.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "complexity_total exceeded 450 — gateway.ts has 82 cyclomatic paths",
      target_file: "src/api/gateway.ts",
      git_diff_snippet: [
        "+ if (req.path.startsWith('/admin')) {",
        "+   if (!req.user?.role || req.user.role !== 'admin') {",
        "+     if (FEATURE_FLAGS.strict_admin) {",
        "+       if (req.ip && BLOCKED_IPS.has(req.ip)) {",
        "+         return res.status(403).json({ error: 'Forbidden' });",
        "+       }",
        "+     }",
        "+   }",
        "+ }",
      ],
    },
    bus_factor_data: [
      { module: "src/api/gateway.ts", author_entropy: 0.05, concentration_score: 0.98, risk_level: "critical" },
      { module: "src/rate-limiter/sliding-window.ts", author_entropy: 0.1, concentration_score: 0.93, risk_level: "critical" },
    ],
    hotspot_data: [
      { file_path: "src/api/gateway.ts", churn_score: 18.5, complexity_score: 82, hotspot_risk: 1517.0 },
      { file_path: "src/rate-limiter/sliding-window.ts", churn_score: 7.2, complexity_score: 44, hotspot_risk: 316.8 },
    ],
  },

  "f6a7b8c": {
    commit_hash: "f6a7b8c",
    graph_state: {
      nodes: [
        { id: "src/ml/predictor.ts", group: "service", complexity_score: 91, bus_factor: 1 },
        { id: "src/ml/features.ts", group: "util", complexity_score: 53, bus_factor: 1 },
        { id: "src/data-pipeline/etl.ts", group: "worker", complexity_score: 66, bus_factor: 1 },
      ],
      edges: [
        { id: "e1", source: "src/ml/predictor.ts", target: "src/ml/features.ts", is_violation: false },
        { id: "e2", source: "src/ml/predictor.ts", target: "src/data-pipeline/etl.ts", is_violation: false },
        { id: "e3", source: "src/data-pipeline/etl.ts", target: "src/ml/predictor.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "Score crashed to 18 — ML module committed with 91 cyclomatic complexity",
      target_file: "src/ml/predictor.ts",
      git_diff_snippet: [
        "+ export async function predict(features: FeatureVector): Promise<Prediction> {",
        "+   const weights = await loadWeights();",
        "+   const normalized = normalize(features, weights.scaler);",
        "+   const raw = dot(normalized, weights.coefficients);",
        "+   const confidence = sigmoid(raw);",
        "+   if (confidence > 0.9) return { label: 'high', confidence };",
        "+   if (confidence > 0.7) return { label: 'medium', confidence };",
        "+   return { label: 'low', confidence };",
        "+ }",
      ],
    },
    bus_factor_data: [
      { module: "src/ml/predictor.ts", author_entropy: 0.04, concentration_score: 0.99, risk_level: "critical" },
      { module: "src/ml/features.ts", author_entropy: 0.04, concentration_score: 0.99, risk_level: "critical" },
      { module: "src/data-pipeline/etl.ts", author_entropy: 0.06, concentration_score: 0.97, risk_level: "critical" },
    ],
    hotspot_data: [
      { file_path: "src/ml/predictor.ts", churn_score: 22.1, complexity_score: 91, hotspot_risk: 2011.1 },
      { file_path: "src/ml/features.ts", churn_score: 15.3, complexity_score: 53, hotspot_risk: 810.9 },
      { file_path: "src/data-pipeline/etl.ts", churn_score: 12.7, complexity_score: 66, hotspot_risk: 838.2 },
    ],
  },

  "a7b8c9d": {
    commit_hash: "a7b8c9d",
    graph_state: {
      nodes: [
        { id: "src/websocket/handler.ts", group: "service", complexity_score: 58, bus_factor: 1 },
        { id: "src/websocket/broadcaster.ts", group: "util", complexity_score: 34, bus_factor: 2 },
        { id: "src/state/store.ts", group: "model", complexity_score: 29, bus_factor: 2 },
      ],
      edges: [
        { id: "e1", source: "src/websocket/handler.ts", target: "src/websocket/broadcaster.ts", is_violation: false },
        { id: "e2", source: "src/websocket/broadcaster.ts", target: "src/state/store.ts", is_violation: false },
        { id: "e3", source: "src/state/store.ts", target: "src/websocket/handler.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "WebSocket handler introduced circular state dependency; dependency_cycles jumped to 14",
      target_file: "src/websocket/handler.ts",
      git_diff_snippet: [
        "- export function handleMessage(msg: WSMessage) {",
        "+ export function handleMessage(msg: WSMessage, store: Store) {",
        "+   store.dispatch({ type: 'WS_MESSAGE', payload: msg });",
        "    broadcast(msg);",
        "  }",
        "+ // store now imports handler for optimistic updates — creates cycle",
      ],
    },
    bus_factor_data: [
      { module: "src/websocket/handler.ts", author_entropy: 0.09, concentration_score: 0.94, risk_level: "critical" },
      { module: "src/state/store.ts", author_entropy: 0.31, concentration_score: 0.71, risk_level: "high" },
    ],
    hotspot_data: [
      { file_path: "src/websocket/handler.ts", churn_score: 13.5, complexity_score: 58, hotspot_risk: 783.0 },
      { file_path: "src/state/store.ts", churn_score: 8.1, complexity_score: 29, hotspot_risk: 234.9 },
    ],
  },

  "b8c9d0e": {
    commit_hash: "b8c9d0e",
    graph_state: {
      nodes: [
        { id: "src/billing/invoice.ts", group: "service", complexity_score: 74, bus_factor: 1 },
        { id: "src/billing/tax-calculator.ts", group: "util", complexity_score: 49, bus_factor: 1 },
        { id: "src/external/stripe-client.ts", group: "service", complexity_score: 21, bus_factor: 3 },
      ],
      edges: [
        { id: "e1", source: "src/billing/invoice.ts", target: "src/billing/tax-calculator.ts", is_violation: false },
        { id: "e2", source: "src/billing/invoice.ts", target: "src/external/stripe-client.ts", is_violation: false },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "Bus factor = 1 for entire billing subsystem; author_entropy near 0",
      target_file: "src/billing/invoice.ts",
      git_diff_snippet: [
        "+ function calculateProration(start: Date, end: Date, amount: number): number {",
        "+   const days = differenceInDays(end, start);",
        "+   const daysInMonth = getDaysInMonth(start);",
        "+   return (amount / daysInMonth) * days;",
        "+ }",
        "+ ",
        "+ function applyMultiCurrencyAdjustment(base: number, fx: FxRate): number {",
        "+   return base * fx.rate * (1 - fx.spread);",
        "+ }",
      ],
    },
    bus_factor_data: [
      { module: "src/billing/invoice.ts", author_entropy: 0.04, concentration_score: 0.99, risk_level: "critical" },
      { module: "src/billing/tax-calculator.ts", author_entropy: 0.05, concentration_score: 0.98, risk_level: "critical" },
    ],
    hotspot_data: [
      { file_path: "src/billing/invoice.ts", churn_score: 17.8, complexity_score: 74, hotspot_risk: 1317.2 },
      { file_path: "src/billing/tax-calculator.ts", churn_score: 10.2, complexity_score: 49, hotspot_risk: 499.8 },
    ],
  },

  "c9d0e1f": {
    commit_hash: "c9d0e1f",
    graph_state: {
      nodes: [
        { id: "src/reporting/aggregator.ts", group: "service", complexity_score: 67, bus_factor: 1 },
        { id: "src/reporting/formatter.ts", group: "util", complexity_score: 39, bus_factor: 2 },
        { id: "src/db/query-builder.ts", group: "util", complexity_score: 52, bus_factor: 1 },
      ],
      edges: [
        { id: "e1", source: "src/reporting/aggregator.ts", target: "src/reporting/formatter.ts", is_violation: false },
        { id: "e2", source: "src/reporting/aggregator.ts", target: "src/db/query-builder.ts", is_violation: false },
        { id: "e3", source: "src/db/query-builder.ts", target: "src/reporting/aggregator.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "Score dropped 31pts — reporting layer pulled db query-builder into circular dep",
      target_file: "src/reporting/aggregator.ts",
      git_diff_snippet: [
        "+ import { QueryBuilder } from '../db/query-builder';",
        "  ",
        "  export async function aggregate(params: AggregateParams) {",
        "-   const raw = await db.raw(params.sql);",
        "+   const qb = new QueryBuilder();",
        "+   qb.select(params.fields).from(params.table).where(params.filters);",
        "+   const raw = await qb.execute();",
        "    return format(raw);",
        "  }",
      ],
    },
    bus_factor_data: [
      { module: "src/reporting/aggregator.ts", author_entropy: 0.07, concentration_score: 0.96, risk_level: "critical" },
      { module: "src/db/query-builder.ts", author_entropy: 0.08, concentration_score: 0.95, risk_level: "critical" },
    ],
    hotspot_data: [
      { file_path: "src/reporting/aggregator.ts", churn_score: 14.9, complexity_score: 67, hotspot_risk: 998.3 },
      { file_path: "src/db/query-builder.ts", churn_score: 11.6, complexity_score: 52, hotspot_risk: 603.2 },
    ],
  },

  "d0e1f2a": {
    commit_hash: "d0e1f2a",
    graph_state: {
      nodes: [
        { id: "src/notifications/push.ts", group: "service", complexity_score: 43, bus_factor: 1 },
        { id: "src/notifications/scheduler.ts", group: "worker", complexity_score: 61, bus_factor: 1 },
        { id: "src/users/preferences.ts", group: "model", complexity_score: 18, bus_factor: 4 },
        { id: "src/device/registry.ts", group: "service", complexity_score: 35, bus_factor: 2 },
      ],
      edges: [
        { id: "e1", source: "src/notifications/scheduler.ts", target: "src/notifications/push.ts", is_violation: false },
        { id: "e2", source: "src/notifications/push.ts", target: "src/device/registry.ts", is_violation: false },
        { id: "e3", source: "src/notifications/push.ts", target: "src/users/preferences.ts", is_violation: false },
        { id: "e4", source: "src/notifications/scheduler.ts", target: "src/notifications/push.ts", is_violation: true },
      ],
    },
    llm_trigger_payload: {
      anomaly_detected: true,
      trigger_reason: "Volatility spike: 9 consecutive anomalies — notification subsystem in flux",
      target_file: "src/notifications/scheduler.ts",
      git_diff_snippet: [
        "- const BATCH_SIZE = 100;",
        "+ const BATCH_SIZE = 10000; // aggressive batching for scale test",
        "  ",
        "  async function runBatch() {",
        "-   await sleep(1000);",
        "+   // removed delay for throughput testing",
        "    const jobs = await dequeue(BATCH_SIZE);",
        "+   await Promise.all(jobs.map(dispatch));",
        "  }",
      ],
    },
    bus_factor_data: [
      { module: "src/notifications/scheduler.ts", author_entropy: 0.08, concentration_score: 0.95, risk_level: "critical" },
      { module: "src/notifications/push.ts", author_entropy: 0.14, concentration_score: 0.88, risk_level: "high" },
    ],
    hotspot_data: [
      { file_path: "src/notifications/scheduler.ts", churn_score: 19.3, complexity_score: 61, hotspot_risk: 1177.3 },
      { file_path: "src/notifications/push.ts", churn_score: 11.8, complexity_score: 43, hotspot_risk: 507.4 },
    ],
  },
};

/** Sorted list of anomaly commit hashes for direct reference */
export const ANOMALY_HASHES = Object.keys(MOCK_COMMIT_DETAILS);
