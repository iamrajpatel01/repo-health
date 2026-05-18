"use client";

import React, { useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, useNodesState, useEdgesState, useReactFlow, BackgroundVariant, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import FileNode from './FileNode';
import ToxicEdge from './ToxicEdge';
import { getLayoutedElements } from './layoutUtils';
import { GitBranch } from 'lucide-react';

const nodeTypes = { fileNode: FileNode };
const edgeTypes = { toxicEdge: ToxicEdge };

interface KnowledgeGraphProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  activeCommitId: string;
}

function GraphCanvas({ initialNodes, initialEdges, activeCommitId }: KnowledgeGraphProps) {
  const { nodes: ln, edges: le } = useMemo(() => getLayoutedElements(initialNodes, initialEdges), [initialNodes, initialEdges]);
  const [nodes, , onNodesChange] = useNodesState(ln);
  const [edges, , onEdgesChange] = useEdgesState(le);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.3, duration: 600 }), 100);
    return () => clearTimeout(t);
  }, [initialNodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      nodeTypes={nodeTypes} edgeTypes={edgeTypes}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      fitView proOptions={{ hideAttribution: true }}
      minZoom={0.3} maxZoom={2.5}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.035)" />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => {
          if (n.data?.architectural_drift) return '#FF3B5C';
          if (n.data?.is_target_file) return '#FF8C00';
          if (n.data?.anomaly_active) return '#475569';
          return '#1e293b';
        }}
        maskColor="rgba(5,11,23,0.85)"
        style={{ background: 'rgba(5,11,23,0.92)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
      />
    </ReactFlow>
  );
}

export default function KnowledgeGraph(props: KnowledgeGraphProps) {
  return (
    <div className="h-full w-full flex flex-col glass overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#050B17]/70">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#00A3FF]" />
          System Architecture Topology
          <span className="font-mono text-slate-600 ml-1">#{props.activeCommitId}</span>
        </h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><span className="w-2 h-2 rounded-full bg-[#FF3B5C] inline-block"></span>Drift</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><span className="w-2 h-2 rounded-full bg-[#FF8C00] inline-block"></span>Hotspot</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><span className="w-2 h-2 rounded-full bg-[#334155] inline-block"></span>Stable</span>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <GraphCanvas {...props} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
