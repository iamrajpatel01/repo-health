"use client";

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { KPICards } from '@/components/summary/KPICards';
import { TimelineChart } from '@/components/timeline/TimelineChart';
import { RiskCenter } from '@/components/risk/RiskCenter';
import { AuditorPanel } from '@/components/auditor/AuditorPanel';
import { GraphContainer } from '@/components/graph/GraphContainer';

export default function DashboardPage() {
  const { selectedCommit, selectedCommitDetails, apiStatus, isHydrating } = useDashboard();

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 selection:bg-zinc-800 p-4 md:p-6 flex flex-col font-sans relative">
      {/* Global Hydration Overlay */}
      {isHydrating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-zinc-900 z-50 overflow-hidden">
          <div className="h-full bg-emerald-500 w-1/3 animate-[slide_1s_ease-in-out_infinite]"></div>
        </div>
      )}

      {/* HEADER */}
      <header className="mb-6 pb-4 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-mono font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-3">
            Repo Health Intelligence
            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">
              v2.4.1
            </span>
          </h1>
          <div className="text-zinc-500 font-mono text-xs mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${apiStatus === 'synced' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></span>
              System Active {apiStatus === 'degraded' && '(Degraded)'}
            </span>
            <span className="text-zinc-700">|</span>
            <span>Current Scope: <span className="text-zinc-300">decode-core-api</span></span>
          </div>
        </div>
        
        <div className="text-right font-mono text-xs">
          <div className="text-zinc-500 uppercase tracking-widest mb-1">Selected Commit</div>
          <div className="flex items-center justify-end gap-3">
            <span className="text-zinc-300 bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700 font-bold transition-colors">
              {selectedCommit?.commit_hash}
            </span>
            {selectedCommitDetails?.llm_trigger_payload?.anomaly_detected ? (
              <span className="text-red-400 bg-red-950/30 px-2 py-1 rounded border border-red-900/50 uppercase tracking-widest font-semibold flex items-center gap-1.5 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                Anomaly Active
              </span>
            ) : (
              <span className="text-emerald-500 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50 uppercase tracking-widest font-semibold transition-all">
                Stable
              </span>
            )}
          </div>
        </div>
      </header>

      {/* OPERATIONAL STATUS BAR */}
      <div className="mb-6 bg-zinc-950 border border-zinc-800 rounded flex flex-wrap items-center gap-2 p-2 text-[10px] font-mono uppercase tracking-widest overflow-hidden shadow-inner transition-colors duration-500">
        <div className={`flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded transition-colors ${apiStatus === 'synced' ? 'text-emerald-500' : 'text-amber-500'}`}>
          {isHydrating ? (
             <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          ) : (
             <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></span>
          )}
          {isHydrating ? '[SYNCHRONIZING]' : apiStatus === 'synced' ? '[API SYNCED]' : '[API DEGRADED]'}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded transition-colors ${apiStatus === 'synced' ? 'text-zinc-400' : 'text-amber-500/70'}`}>
          {apiStatus === 'synced' ? '[GRAPH ENGINE CONNECTED]' : '[GRAPH TELEMETRY UNAVAILABLE]'}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded transition-colors ${selectedCommitDetails?.llm_trigger_payload?.anomaly_detected ? 'text-red-400' : 'text-zinc-400'}`}>
          {selectedCommitDetails?.llm_trigger_payload?.anomaly_detected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              [VOLATILITY HIGH]
            </>
          ) : (
            '[VOLATILITY NORMAL]'
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-amber-400">
          [10 ANOMALY EVENTS LOGGED]
        </div>
        <div className="ml-auto text-zinc-600 px-3 hidden md:flex items-center gap-3">
          <span>LATENCY: {isHydrating ? '---' : apiStatus === 'synced' ? '42ms' : 'TIMEOUT'}</span>
          <span>SYS_TIME: {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <KPICards />

      {/* CODEBASE VOLATILITY INDEX (VIX) */}
      <TimelineChart />

      {/* LOWER SECTION: RISK CENTER & GRAPH / AUDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
        
        {/* Left Column: Risk Center */}
        <div className="lg:col-span-7 flex flex-col">
          <RiskCenter />
        </div>
        
        {/* Right Column: Graph Panel & Auditor */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          {/* Graph Container (Upper Right) */}
          <div className="h-64 flex-shrink-0">
            <GraphContainer />
          </div>
          
          {/* Automated Technical Debt Auditor (Lower Right) */}
          <div className="flex-1 min-h-[300px]">
            <AuditorPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
