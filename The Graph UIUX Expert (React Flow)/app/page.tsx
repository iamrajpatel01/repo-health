"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import KnowledgeGraph from '../KnowledgeGraph';
import MetricCards from '../src/components/dashboard/MetricCards';
import IntelligenceTable from '../src/components/dashboard/IntelligenceTable';
import HealthTimeline, { TimelineDataPoint } from '../src/components/dashboard/HealthTimeline';
import RightSidebar, { CommitImpact } from '../src/components/layout/Sidebar';

// ── Mock Data ──────────────────────────────────────────────────
const timelineData: TimelineDataPoint[] = [
  { commitId: 'a1b2c3d', date: 'May 14', healthScore: 82 },
  { commitId: 'b2c3d4e', date: 'May 15', healthScore: 78 },
  { commitId: 'c3d4e5f', date: 'May 16', healthScore: 48 },
  { commitId: 'e4f5g6h', date: 'May 17', healthScore: 45 },
  { commitId: 'i7j8k9l', date: 'May 18', healthScore: 42 },
];

const commitImpacts: Record<string, CommitImpact> = {
  'a1b2c3d': { commitId: 'a1b2c3d', author: 'Sarah Chen', prNumber: '39', repo: 'api-service', healthBefore: 80, healthAfter: 82, complexityChange: -5, aiInsight: 'Refactoring the authentication middleware successfully decoupled dependencies and improved the overall service health score by 2 points.' },
  'b2c3d4e': { commitId: 'b2c3d4e', author: 'Alex River', prNumber: '40', repo: 'api-service', healthBefore: 82, healthAfter: 78, complexityChange: 6, aiInsight: 'Minor regression introduced in jwtUtils.ts. The error-handling patch added inline database calls which slightly increased coupling metrics.' },
  'c3d4e5f': { commitId: 'c3d4e5f', author: 'John Doe', prNumber: '41', repo: 'api-service', healthBefore: 78, healthAfter: 48, complexityChange: 18, aiInsight: 'CRITICAL: This commit introduced 3 new circular import chains across 7 modules. The health drop of 30 points is driven by architectural violations in payment-gateway.' },
  'e4f5g6h': { commitId: 'e4f5g6h', author: 'John Doe', prNumber: '41', repo: 'api-service', healthBefore: 48, healthAfter: 45, complexityChange: 8, aiInsight: 'Continuing regression. jwtUtils complexity increased from 38 to 45. Edge-case handling introduced tight coupling to the database layer.' },
  'i7j8k9l': { commitId: 'i7j8k9l', author: 'John Doe', prNumber: '42', repo: 'api-service', healthBefore: 45, healthAfter: 42, complexityChange: 12, aiInsight: 'Architectural drift confirmed: userModel.ts now directly accesses dbDriver.ts, bypassing the API gateway. This violates the separation-of-concerns principle.' },
};

