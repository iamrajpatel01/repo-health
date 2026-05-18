"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export interface TimelineDataPoint {
  commitId: string;
  date: string;
  healthScore: number;
}

interface HealthTimelineProps {
  data: TimelineDataPoint[];
  activeCommitId: string;
  onCommitSelect: (commitId: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const color = v >= 80 ? '#00FF88' : v >= 60 ? '#FF8C00' : '#FF3B5C';
  return (
    <div className="glass-elevated px-3 py-2 text-xs border-[rgba(255,255,255,0.08)]">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-mono font-bold" style={{ color }}>Score: {v}</p>
    </div>
  );
};

const HealthTimeline: React.FC<HealthTimelineProps> = ({ data, activeCommitId, onCommitSelect }) => {
  return (
    <div className="glass h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#00A3FF]" />
          Health Trend
        </h3>
        <span className="text-[10px] font-mono text-slate-500">Click commit to inspect</span>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            onClick={(e: any) => {
              if (e?.activePayload?.[0]) onCommitSelect(e.activePayload[0].payload.commitId);
            }}
          >
            <defs>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A3FF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00A3FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,163,255,0.3)', strokeWidth: 1, strokeDasharray: '4 2' }} />
            <Area
              type="monotone"
              dataKey="healthScore"
              stroke="#00A3FF"
              strokeWidth={2}
              fill="url(#healthGrad)"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isActive = payload.commitId === activeCommitId;
                return (
                  <circle key={payload.commitId} cx={cx} cy={cy}
                    r={isActive ? 5 : 3}
                    fill={isActive ? '#00FF88' : '#0A1628'}
                    stroke={isActive ? '#00FF88' : '#00A3FF'}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="cursor-pointer"
                    style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(0,255,136,0.8))' : undefined }}
                  />
                );
              }}
              activeDot={{ r: 5, fill: '#00FF88', stroke: '#00FF88', className: 'cursor-pointer' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HealthTimeline;
