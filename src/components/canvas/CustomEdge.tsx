'use client';

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  Position,
} from '@xyflow/react';
import { LinkType } from '@/types';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const linkTypeConfig: Record<LinkType, { color: string; label: string; fullLabel: string }> = {
  contextual: { color: '#3B82F6', label: 'CTX', fullLabel: 'Contextual' },
  navigation: { color: '#10B981', label: 'NAV', fullLabel: 'Navigation' },
  related: { color: '#8B5CF6', label: 'REL', fullLabel: 'Related' },
  breadcrumb: { color: '#F59E0B', label: 'BC', fullLabel: 'Breadcrumb' },
  cta: { color: '#EF4444', label: 'CTA', fullLabel: 'Call to Action' },
};

const linkTypeOrder: LinkType[] = ['contextual', 'navigation', 'related', 'breadcrumb', 'cta'];

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
  const { updateEdge, project } = useProjectStore();

  const linkStyle = project.settings?.linkStyle || 'smooth';

  // Use different path based on link style setting
  const [edgePath, labelX, labelY] = linkStyle === 'orthogonal'
    ? getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
      })
    : getBezierPath({
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

  const handleLinkTypeChange = (newType: LinkType) => {
    updateEdge(id, { linkType: newType });
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
          className="nodrag nopan"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdgeId(id);
                }}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-all',
                  'bg-white border shadow-sm hover:shadow-md',
                  selected && 'ring-2 ring-blue-400'
                )}
              >
                <span style={{ color: config.color }}>{config.label}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" onClick={(e) => e.stopPropagation()}>
              {linkTypeOrder.map((type) => {
                const typeConfig = linkTypeConfig[type];
                return (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => handleLinkTypeChange(type)}
                    className={cn(linkType === type && 'bg-gray-100')}
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: typeConfig.color }}
                    />
                    {typeConfig.fullLabel}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(CustomEdge);
