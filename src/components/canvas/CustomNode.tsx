'use client';

import { memo, useState, useRef, useEffect } from 'react';
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

const nodeTypeConfig: Record<NodeType, { icon: React.ElementType; color: string; bgColor: string; borderColor: string; titleBgColor: string; handleColor: string }> = {
  pillar: {
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    titleBgColor: 'bg-blue-100',
    handleColor: '#3b82f6',
  },
  cluster: {
    icon: Layers,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    titleBgColor: 'bg-emerald-100',
    handleColor: '#10b981',
  },
  supporting: {
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-400',
    titleBgColor: 'bg-gray-100',
    handleColor: '#9ca3af',
  },
  external: {
    icon: ExternalLink,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    titleBgColor: 'bg-purple-100',
    handleColor: '#a855f7',
  },
  orphan: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    titleBgColor: 'bg-red-100',
    handleColor: '#ef4444',
  },
  homepage: {
    icon: Home,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-500',
    titleBgColor: 'bg-indigo-100',
    handleColor: '#6366f1',
  },
  product: {
    icon: Package,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
    titleBgColor: 'bg-amber-100',
    handleColor: '#f59e0b',
  },
  category: {
    icon: FolderOpen,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-500',
    titleBgColor: 'bg-cyan-100',
    handleColor: '#06b6d4',
  },
  navpage: {
    icon: Navigation,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    titleBgColor: 'bg-slate-100',
    handleColor: '#64748b',
  },
  blog: {
    icon: Newspaper,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-500',
    titleBgColor: 'bg-rose-100',
    handleColor: '#f43f5e',
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
  const [isEditingKeyword, setIsEditingKeyword] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editKeywordValue, setEditKeywordValue] = useState(data.primaryKeyword || '');
  const [editTitleValue, setEditTitleValue] = useState(data.title || '');
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const nodeType = data.nodeType || 'supporting';
  const config = nodeTypeConfig[nodeType];
  const Icon = config.icon;
  const status = statusConfig[data.status] || statusConfig.planned;

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingKeyword && keywordInputRef.current) {
      keywordInputRef.current.focus();
      keywordInputRef.current.select();
    }
  }, [isEditingKeyword]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Sync edit values with data when not editing
  useEffect(() => {
    if (!isEditingKeyword) {
      setEditKeywordValue(data.primaryKeyword || '');
    }
  }, [data.primaryKeyword, isEditingKeyword]);

  useEffect(() => {
    if (!isEditingTitle) {
      setEditTitleValue(data.title || '');
    }
  }, [data.title, isEditingTitle]);

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

  const handleKeywordDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingKeyword(true);
  };

  const handleKeywordSave = () => {
    updateNode(id, { primaryKeyword: editKeywordValue.trim() || undefined });
    setIsEditingKeyword(false);
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeywordSave();
    } else if (e.key === 'Escape') {
      setEditKeywordValue(data.primaryKeyword || '');
      setIsEditingKeyword(false);
    }
  };

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    updateNode(id, { title: editTitleValue.trim() || 'Untitled Page' });
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditTitleValue(data.title || '');
      setIsEditingTitle(false);
    }
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
        className="!w-3 !h-3 !border-2 !border-white"
        style={{ backgroundColor: config.handleColor }}
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

      {/* Keyword Section with colored background */}
      <div className={cn('px-3 py-2 border-b', config.titleBgColor, config.borderColor)}>
        {/* Primary Keyword - prominent, double-click to edit */}
        {isEditingKeyword ? (
          <input
            ref={keywordInputRef}
            type="text"
            value={editKeywordValue}
            onChange={(e) => setEditKeywordValue(e.target.value)}
            onBlur={handleKeywordSave}
            onKeyDown={handleKeywordKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full font-semibold leading-tight bg-white/50 rounded px-1 -mx-1 outline-none ring-2 ring-blue-400',
              config.color
            )}
            placeholder="Enter keyword..."
          />
        ) : (
          <h3
            className={cn(
              'font-semibold leading-tight line-clamp-2 cursor-text',
              config.color,
              !data.primaryKeyword && 'italic opacity-60'
            )}
            onDoubleClick={handleKeywordDoubleClick}
            title="Double-click to edit keyword"
          >
            {data.primaryKeyword || 'No keyword set'}
          </h3>
        )}

        {/* Page Title - smaller, double-click to edit */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editTitleValue}
            onChange={(e) => setEditTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xs text-gray-600 mt-1 bg-white/50 rounded px-1 -mx-1 outline-none ring-2 ring-blue-400"
            placeholder="Enter title..."
          />
        ) : (
          <p
            className="text-xs text-gray-600 mt-1 truncate cursor-text hover:text-gray-800"
            title="Double-click to edit title"
            onDoubleClick={handleTitleDoubleClick}
          >
            {data.title || 'Untitled Page'}
          </p>
        )}

        {/* Slug */}
        {slug && (
          <p className="text-xs text-gray-400 mt-0.5 truncate font-mono">
            /{slug}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">

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
        className="!w-3 !h-3 !border-2 !border-white"
        style={{ backgroundColor: config.handleColor }}
      />
    </div>
  );
}

export default memo(CustomNode);
