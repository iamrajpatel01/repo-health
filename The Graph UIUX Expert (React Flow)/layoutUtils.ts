import dagre from 'dagre';
import { Node, Edge } from 'reactflow';

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Set graph configuration with explicit node separation to avoid crowding
  dagreGraph.setGraph({
    rankdir: direction, // Directed top-to-bottom hierarchy
    nodesep: 80,        // Explicit node separation spacing
    ranksep: 120,       // Explicit rank separation spacing
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    // We assume an average node width and height for layouting calculation
    dagreGraph.setNode(node.id, { width: 250, height: 100 });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Map updated positions back to react flow nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Shift dagre node position (anchor=center center) to React Flow (anchor=top left)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 125, // half of width
        y: nodeWithPosition.y - 50,  // half of height
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
