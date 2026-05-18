/**
 * @file bollinger.ts
 * @description Quantitative analytics engine for repository health volatility.
 *
 * Implements Bollinger Band analysis adapted for repository health scores.
 * Originally used in financial markets to identify volatility regimes and
 * price anomalies — here applied to overall_score time series.
 *
 * Standard configuration: 20-period window, ±2σ bands.
 *
 * Usage:
 *   const bands = computeBollingerBands(timelineData);
 *   // bands[i].upper — if score[i] < lower, it's a statistical anomaly
 */

import type { TimelineCommit } from "@/types/repo";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BollingerPoint {
  /** ISO 8601 timestamp from the source commit */
  timestamp: string;
  /** Original commit hash */
  commit_hash: string;
  /** Raw health score for this data point */
  value: number;
  /** Simple Moving Average over the lookback window */
  sma: number;
  /** Upper Bollinger Band: SMA + (multiplier × σ) */
  upper: number;
  /** Lower Bollinger Band: SMA − (multiplier × σ) */
  lower: number;
  /** Standard deviation of the window */
  std_dev: number;
  /**
   * True if value breaches the lower band.
   * Indicates a statistically significant health degradation event.
   */
  is_anomaly: boolean;
  /**
   * Bandwidth — normalized measure of current volatility.
   * bandwidth = (upper − lower) / sma
   * Higher = more volatile period.
   */
  bandwidth: number;
}

export interface BollingerConfig {
  /** Number of periods in the moving window (default: 20) */
  period: number;
  /** Standard deviation multiplier for band width (default: 2.0) */
  multiplier: number;
}

const DEFAULT_CONFIG: BollingerConfig = {
  period: 20,
  multiplier: 2.0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Core Math Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes Simple Moving Average for a slice of values.
 *
 * @param values - Array of numeric values
 * @returns Arithmetic mean of the array
 */
export function computeSMA(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Computes population standard deviation for an array of values.
 * Uses population σ (not sample s) — consistent with traditional Bollinger Band spec.
 *
 * @param values - Array of numeric values
 * @param mean   - Pre-computed mean (pass result of computeSMA for efficiency)
 * @returns Population standard deviation
 */
export function computeStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const sumSquaredDiffs = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  return Math.sqrt(sumSquaredDiffs / values.length);
}

/**
 * Computes the upper Bollinger Band.
 *
 * @param sma        - Simple Moving Average
 * @param stdDev     - Standard deviation of the window
 * @param multiplier - Band width multiplier (default: 2.0)
 * @returns Upper band value
 */
export function computeUpperBand(
  sma: number,
  stdDev: number,
  multiplier: number = DEFAULT_CONFIG.multiplier
): number {
  return sma + multiplier * stdDev;
}

/**
 * Computes the lower Bollinger Band.
 *
 * @param sma        - Simple Moving Average
 * @param stdDev     - Standard deviation of the window
 * @param multiplier - Band width multiplier (default: 2.0)
 * @returns Lower band value
 */
export function computeLowerBand(
  sma: number,
  stdDev: number,
  multiplier: number = DEFAULT_CONFIG.multiplier
): number {
  return sma - multiplier * stdDev;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Bollinger Band Computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes full Bollinger Band series from a TimelineCommit array.
 *
 * Behavior for the initial window (first `period - 1` commits):
 * - SMA and bands are computed on the available data (expanding window).
 * - This avoids returning null/undefined for early data points.
 *
 * @param commits - Array of lightweight TimelineCommit objects
 * @param config  - Bollinger configuration (period, multiplier)
 * @returns BollingerPoint[] of equal length to input commits
 */
export function computeBollingerBands(
  commits: TimelineCommit[],
  config: BollingerConfig = DEFAULT_CONFIG
): BollingerPoint[] {
  const { period, multiplier } = config;
  const scores = commits.map((c) => c.health_metrics.overall_score);

  return commits.map((commit, index) => {
    // Use expanding window until we have enough data, then rolling window
    const windowStart = Math.max(0, index - period + 1);
    const window = scores.slice(windowStart, index + 1);

    const sma = computeSMA(window);
    const std_dev = computeStdDev(window, sma);
    const upper = computeUpperBand(sma, std_dev, multiplier);
    const lower = computeLowerBand(sma, std_dev, multiplier);
    const value = commit.health_metrics.overall_score;

    const bandwidth = sma > 0 ? (upper - lower) / sma : 0;

    return {
      timestamp: commit.timestamp,
      commit_hash: commit.commit_hash,
      value,
      sma: Math.round(sma * 100) / 100,
      upper: Math.round(upper * 100) / 100,
      lower: Math.round(lower * 100) / 100,
      std_dev: Math.round(std_dev * 100) / 100,
      is_anomaly: value < lower,
      bandwidth: Math.round(bandwidth * 10000) / 10000,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived Analytics Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts only the anomaly data points from a Bollinger series.
 * Useful for highlighting risk events on the timeline chart.
 *
 * @param bands - Full Bollinger series
 * @returns Only the data points where is_anomaly === true
 */
export function extractAnomalies(bands: BollingerPoint[]): BollingerPoint[] {
  return bands.filter((b) => b.is_anomaly);
}

/**
 * Identifies high-volatility windows where bandwidth exceeds a threshold.
 * Analogous to "Bollinger squeeze breakout" in financial analysis.
 *
 * @param bands     - Full Bollinger series
 * @param threshold - Bandwidth threshold (default: 0.3 = 30% normalized spread)
 * @returns Data points in high-volatility regimes
 */
export function extractHighVolatilityWindows(
  bands: BollingerPoint[],
  threshold: number = 0.3
): BollingerPoint[] {
  return bands.filter((b) => b.bandwidth > threshold);
}

/**
 * Computes the latest SMA value — useful for KPI cards showing trend.
 *
 * @param commits - Timeline commits
 * @param period  - Moving average period (default: 20)
 * @returns Latest SMA value or 0 if no data
 */
export function getLatestSMA(
  commits: TimelineCommit[],
  period: number = DEFAULT_CONFIG.period
): number {
  if (commits.length === 0) return 0;
  const window = commits.slice(-period).map((c) => c.health_metrics.overall_score);
  return computeSMA(window);
}
