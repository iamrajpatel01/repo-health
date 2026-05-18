"use client";

import React from 'react';
import { Bot, GitMerge, FileWarning, TrendingDown, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CommitImpact {
  commitId: string; author: string; prNumber: string; repo: string;
  healthBefore: number; healthAfter: number; complexityChange: number; aiInsight: string;
}

interface RightSidebarProps {
  impactData: CommitImpact;
  driftActive: boolean;
}

const RightSidebar = ({ impactData, driftActive }: RightSidebarProps) => {
  const drop = impactData.healthAfter < impactData.healthBefore;

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Drift Alert */}
      {driftActive && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="glass border border-[rgba(255,59,92,0.4)] p-3 rounded-xl drift-flash"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 bg-[#FF3B5C] rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#FF3B5C]">Architecture Drift Detected</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-[#FF8C00] font-mono">userModel.ts</span> → <span className="text-[#FF8C00] font-mono">dbDriver.ts</span> bypasses API gateway. Violation of separation-of-concerns principle.
          </p>
        </motion.div>
      )}

      {/* Commit Impact */}
      <div className="glass p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Commit Impact</h3>
          <span className="text-[10px] font-mono text-slate-500 bg-white/4 px-2 py-0.5 rounded border border-white/6">#{impactData.commitId}</span>
        </div>
        <p className="text-xs text-slate-400">by <span className="text-slate-200 font-medium">{impactData.author}</span> · PR #{impactData.prNumber}</p>

        <div className="flex items-center gap-2 bg-[#FF3B5C]/8 border border-[rgba(255,59,92,0.2)] rounded-lg p-2.5">
          <TrendingDown className="w-4 h-4 text-[#FF3B5C] shrink-0" />
          <span className="text-xs text-slate-300">
            <span className="font-mono">{impactData.repo}</span> health {drop ? 'dropped' : 'improved'}:&nbsp;
            <span className={`font-mono font-bold ${drop ? 'text-[#FF3B5C]' : 'text-[#00FF88]'}`}>
              {impactData.healthBefore} → {impactData.healthAfter}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/4 border border-white/6 rounded-lg p-2.5">
          <Cpu className="w-4 h-4 text-[#FF8C00] shrink-0" />
          <span className="text-xs text-slate-300">Complexity:&nbsp;
            <span className={`font-mono font-bold ${impactData.complexityChange > 0 ? 'text-[#FF8C00]' : 'text-[#00FF88]'}`}>
              {impactData.complexityChange > 0 ? '+' : ''}{impactData.complexityChange}%
            </span>
          </span>
        </div>
      </div>

      {/* AI Insight */}
      <div className="glass p-4 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#A855F7]/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-[#A855F7]" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#A855F7]">AI Risk Analysis</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed relative z-10 italic">
          "{impactData.aiInsight}"
        </p>
      </div>

      {/* Top Hotspots */}
      <div className="glass p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2 mb-2">
          <FileWarning className="w-3.5 h-3.5 text-[#FF3B5C]" />
          Top Hotspots
        </h3>
        {[
          { name: 'userModel.ts', score: 92 },
          { name: 'authService.ts', score: 85 },
          { name: 'database.config.ts', score: 78 },
          { name: 'apiGateway.ts', score: 71 },
        ].map((item, i) => {
          const c = item.score >= 80 ? '#FF3B5C' : '#FF8C00';
          return (
            <div key={i} className="flex items-center gap-3 group cursor-pointer p-2 rounded-lg hover:bg-white/4 transition-colors">
              <span className="text-[10px] text-slate-600 w-4 text-right shrink-0">{i + 1}</span>
              <span className="text-xs font-mono text-slate-300 flex-1 group-hover:text-white transition-colors truncate">{item.name}</span>
              <span className="text-xs font-mono font-bold" style={{ color: c }}>{item.score}</span>
            </div>
          );
        })}
      </div>

      {/* Circular Deps */}
      <div className="glass p-4">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2 mb-3">
          <GitMerge className="w-3.5 h-3.5 text-[#FF8C00]" />
          Circular Dependencies
        </h3>
        {[
          { a: 'authService', b: 'jwtUtils', risk: 'High' },
          { a: 'paymentController', b: 'stripeService', risk: 'Med' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 mb-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-white/3 cursor-pointer transition-all">
            <span className="text-[11px] font-mono text-slate-400">{item.a} ↔ {item.b}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.risk === 'High' ? 'text-[#FF3B5C] bg-[rgba(255,59,92,0.1)] border border-[rgba(255,59,92,0.3)]' : 'text-[#FF8C00] bg-[rgba(255,140,0,0.1)] border border-[rgba(255,140,0,0.3)]'}`}>
              {item.risk}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightSidebar;
