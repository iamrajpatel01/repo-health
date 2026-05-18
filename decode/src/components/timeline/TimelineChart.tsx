"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
  XAxis,
  YAxis
} from 'recharts';
import { useDashboard } from '@/context/DashboardContext';
import { computeBollingerBands, BollingerPoint } from '@/lib/bollinger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: BollingerPoint = payload[0].payload;
    const isAnomaly = data.is_anomaly;
    
    return (
      <div className="bg-zinc-950/95 backdrop-blur border border-zinc-700 p-4 rounded shadow-2xl font-mono text-sm min-w-[280px] z-50 relative pointer-events-auto">
        <div className="text-zinc-400 mb-3 pb-3 border-b border-zinc-800/80 flex justify-between items-center">
          <span className="font-semibold text-zinc-300">{new Date(data.timestamp).toLocaleString()}</span>
          <span className="text-zinc-500 text-xs px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800">{data.commit_hash}</span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Health Score</span>
            <span className={`font-bold text-lg ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>
              {data.value.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Volatility Band</span>
            <span className="text-zinc-400 text-xs">
              {data.lower.toFixed(1)} <span className="text-zinc-600">→</span> {data.upper.toFixed(1)}
            </span>
          </div>
        </div>

        {isAnomaly && (
          <div className="mb-4 p-2 bg-red-950/20 border border-red-900/30 rounded">
            <div className="text-red-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Structural Break Detected
            </div>
            <div className="text-red-300/70 text-[10px] mt-1 leading-tight">
              Critical Risk Exposure. Volatility Spike outside 2σ lower band.
            </div>
          </div>
        )}

        <Link 
          href={`/commits/${data.commit_hash}`}
          className={`block w-full py-1.5 text-center text-xs font-bold uppercase tracking-widest rounded border transition-colors ${
            isAnomaly 
              ? 'bg-red-950/40 border-red-900/50 text-red-400 hover:bg-red-900/40' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          Investigate Commit →
        </Link>
      </div>
    );
  }
  return null;
};

export function TimelineChart() {
  const { timelineData, selectedCommit, setSelectedCommit } = useDashboard();

  const chartData = useMemo(() => {
    return computeBollingerBands(timelineData);
  }, [timelineData]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 mb-6 shadow-sm">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-zinc-100 font-mono font-semibold uppercase tracking-wider text-sm flex items-center gap-2">
            Codebase Volatility Index (VIX)
          </h2>
          <p className="text-zinc-500 font-mono text-xs mt-1">
            Bollinger Bands (20, 2σ) — structural anomaly detection
          </p>
        </div>
      </div>
      
      <div className="h-64 w-full cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                const data = e.activePayload[0].payload;
                setSelectedCommit(data.commit_hash);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              hide 
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#52525b"
              tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {/* Volatility Band Area */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#3f3f46"
              fillOpacity={0.1}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#18181b" // Match background to "cut out" the bottom
              fillOpacity={1}
              isAnimationActive={false}
            />
            
            {/* Bollinger Bands */}
            <Line 
              type="monotone" 
              dataKey="upper" 
              stroke="#52525b" 
              strokeWidth={1} 
              dot={false}
              isAnimationActive={false} 
            />
            <Line 
              type="monotone" 
              dataKey="lower" 
              stroke="#52525b" 
              strokeWidth={1} 
              dot={false} 
              isAnimationActive={false}
            />
            
            {/* SMA Line */}
            <Line 
              type="monotone" 
              dataKey="sma" 
              stroke="#71717a" 
              strokeWidth={1} 
              strokeDasharray="3 3"
              dot={false} 
              isAnimationActive={false}
            />
            
            {/* Actual Health Score Line */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={{ r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
              isAnimationActive={false}
            />

            {/* Anomaly Markers (Structural Breaks) */}
            {chartData.map((entry, index) => {
              if (entry.is_anomaly) {
                return (
                  <ReferenceDot 
                    key={`anomaly-${index}`}
                    x={entry.timestamp}
                    y={entry.value}
                    r={3}
                    fill="#ef4444"
                    stroke="#7f1d1d"
                    strokeWidth={1}
                    className="animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  />
                );
              }
              return null;
            })}

            {/* Selected Commit Marker */}
            {selectedCommit && (
              <ReferenceDot 
                x={selectedCommit.timestamp}
                y={selectedCommit.health_metrics.overall_score}
                r={5}
                fill="#3b82f6"
                stroke="#1e3a8a"
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
