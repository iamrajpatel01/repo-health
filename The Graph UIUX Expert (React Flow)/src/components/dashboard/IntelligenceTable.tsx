"use client";

import React from 'react';
import { GitMerge, ShieldCheck, ShieldAlert } from 'lucide-react';

interface RepoRow {
  repo: string; health: number; risk: 'Low' | 'Medium' | 'High';
  events: number; churn: string; rot: string; impact: string;
}

const data: RepoRow[] = [
  { repo: 'api-service',          health: 92, risk: 'Low',    events: 0, churn: '2.4%',  rot: 'Minimal',  impact: '+2%' },
  { repo: 'user-model',           health: 45, risk: 'High',   events: 3, churn: '18.5%', rot: 'Severe',   impact: '-12%' },
  { repo: 'payment-gateway',      health: 78, risk: 'Medium', events: 1, churn: '5.2%',  rot: 'Moderate', impact: '0%' },
  { repo: 'frontend-dashboard',   health: 88, risk: 'Low',    events: 0, churn: '8.1%',  rot: 'Low',      impact: '+1%' },
];

const riskMeta = {
  Low:    { color: '#00FF88', bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.25)' },
  Medium: { color: '#FF8C00', bg: 'rgba(255,140,0,0.08)',  border: 'rgba(255,140,0,0.25)' },
  High:   { color: '#FF3B5C', bg: 'rgba(255,59,92,0.10)',  border: 'rgba(255,59,92,0.30)' },
};

const HealthBar = ({ v }: { v: number }) => {
  const c = v >= 80 ? '#00FF88' : v >= 60 ? '#FF8C00' : '#FF3B5C';
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-mono font-bold w-6 text-right shrink-0" style={{ color: c }}>{v}</span>
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${v}%`, backgroundColor: c, boxShadow: `0 0 6px ${c}` }} />
      </div>
    </div>
  );
};

const IntelligenceTable = () => (
  <div className="glass flex flex-col overflow-hidden h-full">
    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
      <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
        <GitMerge className="w-3.5 h-3.5 text-[#00A3FF]" />
        Repository Intelligence
      </h3>
    </div>
    <div className="overflow-y-auto flex-1">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            {['Repository', 'Health', 'Risk', 'Events', 'Churn', 'Dep Rot', 'Last Impact'].map(h => (
              <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/4">
          {data.map((row, i) => {
            const m = riskMeta[row.risk];
            const impactColor = row.impact.startsWith('-') ? '#FF3B5C' : row.impact === '0%' ? '#475569' : '#00FF88';
            return (
              <tr key={i} className="hover:bg-white/3 transition-colors cursor-pointer group">
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-slate-200 group-hover:text-white transition-colors">{row.repo}</span>
                </td>
                <td className="px-4 py-3 w-40"><HealthBar v={row.health} /></td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
                    {row.risk}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.events > 0
                    ? <span className="flex items-center gap-1 text-xs text-[#FF3B5C] font-mono"><ShieldAlert className="w-3.5 h-3.5" />{row.events}</span>
                    : <span className="flex items-center gap-1 text-xs text-[#00FF88]/60 font-mono"><ShieldCheck className="w-3.5 h-3.5" />0</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{row.churn}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{row.rot}</td>
                <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: impactColor }}>{row.impact}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default IntelligenceTable;
