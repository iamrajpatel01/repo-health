import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { getLatestSMA } from '@/lib/bollinger';

export function KPICards() {
  const { timelineData, selectedCommit } = useDashboard();

  if (!timelineData || timelineData.length === 0) return null;

  const currentIndex = timelineData.findIndex(c => c.commit_hash === selectedCommit.commit_hash);
  const prevCommit = currentIndex > 0 ? timelineData[currentIndex - 1] : null;

  const getDelta = (current: number, prev: number | undefined) => {
    if (prev === undefined) return null;
    const diff = current - prev;
    const percent = prev !== 0 ? (diff / prev) * 100 : 0;
    return {
      diff,
      percent,
      isPositive: diff >= 0,
      formatted: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} (${percent > 0 ? '+' : ''}${percent.toFixed(1)}%)`
    };
  };

  const healthDelta = getDelta(
    selectedCommit.health_metrics.overall_score, 
    prevCommit?.health_metrics.overall_score
  );

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 shadow-emerald-500/20';
    if (score >= 50) return 'text-amber-400 shadow-amber-500/20';
    return 'text-red-500 shadow-red-500/20';
  };

  const cycles = selectedCommit.health_metrics.dependency_cycles;
  const cycleColor = cycles > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Overall Health Score */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="text-zinc-500 text-xs font-mono mb-1 uppercase tracking-wider">Overall Health Score</div>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-mono font-semibold ${getHealthColor(selectedCommit.health_metrics.overall_score)} drop-shadow-md`}>
            {selectedCommit.health_metrics.overall_score.toFixed(1)}
          </span>
          {healthDelta && (
            <span className={`text-sm font-mono ${healthDelta.isPositive ? 'text-emerald-400' : 'text-red-500'}`}>
              {healthDelta.formatted} {healthDelta.isPositive ? '▲' : '🔻'}
            </span>
          )}
        </div>
        <div className="mt-2 text-xs text-zinc-600 font-mono">
          Latest SMA: {getLatestSMA(timelineData).toFixed(1)}
        </div>
      </div>

      {/* Dependency Cycles */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md shadow-sm relative overflow-hidden hover:border-zinc-700 transition-colors">
        <div className="text-zinc-500 text-xs font-mono mb-1 uppercase tracking-wider">Dependency Cycles</div>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-mono font-semibold ${cycleColor} drop-shadow-md`}>
            {cycles}
          </span>
        </div>
        <div className="mt-2 text-xs text-zinc-600 font-mono">
          {cycles > 0 ? 'Structural violation detected' : 'Clean architecture'}
        </div>
      </div>

      {/* Complexity Total */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md shadow-sm relative overflow-hidden hover:border-zinc-700 transition-colors">
        <div className="text-zinc-500 text-xs font-mono mb-1 uppercase tracking-wider">Complexity Total</div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-mono font-semibold text-zinc-200">
            {selectedCommit.health_metrics.complexity_total}
          </span>
        </div>
        <div className="mt-2 text-xs text-zinc-600 font-mono">
          Cyclomatic paths across codebase
        </div>
      </div>

      {/* Active Risk Count */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md shadow-sm relative overflow-hidden hover:border-zinc-700 transition-colors">
        <div className="text-zinc-500 text-xs font-mono mb-1 uppercase tracking-wider">Active Risk Count</div>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-mono font-semibold ${selectedCommit.health_metrics.key_person_risks > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
            {selectedCommit.health_metrics.key_person_risks}
          </span>
        </div>
        <div className="mt-2 text-xs text-zinc-600 font-mono">
          Modules exposed to Bus Factor
        </div>
      </div>
    </div>
  );
}
