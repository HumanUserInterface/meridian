'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { NodeType } from '@/types';
import {
  Search,
  Target,
  Layers,
  FileText,
  ExternalLink,
  AlertTriangle,
  GripVertical,
  Home,
  Package,
  FolderOpen,
  Navigation,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeTypeConfig: Record<NodeType, { icon: React.ElementType; color: string; label: string }> = {
  pillar: { icon: Target, color: 'text-blue-600 dark:text-blue-400', label: 'Pillar' },
  cluster: { icon: Layers, color: 'text-emerald-600 dark:text-emerald-400', label: 'Cluster' },
  supporting: { icon: FileText, color: 'text-gray-600 dark:text-gray-400', label: 'Supporting' },
  external: { icon: ExternalLink, color: 'text-purple-600 dark:text-purple-400', label: 'External' },
  orphan: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', label: 'Orphan' },
  homepage: { icon: Home, color: 'text-indigo-600 dark:text-indigo-400', label: 'Homepage' },
  product: { icon: Package, color: 'text-amber-600 dark:text-amber-400', label: 'Product' },
  category: { icon: FolderOpen, color: 'text-cyan-600 dark:text-cyan-400', label: 'Category' },
  navpage: { icon: Navigation, color: 'text-slate-500 dark:text-slate-400', label: 'Nav Page' },
  blog: { icon: Newspaper, color: 'text-rose-600 dark:text-rose-400', label: 'Blog Article' },
};

const draggableNodes: { type: NodeType; label: string; icon: React.ElementType }[] = [
  { type: 'homepage', label: 'Homepage', icon: Home },
  { type: 'pillar', label: 'Pillar Page', icon: Target },
  { type: 'category', label: 'Category', icon: FolderOpen },
  { type: 'cluster', label: 'Cluster Page', icon: Layers },
  { type: 'product', label: 'Product', icon: Package },
  { type: 'blog', label: 'Blog Article', icon: Newspaper },
  { type: 'supporting', label: 'Supporting Page', icon: FileText },
  { type: 'navpage', label: 'Nav Page', icon: Navigation },
  { type: 'external', label: 'External Link', icon: ExternalLink },
];

export default function LeftPanel() {
  const { nodes } = useProjectStore();
  const { selectedNodeId, setSelectedNodeId } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = nodes.filter(
    (node) =>
      node.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.primaryKeyword?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedNodes = filteredNodes.reduce(
    (acc, node) => {
      const type = node.data.nodeType || 'supporting';
      if (!acc[type]) acc[type] = [];
      acc[type].push(node);
      return acc;
    },
    {} as Record<NodeType, typeof nodes>
  );

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/meridian-node', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-foreground mb-3">Content Structure</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="nodes" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-2">
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="add">Add New</TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {Object.entries(groupedNodes).map(([type, typeNodes]) => {
                const config = nodeTypeConfig[type as NodeType];
                const Icon = config.icon;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn('w-4 h-4', config.color)} />
                      <span className="text-sm font-medium text-muted-foreground">
                        {config.label} ({typeNodes.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {typeNodes.map((node) => (
                        <Button
                          key={node.id}
                          variant={selectedNodeId === node.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start text-left h-auto py-2 px-3"
                          onClick={() => setSelectedNodeId(node.id)}
                        >
                          <div className="truncate">
                            <div className="font-medium truncate">{node.data.title}</div>
                            {node.data.primaryKeyword && (
                              <div className="text-xs text-muted-foreground truncate">
                                {node.data.primaryKeyword}
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredNodes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No nodes match your search' : 'No nodes yet. Add one to get started!'}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="add" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop nodes onto the canvas to add them.
              </p>
              {draggableNodes.map(({ type, label, icon: Icon }) => {
                const config = nodeTypeConfig[type];
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, type)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-grab',
                      'hover:border-solid hover:bg-accent transition-colors',
                      'active:cursor-grabbing'
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <Icon className={cn('w-5 h-5', config.color)} />
                    <span className="font-medium text-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t bg-muted/50">
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between mb-1">
            <span>Total Nodes:</span>
            <Badge variant="secondary">{nodes.length}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
