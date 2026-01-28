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
  Home,
  Package,
  FolderOpen,
  Navigation,
  Newspaper,
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

const nodeTypeConfig: Record<NodeType, { icon: React.ElementType; color: string; bgColor: string; borderColor: string; titleBgColor: string }> = {
  pillar: {
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    titleBgColor: 'bg-blue-100',
  },
  cluster: {
    icon: Layers,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    titleBgColor: 'bg-emerald-100',
  },
  supporting: {
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-400',
    titleBgColor: 'bg-gray-100',
  },
  external: {
    icon: ExternalLink,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    titleBgColor: 'bg-purple-100',
  },
  orphan: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    titleBgColor: 'bg-red-100',
  },
  homepage: {
    icon: Home,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-500',
    titleBgColor: 'bg-indigo-100',
  },
  product: {
    icon: Package,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
    titleBgColor: 'bg-amber-100',
  },
  category: {
    icon: FolderOpen,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-500',
    titleBgColor: 'bg-cyan-100',
  },
  navpage: {
    icon: Navigation,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    titleBgColor: 'bg-slate-100',
  },
  blog: {
    icon: Newspaper,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-500',
    titleBgColor: 'bg-rose-100',
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-slate-100 text-slate-700' },
  draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-700' },
  review: { label: 'Review', color: 'bg-orange-100 text-orange-700' },
  published: { label: 'Published', color: 'bg-green-100 text-green-700' },
  'needs-update': { label: 'Needs Update', color: 'bg-red-100 text-red-700' },
};

const statusOrder: ContentStatus[] = ['planned', 'draft', 'review', 'published', 'needs-update'];

function CustomNode({ id, data, selected }: CustomNodeProps) {
  const { deleteNode, duplicateNode, updateNode } = useProjectStore();
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

  const handleStatusChange = (newStatus: ContentStatus) => {
    updateNode(id, { status: newStatus });
  };

  const slug = data.slug as string | undefined;

  return (
    <div
      onClick={handleSelect}
      className={cn(
        'min-w-[220px] max-w-[280px] rounded-lg border-2 shadow-md transition-all overflow-hidden',
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
            {nodeType === 'navpage' ? 'Nav Page' : nodeType}
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

      {/* Title Section with colored background */}
      <div className={cn('px-3 py-2 border-b', config.titleBgColor, config.borderColor)}>
        <h3 className={cn('font-semibold leading-tight line-clamp-2', config.color)}>
          {data.title || 'Untitled Page'}
        </h3>
        {slug && (
          <p className="text-xs text-gray-500 mt-1 truncate font-mono">
            /{slug}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {data.primaryKeyword && (
          <div className="text-xs text-gray-600 truncate">
            <span className="text-gray-400">Keyword: </span>
            <span className="font-medium">{data.primaryKeyword}</span>
          </div>
        )}

        {/* Clickable Status Badge */}
        <div className="pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="focus:outline-none"
              >
                <Badge
                  variant="secondary"
                  className={cn('text-xs cursor-pointer hover:opacity-80 transition-opacity', status.color)}
                >
                  {status.label}
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              {statusOrder.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(data.status === s && 'bg-gray-100')}
                >
                  <span className={cn('w-2 h-2 rounded-full mr-2', statusConfig[s].color.split(' ')[0])} />
                  {statusConfig[s].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
