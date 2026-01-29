'use client';

import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import NodeProperties from './NodeProperties';
import EdgeProperties from './EdgeProperties';
import AnalysisPanel from './AnalysisPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RightPanel() {
  const { selectedNodeId, selectedEdgeId } = useUIStore();
  const { nodes, edges } = useProjectStore();

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;
  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId)
    : null;

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <Tabs defaultValue="properties" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-2">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            {selectedNode ? (
              <NodeProperties node={selectedNode} />
            ) : selectedEdge ? (
              <EdgeProperties edge={selectedEdge} />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <p className="mb-2">Select a node or edge to edit its properties</p>
                <p className="text-sm">Click on any element on the canvas</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <AnalysisPanel />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
