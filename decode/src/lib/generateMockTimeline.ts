/**
 * @file generateMockTimeline.ts
 * @description Programmatic generator for 1,000 lightweight TimelineCommit objects.
 *
 * Simulates realistic repository health behavior inspired by financial market dynamics:
 *   1. Stable Baseline      — tight oscillation around a healthy score (~80–90)
 *   2. Gradual Decay        — slow drift downward over multiple sprints
 *   3. Sudden Crash         — sharp anomaly drop (new feature merge gone wrong)
 *   4. Recovery             — incremental climb back after incident response
 *   5. Volatility Spike     — high-frequency oscillation (refactor in progress)
 *   6. Anomaly Clusters     — localized bursts of very low scores
 *
 * Output: TimelineCommit[] — NO graph_state, NO heavy data.
 */

import type { TimelineCommit, HealthMetrics } from "@/types/repo";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic PRNG — avoids Math.random() non-determinism across renders
// Implements a simple Mulberry32 algorithm
// ─────────────────────────────────────────────────────────────────────────────

function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Commit Hash Generator
// ─────────────────────────────────────────────────────────────────────────────

function generateHash(rng: () => number): string {
  const chars = "0123456789abcdef";
  return Array.from({ length: 7 }, () => chars[Math.floor(rng() * 16)]).join(
    ""
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clamp utility
// ─────────────────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase Definitions — describe repo lifecycle stages
// ─────────────────────────────────────────────────────────────────────────────

type PhaseType =
  | "stable"
  | "decay"
  | "crash"
  | "recovery"
  | "volatile"
  | "anomaly_cluster";

interface Phase {
  type: PhaseType;
  /** Number of commits in this phase */
  length: number;
  /** Target health score center for this phase */
  targetScore: number;
  /** Noise amplitude (std-dev equivalent) */
  noise: number;
}

/**
 * Phase schedule: 1,000 commits across 6 behavioral regimes.
 * Total = 1000 commits.
 */
const PHASES: Phase[] = [
  { type: "stable", length: 180, targetScore: 87, noise: 2.5 },
  { type: "decay", length: 120, targetScore: 65, noise: 4.0 },
  { type: "crash", length: 40, targetScore: 28, noise: 8.0 },
  { type: "recovery", length: 100, targetScore: 74, noise: 5.5 },
  { type: "stable", length: 150, targetScore: 82, noise: 2.0 },
  { type: "volatile", length: 120, targetScore: 70, noise: 14.0 },
  { type: "anomaly_cluster", length: 30, targetScore: 35, noise: 10.0 },
  { type: "recovery", length: 80, targetScore: 78, noise: 4.5 },
  { type: "stable", length: 100, targetScore: 85, noise: 2.0 },
  { type: "decay", length: 80, targetScore: 58, noise: 6.0 },
];
// Total = 180+120+40+100+150+120+30+80+100+80 = 1000 ✓

// ─────────────────────────────────────────────────────────────────────────────
// Gaussian approximation via Box-Muller (uses two uniform samples)
// ─────────────────────────────────────────────────────────────────────────────

function gaussianNoise(rng: () => number, mean: number, std: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2.0 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

// ─────────────────────────────────────────────────────────────────────────────
// Derive correlated secondary health metrics from overall_score
// ─────────────────────────────────────────────────────────────────────────────

function deriveMetrics(
  overallScore: number,
  rng: () => number
): Omit<HealthMetrics, "overall_score"> {
  // As health degrades, cycles and complexity grow, key_person_risks rises
  const healthRatio = overallScore / 100;

  const dependency_cycles = Math.round(
    clamp(gaussianNoise(rng, (1 - healthRatio) * 12, 2), 0, 25)
  );
  const complexity_total = Math.round(
    clamp(gaussianNoise(rng, (1 - healthRatio) * 380 + 40, 30), 20, 600)
  );
  const key_person_risks = Math.round(
    clamp(gaussianNoise(rng, (1 - healthRatio) * 8, 1.5), 0, 12)
  );

  return { dependency_cycles, complexity_total, key_person_risks };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates 1,000 lightweight TimelineCommit objects with realistic
 * market-like health score behavior across multiple lifecycle phases.
 *
 * @param seed - Optional deterministic seed (default: 42)
 * @returns TimelineCommit[] with 1,000 entries, sorted oldest → newest
 */
export function generateMockTimeline(seed: number = 42): TimelineCommit[] {
  const rng = createSeededRng(seed);
  const commits: TimelineCommit[] = [];

  // Start timestamp: ~2 years ago from a fixed reference point
  const START_MS = new Date("2024-01-02T09:00:00Z").getTime();
  // Average commit cadence: ~40 minutes ± noise
  const AVG_INTERVAL_MS = 40 * 60 * 1000;

  let currentTimeMs = START_MS;
  let currentScore = 87; // starting health score

  for (const phase of PHASES) {
    // Lerp toward phase target over its duration
    const startScore = currentScore;
    const endScore = phase.targetScore;

    for (let i = 0; i < phase.length; i++) {
      const progress = i / Math.max(phase.length - 1, 1);

      // Smooth interpolation to phase target (ease-in-out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const baseScore = startScore + (endScore - startScore) * eased;

      let overall_score: number;

      if (phase.type === "crash") {
        // Exponential drop for dramatic crash effect
        overall_score = clamp(
          baseScore - Math.pow(progress, 0.6) * 20 + gaussianNoise(rng, 0, phase.noise),
          5,
          100
        );
      } else if (phase.type === "volatile") {
        // High-frequency sine-wave oscillation layered on base
        const sineWave = Math.sin(i * 0.8) * phase.noise * 0.7;
        overall_score = clamp(
          baseScore + sineWave + gaussianNoise(rng, 0, phase.noise * 0.4),
          20,
          100
        );
      } else if (phase.type === "anomaly_cluster") {
        // Every 3rd commit is a severe anomaly spike downward
        const isAnomaly = i % 3 === 0;
        overall_score = clamp(
          baseScore + gaussianNoise(rng, 0, phase.noise) - (isAnomaly ? 20 : 0),
          5,
          100
        );
      } else {
        overall_score = clamp(
          baseScore + gaussianNoise(rng, 0, phase.noise),
          10,
          100
        );
      }

      overall_score = Math.round(overall_score * 10) / 10;
      currentScore = overall_score;

      const secondary = deriveMetrics(overall_score, rng);

      // Delta: lines changed — larger in crash/volatile phases
      const deltaBase = phase.type === "crash" || phase.type === "volatile" ? 280 : 60;
      const delta = Math.round(gaussianNoise(rng, deltaBase, deltaBase * 0.4));

      // Advance timestamp with jitter
      const jitter = gaussianNoise(rng, AVG_INTERVAL_MS, AVG_INTERVAL_MS * 0.3);
      currentTimeMs += Math.max(jitter, 5 * 60 * 1000); // min 5-minute gap

      const commit: TimelineCommit = {
        commit_hash: generateHash(rng),
        timestamp: new Date(currentTimeMs).toISOString(),
        delta,
        health_metrics: {
          overall_score,
          ...secondary,
        },
      };

      commits.push(commit);
    }
  }

  return commits;
}

/**
 * Singleton instance — generated once and memoized.
 * Import this for all timeline consumers.
 */
export const MOCK_TIMELINE: TimelineCommit[] = generateMockTimeline();
