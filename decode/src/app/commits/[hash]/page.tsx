"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/context/DashboardContext';
import { RiskCenter } from '@/components/risk/RiskCenter';
import { AuditorPanel } from '@/components/auditor/AuditorPanel';
import { GraphContainer } from '@/components/graph/GraphContainer';

export default function CommitDetailPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = React.use(params);
  const { timelineData, selectedCommit, selectedCommitDetails, setSelectedCommit } = useDashboard();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Select the commit from URL parameters
    setSelectedCommit(hash);
    
    // Simulate loading/hydration state for enterprise feel
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [hash, setSelectedCommit]);

  if (!isReady || selectedCommit?.commit_hash !== hash) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-500 font-mono gap-4">
        <svg className="w-8 h-8 text-zinc-600 animate-[spin_3s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <div className="flex flex-col items-center">
          <span className="uppercase tracking-widest text-xs">Hydrating forensic context...</span>
          <span className="text-[10px] text-zinc-600 mt-1">Hash: {hash}</span>
        </div>
      </div>
    );
  }

  const isAnomaly = selectedCommitDetails?.llm_trigger_payload?.anomaly_detected;
  
  const currentIndex = timelineData.findIndex(c => c.commit_hash === selectedCommit.commit_hash);
  const prevCommit = currentIndex > 0 ? timelineData[currentIndex - 1] : null;
  const currentScore = selectedCommit.health_metrics.overall_score;
  const prevScore = prevCommit?.health_metrics.overall_score;
  
  let deltaPercent = 0;
  if (prevScore) {
    deltaPercent = ((currentScore - prevScore) / prevScore) * 100;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 selection:bg-zinc-800 p-4 md:p-8 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2 w-fit">
          ← Back to Operations Dashboard
        </Link>
      </div>

      {/* COMMIT HEADER */}
      <header className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Subtle gradient background based on state */}
        <div className={`absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-r ${isAnomaly ? 'from-red-900/50 to-transparent' : 'from-emerald-900/50 to-transparent'}`}></div>

        <div className="relative z-10">
          <h1 className="text-2xl font-mono font-bold text-zinc-100 tracking-wide flex items-center gap-4">
            Commit Forensic Analysis
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-sm text-zinc-400">
            <span className="px-3 py-1 bg-zinc-950 border border-zinc-700 rounded-md text-zinc-300 font-semibold shadow-inner">
              {selectedCommit.commit_hash}
            </span>
            <span>{new Date(selectedCommit.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-end gap-2 font-mono">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Health Score</div>
              <div className="flex items-baseline justify-end gap-2">
                <span className={`text-2xl font-bold ${currentScore < 50 ? 'text-red-500' : currentScore < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentScore.toFixed(1)}
                </span>
                <span className={`text-xs ${deltaPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {deltaPercent > 0 ? '+' : ''}{deltaPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          {isAnomaly && (
            <div className="mt-2 px-3 py-1.5 bg-red-950/40 border border-red-900/50 rounded-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">
                Structural Break Detected
              </span>
            </div>
          )}
        </div>
      </header>

      {/* INVESTIGATION DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Column: Analysis Panels */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-5 flex flex-col justify-center shadow-inner min-h-[140px]">
            <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-mono mb-4 border-b border-zinc-800 pb-2">
              Event Summary
            </h2>
            <p className="text-zinc-300 font-mono text-sm leading-relaxed">
              {isAnomaly 
                ? selectedCommitDetails?.llm_trigger_payload?.trigger_reason || "Unspecified structural violation triggered anomaly threshold."
                : "Routine commit. No significant volatility or structural degradation detected."
              }
            </p>
          </div>

          <div>
            <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-mono mb-3 ml-1">
              Risk Surface Exposure
            </h2>
            <RiskCenter />
          </div>
        </div>
        
        {/* Right Column: Auditor & Graph */}
        <div className="lg:col-span-5 flex flex-col gap-8 h-full">
          
          <div className="flex-1 flex flex-col">
            <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-mono mb-3 ml-1">
              Automated Code Audit
            </h2>
            <AuditorPanel />
          </div>
          
          <div className="h-[350px] flex-shrink-0 flex flex-col">
            <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-mono mb-3 ml-1">
              Structural Topology
            </h2>
            <GraphContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
