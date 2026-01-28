'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeType, ContentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Layers,
  FileText,
  ExternalLink,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

interface CustomNodeProps {
  id: string;
  data: {
    title: string;
    nodeType: NodeType;
    primaryKeyword?: string;
    status: ContentStatus;
    wordCountTarget?: number;
    wordCountActual?: number;
    tags: string[];
    [key: string]: unknown;
  };
  selected?: boolean;
}

const nodeTypeConfig: Record<NodeType, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  pillar: {
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  cluster: {
    icon: Layers,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
  },
  supporting: {
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-400',
  },
  external: {
    icon: ExternalLink,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
  },
  orphan: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-slate-100 text-slate-700' },
  draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-700' },
  review: { label: 'Review', color: 'bg-orange-100 text-orange-700' },
  published: { label: 'Published', color: 'bg-green-100 text-green-700' },
  'needs-update': { label: 'Needs Update', color: 'bg-red-100 text-red-700' },
};

function CustomNode({ id, data, selected }: CustomNodeProps) {
  const { deleteNode, duplicateNode } = useProjectStore();
  const { setSelectedNodeId } = useUIStore();

  const nodeType = data.nodeType || 'supporting';
  const config = nodeTypeConfig[nodeType];
  const Icon = config.icon;
  const status = statusConfig[data.status] || statusConfig.planned;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleSelect = () => {
    setSelectedNodeId(id);
  };

  return (
    <div
      onClick={handleSelect}
      className={cn(
        'min-w-[220px] max-w-[280px] rounded-lg border-2 shadow-md transition-all',
        config.bgColor,
        config.borderColor,
        selected && 'ring-2 ring-blue-400 ring-offset-2',
        nodeType === 'pillar' && 'min-w-[260px]'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className={cn('flex items-center justify-between px-3 py-2 border-b', config.borderColor)}>
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', config.color)} />
          <span className={cn('text-xs font-semibold uppercase tracking-wide', config.color)}>
            {nodeType}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">
          {data.title || 'Untitled Page'}
        </h3>

        {data.primaryKeyword && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span className="text-gray-400">Keyword:</span>
            <span className="font-medium truncate">{data.primaryKeyword}</span>
          </div>
        )}

        {(data.wordCountTarget || data.wordCountActual) && (
          <div className="text-xs text-gray-500">
            {data.wordCountActual ? `${data.wordCountActual.toLocaleString()} words` : `Target: ${data.wordCountTarget?.toLocaleString()} words`}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Badge variant="secondary" className={cn('text-xs', status.color)}>
            {status.label}
          </Badge>
          {data.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
}

export default memo(CustomNode);
