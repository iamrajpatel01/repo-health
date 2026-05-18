import React from 'react';
import { useDashboard } from '@/context/DashboardContext';

export function AuditorPanel() {
  const { selectedCommitDetails } = useDashboard();

  if (!selectedCommitDetails) return null;

  const { llm_trigger_payload } = selectedCommitDetails;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 flex justify-between items-center">
        <div>
          <h3 className="text-zinc-100 font-mono font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
            Automated Technical Debt Auditor
            {llm_trigger_payload.anomaly_detected && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </h3>
          <p className="text-zinc-500 font-mono text-xs mt-1">
            Showing Critical 15-Line Surgical Diff Window
          </p>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {llm_trigger_payload.anomaly_detected ? (
          <>
            <div className="mb-4 space-y-3">
              <div className="bg-zinc-950/50 p-3 rounded border border-zinc-800/80">
                <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Trigger Reason</div>
                <div className="text-amber-400 font-mono text-xs leading-relaxed">
                  {llm_trigger_payload.trigger_reason}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Target File:</span>
                <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{llm_trigger_payload.target_file}</span>
              </div>
            </div>

            <div className="flex-1 bg-[#0d1117] rounded border border-zinc-800 font-mono text-xs overflow-auto">
              <div className="sticky top-0 bg-zinc-800/80 backdrop-blur px-3 py-1.5 border-b border-zinc-700/50 flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-400">
                <span>Git Diff Snippet</span>
                <span className="text-zinc-500">Lines: {llm_trigger_payload.git_diff_snippet.length}/15 Max</span>
              </div>
              <div className="p-3">
                {llm_trigger_payload.git_diff_snippet.map((line, idx) => {
                  const isAddition = line.startsWith('+');
                  const isDeletion = line.startsWith('-');
                  
                  let bgColor = 'bg-transparent';
                  let textColor = 'text-zinc-300';
                  
                  if (isAddition) {
                    bgColor = 'bg-emerald-900/20';
                    textColor = 'text-emerald-400';
                  } else if (isDeletion) {
                    bgColor = 'bg-red-900/20';
                    textColor = 'text-red-400';
                  }

                  return (
                    <div key={idx} className={`flex ${bgColor} hover:bg-zinc-800/50 transition-colors`}>
                      <div className="w-8 select-none text-right pr-2 text-zinc-600 border-r border-zinc-800 py-0.5 opacity-50">
                        {idx + 1}
                      </div>
                      <div className={`pl-2 whitespace-pre py-0.5 ${textColor}`}>
                        {line}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 font-mono text-sm h-32">
            <div className="mb-2 text-emerald-500/50">
              <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            No anomalies detected in selected commit.
            <div className="text-xs text-zinc-600 mt-1">LLM analysis bypassed to save tokens.</div>
          </div>
        )}
      </div>
    </div>
  );
}
