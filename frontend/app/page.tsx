"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  BackgroundVariant, 
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertTriangle, GitMerge, FileWarning, TrendingDown, Cpu, Activity, Bot, Search, GitBranch, CheckCircle } from 'lucide-react';
import dagre from 'dagre';

// --- Types ---
interface HealthMetrics {
  overall_score: number;
  complexity_total: number;
  dependency_cycles: number;
}
interface TimelineCommit {
  commit_hash: string;
  timestamp: string;
  author: string;
  health_metrics: HealthMetrics;
}
interface GraphState {
  nodes: any[];
  edges: any[];
}
interface LLMTrigger {
  anomaly_detected: boolean;
  trigger_reason: string;
  explanation?: string;
  git_diff_snippet?: string;
  topological_delta?: string;
}
interface CommitDetails {
  commit_hash: string;
  timestamp: string;
  author: string;
  health_metrics: HealthMetrics;
  graph_state: GraphState;
  llm_trigger_payload: LLMTrigger;
}

// --- Custom Node (Deterministic structural metrics) ---
const CustomNode = ({ data }: any) => {
  const isHighRisk = data.complexity_score > 15;
  const isBusFactorCritical = data.bus_factor === 1.0;

  const borderColor = isHighRisk ? 'border-[#FF3B5C]' : isBusFactorCritical ? 'border-[#FF8C00]' : 'border-[#3B82F6]';
  const bgColor = isHighRisk ? 'bg-[#FF3B5C]/10' : isBusFactorCritical ? 'bg-[#FF8C00]/10' : 'bg-[#3B82F6]/10';

  return (
    <div className={`px-4 py-2 shadow-xl rounded-md border ${borderColor} ${bgColor} backdrop-blur-md min-w-[120px]`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-400 border-none" />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white truncate">{data.label}</span>
          {isBusFactorCritical && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#FF8C00]/30 text-[#FF8C00] border border-[#FF8C00]/50 shrink-0" title="Bus Factor Risk: 1 Author">
              BF:1
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-300 font-mono">Cx: {data.complexity_score}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-slate-400 border-none" />
    </div>
  );
};

// --- Custom Edge (The Flashing Red Line for Violations) ---
const ToxicEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }: any) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: '#FF3B5C', strokeWidth: 2 }} />
      {/* Animated glowing overlay for architectural decay */}
      <path d={edgePath} fill="none" stroke="#FF3B5C" strokeWidth={6} className="animate-pulse opacity-40 blur-sm" />
    </>
  );
};

const nodeTypes = { custom: CustomNode }; // 'default' is reserved by ReactFlow — must use custom key
const edgeTypes = { toxic: ToxicEdge };

// --- Smart Layout Engine ---
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });

  // 1. Separate isolated nodes from connected nodes
  const connectedNodeIds = new Set<string>();
  edges.forEach(e => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  const connectedNodes = nodes.filter(n => connectedNodeIds.has(n.id));
  const isolatedNodes = nodes.filter(n => !connectedNodeIds.has(n.id));

  // 2. Layout connected nodes with Dagre
  connectedNodes.forEach((node) => dagreGraph.setNode(node.id, { width: 160, height: 60 }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);

  connectedNodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = { x: nodeWithPosition.x - 80, y: nodeWithPosition.y - 30 };
  });

  // 3. Find the bottom of the Dagre graph to start our grid
  let maxY = 0;
  connectedNodes.forEach(n => { if (n.position.y > maxY) maxY = n.position.y; });

  // 4. Layout isolated nodes in a neat wrapping grid below the tree
  const gridStartY = connectedNodes.length > 0 ? maxY + 150 : 0;
  const cols = Math.max(1, Math.floor(Math.sqrt(isolatedNodes.length)));
  const nodeWidth = 180;
  const nodeHeight = 80;

  isolatedNodes.forEach((node, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = { x: col * nodeWidth, y: gridStartY + row * nodeHeight };
  });

  return { nodes: [...connectedNodes, ...isolatedNodes], edges };
};

