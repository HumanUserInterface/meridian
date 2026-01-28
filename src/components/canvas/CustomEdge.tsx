'use client';

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
} from '@xyflow/react';
import { LinkType } from '@/types';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface CustomEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: {
    linkType?: LinkType;
    anchorText?: string;
    isPlanned?: boolean;
    [key: string]: unknown;
  };
  selected?: boolean;
}

const linkTypeConfig: Record<LinkType, { color: string; label: string }> = {
  contextual: { color: '#3B82F6', label: 'CTX' },
  navigation: { color: '#10B981', label: 'NAV' },
  related: { color: '#8B5CF6', label: 'REL' },
  breadcrumb: { color: '#F59E0B', label: 'BC' },
  cta: { color: '#EF4444', label: 'CTA' },
};

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: CustomEdgeProps) {
  const { setSelectedEdgeId } = useUIStore();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const linkType = data?.linkType || 'contextual';
  const config = linkTypeConfig[linkType];
  const isPlanned = data?.isPlanned ?? true;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEdgeId(id);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: config.color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: isPlanned ? '5,5' : undefined,
        }}
        interactionWidth={20}
      />
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="cursor-pointer"
        onClick={handleClick}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-all',
            'bg-white border shadow-sm',
            selected && 'ring-2 ring-blue-400'
          )}
          onClick={handleClick}
        >
          <span style={{ color: config.color }}>{config.label}</span>
          {data?.anchorText && (
            <span className="ml-1 text-gray-500 truncate max-w-[100px] inline-block align-middle">
              {data.anchorText}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(CustomEdge);
