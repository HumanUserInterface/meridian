import { CocoonNode, CocoonEdge } from '@/stores/projectStore';
import { CocoonAnalysis, AnalysisWarning } from '@/types';

export function analyzeCocoon(nodes: CocoonNode[], edges: CocoonEdge[]): CocoonAnalysis {
  const nodeCount = {
    pillar: nodes.filter((n) => n.data.nodeType === 'pillar').length,
    cluster: nodes.filter((n) => n.data.nodeType === 'cluster').length,
    supporting: nodes.filter((n) => n.data.nodeType === 'supporting').length,
    external: nodes.filter((n) => n.data.nodeType === 'external').length,
    orphan: 0,
  };

  // Find orphan nodes (no incoming edges, excluding pillars)
  const nodesWithIncoming = new Set(edges.map((e) => e.target));
  const orphanNodes = nodes.filter(
    (n) => n.data.nodeType !== 'pillar' && n.data.nodeType !== 'external' && !nodesWithIncoming.has(n.id)
  );
  nodeCount.orphan = orphanNodes.length;

  // Calculate max link depth using BFS from pillar nodes
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
  const warnings: AnalysisWarning[] = [];

  if (nodeCount.pillar === 0 && nodes.length > 0) {
    warnings.push({
      type: 'no-pillar',
      message: 'No pillar page defined. Add a pillar page as the main topic.',
    });
  }

  if (orphanNodes.length > 0) {
    warnings.push({
      type: 'orphan',
      message: `${orphanNodes.length} orphan page(s) without incoming links`,
      nodeIds: orphanNodes.map((n) => n.id),
    });
  }

  if (maxDepth > 3) {
    warnings.push({
      type: 'deep-link',
      message: `Link depth of ${maxDepth} exceeds recommended maximum of 3`,
    });
  }

  // Check for nodes without keywords
  const nodesWithoutKeywords = nodes.filter(
    (n) => n.data.nodeType !== 'external' && !n.data.primaryKeyword
  );
  if (nodesWithoutKeywords.length > 0) {
    warnings.push({
      type: 'missing-keyword',
      message: `${nodesWithoutKeywords.length} page(s) missing primary keyword`,
      nodeIds: nodesWithoutKeywords.map((n) => n.id),
    });
  }

  // Check for duplicate keywords
  const keywordMap = new Map<string, string[]>();
  nodes.forEach((n) => {
    if (n.data.primaryKeyword) {
      const keyword = n.data.primaryKeyword.toLowerCase();
      if (!keywordMap.has(keyword)) {
        keywordMap.set(keyword, []);
      }
      keywordMap.get(keyword)!.push(n.id);
    }
  });

  keywordMap.forEach((nodeIds, keyword) => {
    if (nodeIds.length > 1) {
      warnings.push({
        type: 'duplicate-keyword',
        message: `Keyword "${keyword}" is used on ${nodeIds.length} pages (potential cannibalization)`,
        nodeIds,
      });
    }
  });

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
    orphanNodes: orphanNodes.map((n) => n.id),
    maxLinkDepth: maxDepth,
    nodeCount,
    linkCount: edges.length,
    avgLinksPerNode,
    warnings,
  };
}

export function getNodeDepths(nodes: CocoonNode[], edges: CocoonEdge[]): Map<string, number> {
  const depths = new Map<string, number>();
  const pillarNodes = nodes.filter((n) => n.data.nodeType === 'pillar');

  if (pillarNodes.length === 0) {
    nodes.forEach((n) => depths.set(n.id, 0));
    return depths;
  }

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
    depths.set(id, depth);

    const children = adjacencyList.get(id) || [];
    children.forEach((childId) => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, depth: depth + 1 });
      }
    });
  }

  // Set unreachable nodes to -1
  nodes.forEach((n) => {
    if (!depths.has(n.id)) {
      depths.set(n.id, -1);
    }
  });

  return depths;
}