export default function RepoHealthDashboard() {
  const [timelineData, setTimelineData] = useState<TimelineCommit[]>([]);
  const [selectedCommitId, setSelectedCommitId] = useState<string>('');
  const [commitDetails, setCommitDetails] = useState<CommitDetails | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [repoUrl, setRepoUrl] = useState('');
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle'|'cloning'|'analyzing'|'done'|'error'>('idle');
  const [analyzeMessage, setAnalyzeMessage] = useState('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTimeline = useCallback(() => {
    fetch('http://localhost:8000/api/timeline')
      .then(res => res.json())
      .then((data: TimelineCommit[]) => {
        setTimelineData(data);
        if (data.length > 0) setSelectedCommitId(data[data.length - 1].commit_hash);
        setLoadingTimeline(false);
      })
      .catch(err => { console.error('Failed to load timeline', err); setLoadingTimeline(false); });
  }, []);

  const startAnalysis = useCallback(() => {
    if (!repoUrl.trim()) return;
    setAnalyzeStatus('cloning');
    setAnalyzeMessage('Starting deterministic analysis...');
    fetch('http://localhost:8000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl.trim(), max_commits: 600 }),
    })
    .then(res => { if (!res.ok) return res.json().then(e => Promise.reject(e.detail)); return res.json(); })
    .then(() => {
      pollRef.current = setInterval(() => {
        fetch('http://localhost:8000/api/analyze/status')
          .then(r => r.json())
          .then(s => {
            setAnalyzeStatus(s.status);
            setAnalyzeMessage(s.message);
            if (s.status === 'done') {
              clearInterval(pollRef.current!);
              fetchTimeline();
            }
            if (s.status === 'error') clearInterval(pollRef.current!);
          });
      }, 2000);
    })
    .catch(err => { setAnalyzeStatus('error'); setAnalyzeMessage(String(err)); });
  }, [repoUrl, fetchTimeline]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  useEffect(() => {
    if (!selectedCommitId) return;
    setLoadingDetails(true);
    fetch(`http://localhost:8000/api/commit/${selectedCommitId}`)
      .then(res => res.json())
      .then((data: CommitDetails) => { setCommitDetails(data); setLoadingDetails(false); })
      .catch(err => { console.error('Failed to load commit details', err); setLoadingDetails(false); });
  }, [selectedCommitId]);

  const isAnalyzing = analyzeStatus === 'cloning' || analyzeStatus === 'analyzing';

  if (loadingTimeline && analyzeStatus === 'idle') {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white font-mono">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-[#3B82F6] animate-ping rounded-full" />
          <span className="text-sm tracking-widest text-slate-400">INITIALIZING DETERMINISTIC PIPELINE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <header className="shrink-0 border-b border-white/10 bg-neutral-900/50 backdrop-blur-md z-10">
        <div className="h-14 flex items-center px-6 justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#3B82F6]" />
            <h1 className="text-sm font-bold tracking-widest uppercase text-white">Surgical AI: Architecture Health</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-400">
              {timelineData.length} Commits Ingested ($0 Cost)
            </div>
          </div>
        </div>

        <div className="h-12 flex items-center px-6 gap-3 border-t border-white/5">
          <GitBranch className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Paste a public GitHub URL (e.g. https://github.com/langgenius/dify)"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isAnalyzing && startAnalysis()}
            disabled={isAnalyzing}
            className="flex-1 bg-transparent text-xs font-mono text-slate-300 placeholder-slate-600 outline-none disabled:opacity-50"
          />
          {analyzeMessage && (
            <span className={`text-[10px] font-mono truncate max-w-xs ${
              analyzeStatus === 'error' ? 'text-[#FF3B5C]' : analyzeStatus === 'done' ? 'text-[#00FF88]' : 'text-[#3B82F6]'
            }`}>
              {analyzeStatus === 'done' && <CheckCircle className="w-3 h-3 inline mr-1" />}
              {analyzeMessage}
            </span>
          )}
          <button
            onClick={startAnalysis}
            disabled={isAnalyzing || !repoUrl.trim()}
            className="shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all"
          >
            {isAnalyzing ? <><Activity className="w-3 h-3 animate-spin" />Processing...</> : <><Search className="w-3 h-3" />Analyze Deterministically</>}
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Column: KPIs & Timeline */}
        <div className="w-[30%] shrink-0 flex flex-col border-r border-white/10 bg-neutral-900/30 overflow-hidden">
          <div className="p-5 flex flex-col gap-4 shrink-0 border-b border-white/10">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">Deterministic Math Engine</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#3B82F6]/10 rounded-full blur-2xl transition-all" />
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Health Score</span>
                </div>
                <div className="text-3xl font-light font-mono text-white">
                  {commitDetails?.health_metrics.overall_score.toFixed(1) || '--'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF8C00]/10 rounded-full blur-2xl transition-all" />
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-[#FF8C00]" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Complexity</span>
                </div>
                <div className="text-3xl font-light font-mono text-white">
                  {commitDetails?.health_metrics.complexity_total || 0}
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF3B5C]/10 rounded-full blur-2xl transition-all" />
              <div className="flex items-center gap-2 mb-2">
                <GitMerge className="w-4 h-4 text-[#FF3B5C]" />
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Dependency Cycles</span>
              </div>
              <div className="text-3xl font-light font-mono text-white">
                {commitDetails?.health_metrics.dependency_cycles || 0}
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 flex flex-col min-h-0">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4 shrink-0">Time-Series Decay</h2>
            <div className="w-full h-[300px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} onClick={(e: any) => e?.activePayload && setSelectedCommitId(e.activePayload[0].payload.commit_hash)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="commit_hash" tickFormatter={(hash) => hash.substring(0, 6)} stroke="rgba(255,255,255,0.2)" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} minTickGap={30} />
                  <YAxis domain={['auto', 100]} stroke="rgba(255,255,255,0.2)" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff', fontFamily: 'monospace' }} labelFormatter={(label) => `Commit: ${label.substring(0, 8)}`} />
                  <Line type="monotone" dataKey="health_metrics.overall_score" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Center Column: React Flow Graph */}
        <div className="w-[45%] shrink-0 flex flex-col border-r border-white/10 bg-[#020202] relative">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-2xl">
            <div className={`w-2 h-2 rounded-full ${loadingDetails ? 'bg-[#FF8C00] animate-pulse' : 'bg-[#00FF88]'}`} />
            <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">
              {loadingDetails ? 'Parsing Topology...' : `Commit: ${selectedCommitId.substring(0, 8)}`}
            </span>
          </div>
          <div className="flex-1 w-full h-full">
            <ReactFlowProvider>
              <FlowCanvas graphState={commitDetails?.graph_state} />
            </ReactFlowProvider>
          </div>
        </div>

        {/* Right Column: AI Risk Center */}
        <div className="flex-1 flex flex-col bg-neutral-900/30 overflow-y-auto">
          {commitDetails && <SidebarContent commitDetails={commitDetails} />}
        </div>
      </div>
    </div>
  );
}

