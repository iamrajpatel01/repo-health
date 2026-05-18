"use client";

/**
 * @file DashboardContext.tsx
 * @description Global dashboard synchronization context for Repo Health Intelligence.
 *
 * PHASE 4 UPDATE:
 * Now integrated with real backend APIs. Handles loading orchestration,
 * graceful error degradation, and asynchronous commit hydration.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { TimelineCommit, CommitDetails } from "@/types/repo";
import { fetchTimeline, fetchCommitDetails } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Context Shape
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardContextValue {
  timelineData: TimelineCommit[];
  selectedCommit: TimelineCommit;
  selectedCommitDetails: CommitDetails;
  isLoading: boolean;
  isHydrating: boolean; // True when fetching a new commit detail
  apiStatus: 'synced' | 'degraded' | 'error';
  setSelectedCommit: (hash: string) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// Fallback logic if API fails for details
function createFallbackDetails(hash: string): CommitDetails {
  return {
    commit_hash: hash,
    graph_state: { nodes: [], edges: [] },
    llm_trigger_payload: {
      anomaly_detected: false,
      trigger_reason: "API synchronization failed. Running in degraded mode.",
      target_file: "unknown",
      git_diff_snippet: [],
    },
    bus_factor_data: [],
    hotspot_data: [],
  };
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrating, setIsHydrating] = useState(false);
  const [apiStatus, setApiStatus] = useState<'synced' | 'degraded' | 'error'>('synced');

  const [timelineData, setTimelineData] = useState<TimelineCommit[]>([]);
  const [selectedCommit, setSelectedCommitState] = useState<TimelineCommit | null>(null);
  const [selectedCommitDetails, setSelectedCommitDetails] = useState<CommitDetails | null>(null);

  // Initial load
  useEffect(() => {
    let mounted = true;
    async function initialize() {
      try {
        const timeline = await fetchTimeline();
        if (!mounted) return;
        
        if (timeline.length === 0) throw new Error("Empty timeline payload");

        setTimelineData(timeline);
        
        const latest = timeline[timeline.length - 1];
        setSelectedCommitState(latest);
        
        try {
          const details = await fetchCommitDetails(latest.commit_hash);
          if (!mounted) return;
          setSelectedCommitDetails(details);
        } catch (detailError) {
          console.warn("Failed to fetch initial heavy details, using fallback:", detailError);
          setApiStatus('degraded');
          if (mounted) setSelectedCommitDetails(createFallbackDetails(latest.commit_hash));
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Critical API Error: Failed to load timeline", err);
        setApiStatus('error');
        // Stay in loading state or render error boundary
      }
    }
    initialize();
    return () => { mounted = false; };
  }, []);

  const setSelectedCommit = useCallback(
    async (hash: string) => {
      const commit = timelineData.find((c) => c.commit_hash === hash);
      if (!commit) return;
      
      setSelectedCommitState(commit);
      setIsHydrating(true);
      
      try {
        const details = await fetchCommitDetails(hash);
        setSelectedCommitDetails(details);
        setApiStatus('synced');
      } catch (err) {
        console.warn(`Failed to hydrate details for ${hash}, degrading gracefully.`, err);
        setApiStatus('degraded');
        // We could look up nearest anomaly, but for real API, fallback is safer
        setSelectedCommitDetails(createFallbackDetails(hash));
      } finally {
        setIsHydrating(false);
      }
    },
    [timelineData]
  );

  const value = useMemo<DashboardContextValue | null>(() => {
    // Only return value if fully initialized
    if (!timelineData.length || !selectedCommit || !selectedCommitDetails) return null;
    
    return {
      timelineData,
      selectedCommit,
      selectedCommitDetails,
      isLoading,
      isHydrating,
      apiStatus,
      setSelectedCommit,
    };
  }, [timelineData, selectedCommit, selectedCommitDetails, isLoading, isHydrating, apiStatus, setSelectedCommit]);

  // If we haven't finished loading the initial valid state, render the loading shield
  if (!value) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono flex-col gap-4">
        {apiStatus === 'error' ? (
          <div className="text-red-500 text-center flex flex-col items-center gap-4 border border-red-900/50 bg-red-950/20 p-6 rounded-md">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold text-lg uppercase tracking-widest text-red-400">Critical Telemetry Failure</p>
              <p className="text-xs text-red-300/70 mt-1">Unable to synchronize timeline data with backend.</p>
            </div>
            <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 border border-red-900 text-red-400 rounded hover:bg-red-900/40 text-xs uppercase tracking-widest transition-colors font-bold">
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-zinc-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div className="flex flex-col items-center text-center">
              <span className="uppercase tracking-widest text-sm text-zinc-300">Establishing API Handshake</span>
              <span className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">Fetching Lightweight Timeline...</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used inside <DashboardProvider>");
  }
  return ctx;
}