const commitGraphs: Record<string, { nodes: Node[]; edges: Edge[] }> = {
  'a1b2c3d': {
    nodes: [
      { id: 'auth', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'authService.ts', complexity_score: 40, bus_factor: 0.3, anomaly_active: false, is_target_file: false } },
      { id: 'jwt', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'jwtUtils.ts', complexity_score: 22, bus_factor: 0.1, anomaly_active: false, is_target_file: false } },
    ],
    edges: [{ id: 'e1', source: 'auth', target: 'jwt', type: 'toxicEdge', data: { is_violation: false } }],
  },
  'b2c3d4e': {
    nodes: [
      { id: 'auth', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'authService.ts', complexity_score: 42, bus_factor: 0.3, anomaly_active: false, is_target_file: false } },
      { id: 'jwt', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'jwtUtils.ts', complexity_score: 30, bus_factor: 0.2, anomaly_active: true, is_target_file: true } },
      { id: 'user', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'userModel.ts', complexity_score: 15, bus_factor: 0.1, anomaly_active: false, is_target_file: false } },
    ],
    edges: [
      { id: 'e1', source: 'auth', target: 'jwt', type: 'toxicEdge', data: { is_violation: true } },
      { id: 'e2', source: 'auth', target: 'user', type: 'toxicEdge', data: { is_violation: false } },
    ],
  },
  'c3d4e5f': {
    nodes: [
      { id: 'auth', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'authService.ts', complexity_score: 70, bus_factor: 0.6, anomaly_active: true, is_target_file: false } },
      { id: 'jwt', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'jwtUtils.ts', complexity_score: 38, bus_factor: 0.3, anomaly_active: true, is_target_file: false } },
      { id: 'user', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'userModel.ts', complexity_score: 45, bus_factor: 0.4, anomaly_active: true, is_target_file: true } },
      { id: 'payment', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'paymentController.ts', complexity_score: 55, bus_factor: 0.5, anomaly_active: true, is_target_file: false } },
    ],
    edges: [
      { id: 'e1', source: 'auth', target: 'jwt', type: 'toxicEdge', data: { is_violation: true } },
      { id: 'e2', source: 'auth', target: 'user', type: 'toxicEdge', data: { is_violation: true } },
      { id: 'e3', source: 'user', target: 'payment', type: 'toxicEdge', data: { is_violation: true } },
    ],
  },
  'e4f5g6h': {
    nodes: [
      { id: 'auth', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'authService.ts', complexity_score: 80, bus_factor: 0.7, anomaly_active: true, is_target_file: false } },
      { id: 'jwt', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'jwtUtils.ts', complexity_score: 45, bus_factor: 0.3, anomaly_active: true, is_target_file: true } },
      { id: 'user', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'userModel.ts', complexity_score: 27, bus_factor: 0.4, anomaly_active: true, is_target_file: false } },
    ],
    edges: [
      { id: 'e1', source: 'auth', target: 'jwt', type: 'toxicEdge', data: { is_violation: true } },
      { id: 'e2', source: 'auth', target: 'user', type: 'toxicEdge', data: { is_violation: true } },
    ],
  },
  'i7j8k9l': {
    nodes: [
      { id: 'auth', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'authService.ts', complexity_score: 92, bus_factor: 0.85, anomaly_active: true, is_target_file: false } },
      { id: 'jwt', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'jwtUtils.ts', complexity_score: 45, bus_factor: 0.3, anomaly_active: true, is_target_file: false } },
      { id: 'user', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'userModel.ts', complexity_score: 58, bus_factor: 0.4, anomaly_active: true, is_target_file: true, architectural_drift: true } },
      { id: 'db', type: 'fileNode', position: { x: 0, y: 0 }, data: { label: 'dbDriver.ts', complexity_score: 10, bus_factor: 0.1, anomaly_active: false, is_target_file: false, architectural_drift: true } },
    ],
    edges: [
      { id: 'e1', source: 'auth', target: 'jwt', type: 'toxicEdge', data: { is_violation: true } },
      { id: 'e2', source: 'auth', target: 'user', type: 'toxicEdge', data: { is_violation: true } },
      { id: 'e3', source: 'user', target: 'db', type: 'toxicEdge', data: { is_violation: true } },
    ],
  },
};

export default function Page() {
  const [activeCommitId, setActiveCommitId] = useState('i7j8k9l');
  const hasDrift = activeCommitId === 'i7j8k9l' || activeCommitId === 'c3d4e5f';

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] overflow-hidden">
      {/* Drift alert bar */}
      <AnimatePresence>
        {hasDrift && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="shrink-0 bg-[rgba(255,59,92,0.08)] border-b border-[rgba(255,59,92,0.25)] px-5 py-2 flex items-center gap-3 overflow-hidden"
          >
            <AlertTriangle className="w-4 h-4 text-[#FF3B5C] shrink-0 animate-pulse" />
            <span className="text-xs text-[#FF3B5C] font-medium">
              Architecture Drift Detected — <span className="font-mono">userModel.ts</span> directly accesses <span className="font-mono">dbDriver.ts</span>, bypassing the API gateway layer.
            </span>
            <span className="ml-auto text-[10px] text-[#FF3B5C]/60 font-mono shrink-0">commit #{activeCommitId}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: KPIs + Table + Timeline */}
        <div className="w-[360px] shrink-0 flex flex-col gap-3 p-3 overflow-y-auto border-r border-white/5">
          <MetricCards />
          <div className="flex-1 min-h-[200px]">
            <IntelligenceTable />
          </div>
          <div className="h-[180px] shrink-0">
            <HealthTimeline
              data={timelineData}
              activeCommitId={activeCommitId}
              onCommitSelect={setActiveCommitId}
            />
          </div>
        </div>

        {/* Center: Graph — the hero */}
        <div className="flex-1 overflow-hidden p-3">
          <div className="h-full">
            <KnowledgeGraph
              key={activeCommitId}
              initialNodes={commitGraphs[activeCommitId].nodes}
              initialEdges={commitGraphs[activeCommitId].edges}
              activeCommitId={activeCommitId}
            />
          </div>
        </div>

        {/* Right column: AI Risk Sidebar */}
        <div className="w-[280px] shrink-0 p-3 border-l border-white/5 overflow-y-auto">
          <RightSidebar
            impactData={commitImpacts[activeCommitId]}
            driftActive={hasDrift}
          />
        </div>
      </div>
    </div>
  );
}
