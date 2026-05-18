import React from 'react';
import { useDashboard } from '@/context/DashboardContext';

export function GraphContainer() {
  const { selectedCommitDetails } = useDashboard();

  const violations = selectedCommitDetails?.graph_state.edges.filter(e => e.is_violation).length || 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-md shadow-sm h-full flex flex-col overflow-hidden relative group hover:border-zinc-700 transition-all duration-300">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 z-10 flex justify-between items-center">
        <div>
          <h3 className="text-zinc-100 font-mono font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
            Dependency Graph
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </h3>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-1">
            Engine: ReactFlow [Awaiting Synchronization]
          </p>
        </div>
        {violations > 0 && (
          <div className="text-[10px] uppercase font-mono tracking-widest text-red-400 bg-red-950/30 px-2 py-1 rounded border border-red-900/50 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            {violations} Violations
          </div>
        )}
      </div>
      
      <div className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-900/10 to-zinc-950 flex flex-col items-center justify-center p-6 relative">
        {/* Placeholder grid background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMzZjNmNDYiLz48L3N2Zz4=')] opacity-20 pointer-events-none"></div>
        
        <div className="text-zinc-500 font-mono text-center relative z-10 max-w-sm">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full border border-zinc-700 bg-zinc-800/50 shadow-inner">
            <svg className="w-6 h-6 text-zinc-400 animate-[spin_4s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <p className="text-sm tracking-wider uppercase text-zinc-300 font-semibold mb-2">Graph Visualization Loading...</p>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Phase 1 placeholder for Role 4 integration. Receives <code className="bg-zinc-800 px-1 rounded text-zinc-400">selectedCommitDetails.graph_state</code> dynamically.
          </p>
          
          {selectedCommitDetails && (
            <div className="mt-6 pt-4 border-t border-zinc-800/50 flex justify-center gap-8 text-xs">
              <div className="flex flex-col items-center">
                <span className="text-zinc-300 font-mono font-bold text-lg">{selectedCommitDetails.graph_state.nodes.length}</span>
                <span className="text-zinc-600 uppercase tracking-widest text-[9px] mt-1">Nodes</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-zinc-300 font-mono font-bold text-lg">{selectedCommitDetails.graph_state.edges.length}</span>
                <span className="text-zinc-600 uppercase tracking-widest text-[9px] mt-1">Edges</span>
              </div>
              <div className="flex flex-col items-center">
                <span className={`font-mono font-bold text-lg ${violations > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{violations}</span>
                <span className="text-zinc-600 uppercase tracking-widest text-[9px] mt-1">Cycles</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
