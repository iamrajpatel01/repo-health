import React from 'react';
import { useDashboard } from '@/context/DashboardContext';

export function RiskCenter() {
  const { selectedCommitDetails } = useDashboard();

  if (!selectedCommitDetails) return null;

  const { bus_factor_data, hotspot_data } = selectedCommitDetails;

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  const getHotspotColor = (riskScore: number) => {
    if (riskScore > 1000) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (riskScore > 500) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Panel A - Key-Person Exposure */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-md flex flex-col shadow-sm">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="text-zinc-100 font-mono font-semibold uppercase tracking-wider text-sm">
            Key-Person Exposure
          </h3>
          <p className="text-zinc-500 font-mono text-xs mt-1">
            Knowledge distribution & Bus Factor risk analysis
          </p>
        </div>
        
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 font-medium uppercase tracking-wider">Module</th>
                <th className="pb-2 font-medium uppercase tracking-wider text-right group/th relative cursor-help">
                  Author Entropy (H)
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-950 border border-zinc-700 rounded shadow-xl text-[10px] text-zinc-300 opacity-0 group-hover/th:opacity-100 pointer-events-none transition-opacity z-50 normal-case tracking-normal">
                    <strong className="text-zinc-100 block mb-1">Information Entropy</strong>
                    Low entropy indicates dangerous knowledge concentration (high Bus Factor risk).
                  </div>
                </th>
                <th className="pb-2 font-medium uppercase tracking-wider text-right">Concentration</th>
                <th className="pb-2 font-medium uppercase tracking-wider text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {bus_factor_data.length > 0 ? (
                bus_factor_data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 text-zinc-300 font-medium truncate max-w-[200px]" title={item.module}>
                      {item.module}
                    </td>
                    <td className="py-3 text-right text-zinc-400">
                      {item.author_entropy.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-zinc-400">
                      {(item.concentration_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded border text-[10px] uppercase font-bold tracking-widest ${getRiskColor(item.risk_level)}`}>
                        {item.risk_level}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-600 italic">
                    No key-person risk data available for this commit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel B - Active Code Hotspots */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-md flex flex-col shadow-sm">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="text-zinc-100 font-mono font-semibold uppercase tracking-wider text-sm">
            Active Code Hotspots
          </h3>
          <p className="text-zinc-500 font-mono text-xs mt-1">
            Structural decay: Git Churn × Cyclomatic Complexity
          </p>
        </div>
        
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 font-medium uppercase tracking-wider">File</th>
                <th className="pb-2 font-medium uppercase tracking-wider text-right">Churn × Complexity</th>
                <th className="pb-2 font-medium uppercase tracking-wider text-center group/th relative cursor-help">
                  Hotspot Risk
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-950 border border-zinc-700 rounded shadow-xl text-[10px] text-zinc-300 opacity-0 group-hover/th:opacity-100 pointer-events-none transition-opacity z-50 normal-case tracking-normal text-left">
                    <strong className="text-zinc-100 block mb-1">Decay Severity Formula</strong>
                    Hotspot Risk = Git Churn × Cyclomatic Complexity. Highlights actively decaying files.
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {hotspot_data.length > 0 ? (
                hotspot_data.sort((a, b) => b.hotspot_risk - a.hotspot_risk).map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 text-zinc-300 font-medium truncate max-w-[220px]" title={item.file_path}>
                      {item.file_path}
                    </td>
                    <td className="py-3 text-right text-zinc-400">
                      {item.churn_score.toFixed(1)} × {item.complexity_score}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded border text-[10px] font-bold tracking-wider ${getHotspotColor(item.hotspot_risk)}`}>
                        {item.hotspot_risk.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-zinc-600 italic">
                    No active hotspots detected in this commit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
