import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

export interface ToxicEdgeData { is_violation?: boolean; }

const ToxicEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, markerEnd,
}: EdgeProps<ToxicEdgeData>) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const isViolation = data?.is_violation;

  if (isViolation) {
    return (
      <>
        {/* outer glow */}
        <path d={edgePath} fill="none" stroke="#FF3B5C" strokeWidth={12} strokeOpacity={0.08} strokeLinecap="round" />
        {/* mid glow */}
        <path d={edgePath} fill="none" stroke="#FF3B5C" strokeWidth={5} strokeOpacity={0.25} strokeLinecap="round" className="animate-pulse" />
        {/* core marching ants */}
        <path id={id} className="react-flow__edge-path marching-ants" d={edgePath}
          stroke="#FF3B5C" strokeWidth={1.5} strokeDasharray="6 4" fill="none" markerEnd={markerEnd}
        />
      </>
    );
  }

  return (
    <path id={id} className="react-flow__edge-path" d={edgePath}
      stroke="rgba(100,116,139,0.35)" strokeWidth={1.5} fill="none" markerEnd={markerEnd}
    />
  );
};

export default ToxicEdge;