// --- React Flow Implementation ---
function FlowCanvas({ graphState }: { graphState?: GraphState }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!graphState) return;

    const mappedNodes: Node[] = graphState.nodes.map(n => ({
      id: n.id,
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        label: n.data?.label || n.id,
        complexity_score: n.data?.complexity_score || 0,
        bus_factor: n.data?.bus_factor || 10
      }
    }));

    const mappedEdges: Edge[] = graphState.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.is_violation ? 'toxic' : 'default',
      animated: e.is_violation, // Standard moving dashes
      style: { stroke: e.is_violation ? '#FF3B5C' : '#334155', strokeWidth: e.is_violation ? 2 : 1 },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(mappedNodes, mappedEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [graphState, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
      <Controls className="bg-neutral-900 border border-white/10 fill-white" showInteractive={false} />
    </ReactFlow>
  );
}

// --- Right Sidebar Content ---
function SidebarContent({ commitDetails }: { commitDetails: CommitDetails }) {
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Reset LLM text when switching commits
  useEffect(() => { setLlmExplanation(null); }, [commitDetails.commit_hash]);

  const isAnomaly = commitDetails.llm_trigger_payload?.anomaly_detected;
  const triggerPayload = commitDetails.llm_trigger_payload;

  const handleExplain = async () => {
    if (!triggerPayload.git_diff_snippet) return;
    setIsExplaining(true);
    try {
      const res = await fetch('http://localhost:8000/api/explain-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          git_diff_snippet: triggerPayload.git_diff_snippet,
          trigger_reason: triggerPayload.trigger_reason,
          topological_delta: triggerPayload.topological_delta || null,
        })
      });
      const data = await res.json();
      setLlmExplanation(data.explanation);
    } catch (err) {
      console.error(err);
      setLlmExplanation("Failed to connect to LLM. Check backend.");
    } finally {
      setIsExplaining(false);
    }
  };
  
  const topHotspots = useMemo(() => {
    return [...(commitDetails.graph_state?.nodes || [])]
      .sort((a, b) => (b.data?.complexity_score || 0) - (a.data?.complexity_score || 0))
      .slice(0, 5)
      .map(n => ({ name: n.data?.label || n.id, score: n.data?.complexity_score || 0 }));
  }, [commitDetails.graph_state]);

  const circularDependencies = useMemo(() => {
    return (commitDetails.graph_state?.edges || [])
      .filter(edge => edge.is_violation)
      .map(edge => ({ source: edge.source.split('/').pop(), target: edge.target.split('/').pop() }));
  }, [commitDetails.graph_state]);

  return (
    <div className="p-5 flex flex-col gap-6">
      
      {/* Surgical AI Invocation */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#A855F7]" />
          Surgical AI Strike
        </h2>
        
        {isAnomaly ? (
          <div className="p-4 rounded-xl bg-[rgba(255,59,92,0.05)] border border-[#FF3B5C]/30 relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#FF3B5C] animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider text-[#FF3B5C] uppercase">
                Structural Break Detected
              </span>
            </div>
            
            <p className="text-xs text-slate-400 font-mono mb-4 border-l-2 border-white/10 pl-2">
              {triggerPayload.trigger_reason}
            </p>

            {llmExplanation ? (
              <div className="bg-black/30 p-3 rounded border border-[#A855F7]/30 text-sm text-slate-200">
                <span className="text-[#A855F7] font-bold text-xs mr-2">LLM:</span>
                {llmExplanation}
              </div>
            ) : (
              <button 
                onClick={handleExplain}
                disabled={isExplaining}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-[#A855F7]/20 hover:bg-[#A855F7]/40 border border-[#A855F7]/50 text-white text-xs font-bold transition-all"
              >
                {isExplaining ? (
                  <><Activity className="w-3 h-3 animate-spin" /> Calling Gemini 1.5 Flash...</>
                ) : (
                  <>Explain Anomaly (Cost: ~$0.0001)</>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00FF88]" />
            <p className="text-sm text-slate-400">Architecture is stable. No LLM tokens spent.</p>
          </div>
        )}
      </div>

      {/* Hotspots */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
          <FileWarning className="w-4 h-4 text-[#FF8C00]" />
          Complexity Hotspots
        </h2>
        <div className="flex flex-col gap-2">
          {topHotspots.map((h, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-500 font-mono w-4 shrink-0">0{i + 1}</span>
              <span className="flex-1 text-sm text-slate-200 font-mono truncate">{h.name}</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${h.score > 15 ? 'bg-[#FF8C00]/20 text-[#FF8C00]' : 'bg-[#3B82F6]/20 text-[#3B82F6]'}`}>
                {h.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cycles */}
      {circularDependencies.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-[#FF3B5C]" />
            Active Cycles
          </h2>
          <div className="flex flex-col gap-2">
            {circularDependencies.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,59,92,0.05)] border border-[#FF3B5C]/30">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-mono text-slate-300 truncate">{c.source}</span>
                  <span className="text-[#FF3B5C] shrink-0">↔</span>
                  <span className="text-xs font-mono text-slate-300 truncate">{c.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
