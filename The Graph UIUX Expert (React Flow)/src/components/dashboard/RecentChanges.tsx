import React from 'react';
import { GitCommit, TrendingDown, TrendingUp, Cpu, Bot } from 'lucide-react';

export interface CommitImpact {
  commitId: string;
  author: string;
  prNumber: string;
  repo: string;
  healthBefore: number;
  healthAfter: number;
  complexityChange: number;
  aiInsight: string;
}

interface RecentChangesProps {
  impactData: CommitImpact;
}

const RecentChanges: React.FC<RecentChangesProps> = ({ impactData }) => {
  const isHealthDrop = impactData.healthAfter < impactData.healthBefore;

  return (
    <div className="bg-dashboard-panel border border-dashboard-border rounded-xl p-6 shadow-sm w-full h-full flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-dashboard-border pb-3">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-indigo-400" />
          RECENT CHANGES IMPACT
        </h2>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full font-mono border border-indigo-500/30">
          Commit #{impactData.commitId}
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        <p className="text-sm text-slate-300">
          By <span className="font-medium text-slate-100">{impactData.author}</span> (PR #{impactData.prNumber})
        </p>

        {/* Health Impact Metric */}
        <div className="flex items-center gap-3 mt-2 bg-[#151e32] p-3 rounded-lg border border-dashboard-border">
          {isHealthDrop ? (
            <TrendingDown className="text-red-500 w-5 h-5" />
          ) : (
            <TrendingUp className="text-green-500 w-5 h-5" />
          )}
          <span className="text-sm">
            <span className="font-mono text-slate-200">{impactData.repo}</span> health {isHealthDrop ? 'dropped' : 'improved'}:
            <span className={`ml-2 font-mono font-bold ${isHealthDrop ? 'text-red-400' : 'text-green-400'}`}>
              {impactData.healthBefore} → {impactData.healthAfter}
            </span>
          </span>
        </div>

        {/* Complexity Impact Metric */}
        <div className="flex items-center gap-3 bg-[#151e32] p-3 rounded-lg border border-dashboard-border">
          <Cpu className="text-yellow-500 w-5 h-5" />
          <span className="text-sm">
            Complexity shift: 
            <span className={`ml-2 font-mono font-bold ${impactData.complexityChange > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {impactData.complexityChange > 0 ? '+' : ''}{impactData.complexityChange}%
            </span>
          </span>
        </div>

        {/* AI Insight Box */}
        <div className="mt-auto pt-4">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 relative">
            <div className="absolute -top-3 left-4 bg-[#111827] px-2 flex items-center gap-1">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">AI Insights</span>
            </div>
            <p className="text-sm text-indigo-200 leading-relaxed italic mt-1">
              "{impactData.aiInsight}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentChanges;
