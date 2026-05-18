"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface KPICardProps {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  glowClass: string;
  trend?: string;
  trendUp?: boolean;
}

const KPICard = ({ label, value, sub, color, glowClass, trend, trendUp }: KPICardProps) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    className={`glass relative overflow-hidden p-4 cursor-default group hover:${glowClass} transition-all duration-300`}
  >
    {/* background halo */}
    <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
    
    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">{label}</p>
    <div className="flex items-end justify-between">
      <span className={`text-3xl font-mono font-black tracking-tighter ${color.replace('bg-', 'text-')}`}>{value}</span>
      {trend && (
        <span className={`text-xs font-mono mb-0.5 ${trendUp ? 'text-[#00FF88]' : 'text-[#FF3B5C]'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
    <p className="text-[11px] text-slate-600 mt-1">{sub}</p>
  </motion.div>
);

const MetricCards = () => {
  const cards: KPICardProps[] = [
    { label: 'Repo Health Score', value: '88', sub: 'Target: > 90', color: 'bg-[#00FF88] text-[#00FF88]', glowClass: 'glow-green', trend: '2.1%', trendUp: true },
    { label: 'Critical Dependencies', value: '3', sub: 'Requires immediate review', color: 'bg-[#FF3B5C] text-[#FF3B5C]', glowClass: 'glow-red', trend: '1 new', trendUp: false },
    { label: 'Circular Dependencies', value: '2', sub: 'Refactor advised', color: 'bg-[#FF8C00] text-[#FF8C00]', glowClass: 'glow-orange' },
    { label: 'Architectural Drift', value: '5', sub: 'Events this cycle', color: 'bg-[#A855F7] text-[#A855F7]', glowClass: 'glow-blue', trend: '3 new', trendUp: false },
    { label: 'Bus Factor Alerts', value: '1', sub: 'Knowledge silo detected', color: 'bg-[#FF8C00] text-[#FF8C00]', glowClass: 'glow-orange' },
    { label: 'Hotspot Modules', value: '7', sub: 'High churn files', color: 'bg-[#00A3FF] text-[#00A3FF]', glowClass: 'glow-blue', trend: '2 resolved', trendUp: true },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c, i) => <KPICard key={i} {...c} />)}
    </div>
  );
};

export default MetricCards;
