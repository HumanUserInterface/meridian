'use client';

import { useMemo } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Layers,
  FileText,
  Link,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Warning {
  type: 'error' | 'warning' | 'info';
  message: string;
  nodeIds?: string[];
}

export default function AnalysisPanel() {
  const { nodes, edges } = useProjectStore();

  const analysis = useMemo(() => {
    const nodeCount = {
      pillar: nodes.filter((n) => n.data.nodeType === 'pillar').length,
      cluster: nodes.filter((n) => n.data.nodeType === 'cluster').length,
      supporting: nodes.filter((n) => n.data.nodeType === 'supporting').length,
      external: nodes.filter((n) => n.data.nodeType === 'external').length,
      orphan: 0,
    };

    // Find orphan nodes (no incoming edges)
    const nodesWithIncoming = new Set(edges.map((e) => e.target));
    const orphanNodes = nodes.filter(
      (n) => n.data.nodeType !== 'pillar' && !nodesWithIncoming.has(n.id)
    );
    nodeCount.orphan = orphanNodes.length;

    // Calculate link depth using BFS from pillar nodes
    const pillarNodes = nodes.filter((n) => n.data.nodeType === 'pillar');
    let maxDepth = 0;

    if (pillarNodes.length > 0) {
      const adjacencyList = new Map<string, string[]>();
      edges.forEach((edge) => {
        if (!adjacencyList.has(edge.source)) {
          adjacencyList.set(edge.source, []);
        }
        adjacencyList.get(edge.source)!.push(edge.target);
      });

      const visited = new Set<string>();
      const queue: { id: string; depth: number }[] = pillarNodes.map((p) => ({
        id: p.id,
        depth: 0,
      }));

      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        maxDepth = Math.max(maxDepth, depth);

        const children = adjacencyList.get(id) || [];
        children.forEach((childId) => {
          if (!visited.has(childId)) {
            queue.push({ id: childId, depth: depth + 1 });
          }
        });
      }
    }

    // Generate warnings
    const warnings: Warning[] = [];

    if (nodeCount.pillar === 0 && nodes.length > 0) {
      warnings.push({
        type: 'error',
        message: 'No pillar page defined. Add a pillar page as the main topic.',
      });
    }

    if (orphanNodes.length > 0) {
      warnings.push({
        type: 'warning',
        message: `${orphanNodes.length} orphan page(s) without incoming links`,
        nodeIds: orphanNodes.map((n) => n.id),
      });
    }

    if (maxDepth > 3) {
      warnings.push({
        type: 'warning',
        message: `Link depth of ${maxDepth} exceeds recommended maximum of 3`,
      });
    }

    // Check for nodes without keywords
    const nodesWithoutKeywords = nodes.filter(
      (n) => n.data.nodeType !== 'external' && !n.data.primaryKeyword
    );
    if (nodesWithoutKeywords.length > 0) {
      warnings.push({
        type: 'info',
        message: `${nodesWithoutKeywords.length} page(s) missing primary keyword`,
        nodeIds: nodesWithoutKeywords.map((n) => n.id),
      });
    }

    // Calculate health score
    let score = 100;
    if (nodeCount.pillar === 0 && nodes.length > 0) score -= 30;
    if (orphanNodes.length > 0) score -= Math.min(20, orphanNodes.length * 5);
    if (maxDepth > 3) score -= 10;
    if (nodesWithoutKeywords.length > 0) score -= Math.min(15, nodesWithoutKeywords.length * 3);
    if (nodes.length === 0) score = 0;

    const avgLinksPerNode = nodes.length > 0 ? edges.length / nodes.length : 0;

    return {
      healthScore: Math.max(0, score),
      nodeCount,
      linkCount: edges.length,
      avgLinksPerNode,
      maxDepth,
      warnings,
    };
  }, [nodes, edges]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 space-y-6">
      {/* Health Score */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Cocoon Health</h3>
        <div className="text-center mb-4">
          <div className={cn('text-5xl font-bold', getScoreColor(analysis.healthScore))}>
            {analysis.healthScore}
          </div>
          <div className="text-sm text-gray-500">out of 100</div>
        </div>
        <Progress
          value={analysis.healthScore}
          className="h-2"
        />
      </div>

      <Separator />

      {/* Node Statistics */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Content Structure</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Pillar Pages</span>
            </div>
            <Badge variant="secondary">{analysis.nodeCount.pillar}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Cluster Pages</span>
            </div>
            <Badge variant="secondary">{analysis.nodeCount.cluster}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-sm">Supporting Pages</span>
            </div>
            <Badge variant="secondary">{analysis.nodeCount.supporting}</Badge>
          </div>
          {analysis.nodeCount.orphan > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Orphan Pages</span>
              </div>
              <Badge variant="destructive">{analysis.nodeCount.orphan}</Badge>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Link Statistics */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Link Structure</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-gray-600" />
              <span className="text-sm">Total Links</span>
            </div>
            <Badge variant="secondary">{analysis.linkCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm">Avg Links/Page</span>
            </div>
            <Badge variant="secondary">{analysis.avgLinksPerNode.toFixed(1)}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-600" />
              <span className="text-sm">Max Depth</span>
            </div>
            <Badge variant={analysis.maxDepth > 3 ? 'destructive' : 'secondary'}>
              {analysis.maxDepth}
            </Badge>
          </div>
        </div>
      </div>

      {analysis.warnings.length > 0 && (
        <>
          <Separator />

          {/* Warnings */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Issues & Suggestions</h4>
            <div className="space-y-2">
              {analysis.warnings.map((warning, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded-lg text-sm',
                    warning.type === 'error' && 'bg-red-50 text-red-700',
                    warning.type === 'warning' && 'bg-yellow-50 text-yellow-700',
                    warning.type === 'info' && 'bg-blue-50 text-blue-700'
                  )}
                >
                  {warning.type === 'error' && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                  {warning.type === 'warning' && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                  {warning.type === 'info' && <Info className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{warning.message}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {analysis.warnings.length === 0 && nodes.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Your cocoon structure looks healthy!</span>
          </div>
        </>
      )}
    </div>
  );
}
