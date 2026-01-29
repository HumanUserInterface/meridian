'use client';

import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import { NodeType } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Target, Layers, FileText, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const nodeTypes = {
  cocoonNode: CustomNode,
};

const edgeTypes = {
  cocoonEdge: CustomEdge,
};

const nodeOptions: { type: NodeType; label: string; icon: React.ElementType }[] = [
  { type: 'pillar', label: 'Pillar Page', icon: Target },
  { type: 'cluster', label: 'Cluster Page', icon: Layers },
  { type: 'supporting', label: 'Supporting Page', icon: FileText },
  { type: 'external', label: 'External Link', icon: ExternalLink },
];

function CanvasContent() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, deleteEdge } = useProjectStore();
  const { showMinimap, clearSelection, setSelectedNodeId, selectedEdgeId, setSelectedEdgeId } = useUIStore();
  const { screenToFlowPosition } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === 'dark';

  // Handle keyboard delete for selected edges/nodes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Don't delete if user is typing in an input
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          return;
        }

        if (selectedEdgeId) {
          deleteEdge(selectedEdgeId);
          setSelectedEdgeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, deleteEdge, setSelectedEdgeId]);

  const handleAddNode = useCallback(
    (type: NodeType) => {
      const center = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const nodeId = addNode(type, center);
      setSelectedNodeId(nodeId);
    },
    [screenToFlowPosition, addNode, setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/cocoonflow-node') as NodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = addNode(type, position);
      setSelectedNodeId(nodeId);
    },
    [screenToFlowPosition, addNode, setSelectedNodeId]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'cocoonEdge',
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Control']}
        className={isDark ? 'bg-neutral-900' : 'bg-gray-50'}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={isDark ? '#404040' : '#d1d5db'}
        />
        <Controls position="bottom-left" className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-white" />
        {showMinimap && (
          <MiniMap
            position="bottom-right"
            nodeColor={(node) => {
              const nodeType = (node.data as { nodeType?: string })?.nodeType;
              switch (nodeType) {
                case 'pillar':
                  return '#3B82F6';
                case 'cluster':
                  return '#10B981';
                case 'supporting':
                  return '#6B7280';
                case 'external':
                  return '#8B5CF6';
                case 'orphan':
                  return '#EF4444';
                default:
                  return '#6B7280';
              }
            }}
            maskColor={isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}
            className={isDark ? 'bg-neutral-800 border-neutral-700 rounded-lg shadow-lg' : 'bg-white border rounded-lg shadow-lg'}
          />
        )}

        <Panel position="top-left" className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {nodeOptions.map(({ type, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleAddNode(type)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
