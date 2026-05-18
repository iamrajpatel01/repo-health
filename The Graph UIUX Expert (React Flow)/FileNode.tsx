import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface FileNodeData {
  label: string;
  complexity_score?: number;
  bus_factor?: number;
  anomaly_active?: boolean;
  is_target_file?: boolean;
  architectural_drift?: boolean;
}

const FileNode = ({ data, selected }: NodeProps<FileNodeData>) => {
  const { label, complexity_score: cs = 0, bus_factor: bf = 0, anomaly_active, is_target_file, architectural_drift } = data;

  const isDangerous = is_target_file || architectural_drift;
  const isDimmed = anomaly_active && !is_target_file && !architectural_drift;

  const scoreColor = cs >= 75 ? '#FF3B5C' : cs >= 50 ? '#FF8C00' : '#00FF88';
  const borderColor = architectural_drift ? '#FF3B5C' : is_target_file ? '#FF8C00' : 'rgba(255,255,255,0.08)';
  const glowStyle = architectural_drift
    ? { boxShadow: '0 0 20px rgba(255,59,92,0.5), 0 0 40px rgba(255,59,92,0.2)' }
    : is_target_file
    ? { boxShadow: '0 0 16px rgba(255,140,0,0.4)' }
    : {};

  return (
    <div
      className="relative transition-all duration-300"
      style={{
        opacity: isDimmed ? 0.18 : 1,
        filter: isDimmed ? 'blur(1px)' : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ width: 6, height: 6, background: borderColor, border: 'none', top: -3 }} />

      {/* Pulse ring for hotspot */}
      {isDangerous && (
        <div className="absolute -inset-3 rounded-2xl pulse-ring pointer-events-none"
          style={{ background: `radial-gradient(circle, ${architectural_drift ? 'rgba(255,59,92,0.12)' : 'rgba(255,140,0,0.1)'} 0%, transparent 70%)` }}
        />
      )}

      <div
        className="relative rounded-xl px-4 py-3 min-w-[140px] cursor-pointer"
        style={{
          background: 'rgba(8,16,35,0.9)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${borderColor}`,
          ...glowStyle,
        }}
      >
        {/* Drift/Bus badge */}
        {(architectural_drift || (bf && bf > 0.8)) && (
          <div className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: architectural_drift ? 'rgba(255,59,92,0.15)' : 'rgba(255,140,0,0.15)',
              border: `1px solid ${architectural_drift ? 'rgba(255,59,92,0.4)' : 'rgba(255,140,0,0.4)'}`,
              color: architectural_drift ? '#FF3B5C' : '#FF8C00',
            }}
          >
            {architectural_drift ? '⚠ Drift' : '⚡ Bus Risk'}
          </div>
        )}

        {/* Module name */}
        <p className="text-xs font-mono font-semibold text-slate-200 mb-2 truncate max-w-[140px]">{label}</p>

        {/* Score bar */}
        {cs > 0 && (
          <div className="mb-2">
            <div className="flex justify-between text-[9px] mb-1">
              <span className="text-slate-600 uppercase tracking-wider">Complexity</span>
              <span className="font-mono font-bold" style={{ color: scoreColor }}>{cs}</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cs}%`, backgroundColor: scoreColor, boxShadow: `0 0 4px ${scoreColor}` }} />
            </div>
          </div>
        )}

        {/* Footer stats */}
        {bf > 0 && (
          <p className="text-[9px] text-slate-600 font-mono">
            Bus factor: <span className="text-slate-400">{(bf * 10).toFixed(1)}</span>
          </p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ width: 6, height: 6, background: borderColor, border: 'none', bottom: -3 }} />
    </div>
  );
};

export default FileNode;
