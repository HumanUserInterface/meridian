import { Node, Edge } from '@xyflow/react';
import { CocoonNodeData, NodeType } from '@/types';

type CocoonNode = Node<CocoonNodeData>;

interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  nodeWidth: 240,
  nodeHeight: 150,
  horizontalSpacing: 40,
  verticalSpacing: 120,
};

/**
 * Semantic Cocoon Hierarchical Layout
 *
 * Creates an inverted tree structure:
 * - Level 0 (top): Pillar / Homepage
 * - Level 1: Clusters / Categories
 * - Level 2: Supporting pages / Blog posts
 * - Level 3: Products / Other pages
 *
 * This follows the classic semantic cocoon / topic cluster model
 */
export function autoLayoutNodes(
  nodes: CocoonNode[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): CocoonNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return nodes;

  // Define hierarchy levels based on node type
  const levelMap: Record<NodeType, number> = {
    homepage: 0,
    pillar: 0,
    cluster: 1,
    category: 1,
    supporting: 2,
    blog: 2,
    product: 3,
    navpage: 3,
    external: 4,
    orphan: 4,
  };

  // Group nodes by level
  const levels: Map<number, CocoonNode[]> = new Map();

  nodes.forEach(node => {
    const level = levelMap[node.data.nodeType] ?? 3;
    const levelNodes = levels.get(level) || [];
    levelNodes.push(node);
    levels.set(level, levelNodes);
  });

  // Sort levels and calculate positions
  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
  const positions = new Map<string, { x: number; y: number }>();

  // Find the widest level to center others
  let maxLevelWidth = 0;
  sortedLevels.forEach(level => {
    const levelNodes = levels.get(level) || [];
    const width = levelNodes.length * (opts.nodeWidth + opts.horizontalSpacing) - opts.horizontalSpacing;
    maxLevelWidth = Math.max(maxLevelWidth, width);
  });

  // Position each level
  let currentY = 0;

  sortedLevels.forEach(level => {
    const levelNodes = levels.get(level) || [];
    if (levelNodes.length === 0) return;

    // Sort nodes within level by cluster for better grouping
    levelNodes.sort((a, b) => {
      // Sort by primary keyword alphabetically for consistency
      const keywordA = a.data.primaryKeyword || a.data.title || '';
      const keywordB = b.data.primaryKeyword || b.data.title || '';
      return keywordA.localeCompare(keywordB);
    });

    // Calculate total width of this level
    const levelWidth = levelNodes.length * (opts.nodeWidth + opts.horizontalSpacing) - opts.horizontalSpacing;

    // Center this level relative to the widest level
    const startX = (maxLevelWidth - levelWidth) / 2;

    // Position each node in this level
    levelNodes.forEach((node, index) => {
      const x = startX + index * (opts.nodeWidth + opts.horizontalSpacing);
      positions.set(node.id, { x, y: currentY });
    });

    currentY += opts.nodeHeight + opts.verticalSpacing;
  });

  // Apply positions to nodes
  return nodes.map(node => {
    const pos = positions.get(node.id);
    if (pos) {
      return { ...node, position: pos };
    }
    return node;
  });
}

/**
 * Hierarchical tree layout based on actual link structure
 * Groups child nodes under their parent nodes
 */
export function hierarchicalTreeLayout(
  nodes: CocoonNode[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): CocoonNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return nodes;

  // Build parent-child relationships from edges
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  edges.forEach(edge => {
    // Source links to target, so source is parent
    const children = childrenMap.get(edge.source) || [];
    if (!children.includes(edge.target)) {
      children.push(edge.target);
    }
    childrenMap.set(edge.source, children);

    // Only set parent if not already set (first parent wins)
    if (!parentMap.has(edge.target)) {
      parentMap.set(edge.target, edge.source);
    }
  });

  // Find root nodes (pillar first, then nodes with no parents)
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const pillar = nodes.find(n => n.data.nodeType === 'pillar');
  const homepage = nodes.find(n => n.data.nodeType === 'homepage');

  let roots: CocoonNode[] = [];

  if (pillar) roots.push(pillar);
  if (homepage && homepage.id !== pillar?.id) roots.push(homepage);

  // Add other root nodes (no incoming edges)
  nodes.forEach(node => {
    if (!parentMap.has(node.id) && !roots.includes(node)) {
      roots.push(node);
    }
  });

  // If no clear roots, use the type-based layout
  if (roots.length === 0) {
    return autoLayoutNodes(nodes, edges, options);
  }

  // Calculate positions using BFS
  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  // Process each root
  let rootX = 0;

  roots.forEach(root => {
    const subtreeWidth = layoutTreeBFS(
      root.id,
      rootX,
      0,
      childrenMap,
      nodeById,
      opts,
      positions,
      visited
    );
    rootX += subtreeWidth + opts.horizontalSpacing * 3;
  });

  // Handle orphan nodes not visited
  const orphans = nodes.filter(n => !visited.has(n.id));
  if (orphans.length > 0) {
    const maxY = Math.max(0, ...Array.from(positions.values()).map(p => p.y));
    const orphanY = maxY + opts.verticalSpacing * 2;

    orphans.forEach((node, i) => {
      positions.set(node.id, {
        x: i * (opts.nodeWidth + opts.horizontalSpacing),
        y: orphanY,
      });
    });
  }

  // Apply positions
  return nodes.map(node => {
    const pos = positions.get(node.id);
    if (pos) {
      return { ...node, position: pos };
    }
    return node;
  });
}

/**
 * BFS tree layout - positions parent centered above children
 */
function layoutTreeBFS(
  rootId: string,
  startX: number,
  startY: number,
  childrenMap: Map<string, string[]>,
  nodeById: Map<string, CocoonNode>,
  opts: LayoutOptions,
  positions: Map<string, { x: number; y: number }>,
  visited: Set<string>
): number {
  interface QueueItem {
    id: string;
    depth: number;
    parentX?: number;
  }

  // First pass: determine levels and count nodes per level
  const levelNodes: Map<number, string[]> = new Map();
  const nodeDepth: Map<string, number> = new Map();

  const queue: QueueItem[] = [{ id: rootId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    nodeDepth.set(id, depth);
    const level = levelNodes.get(depth) || [];
    level.push(id);
    levelNodes.set(depth, level);

    const children = childrenMap.get(id) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, depth: depth + 1 });
      }
    });
  }

  // Calculate the width needed for each level
  const levelWidths: Map<number, number> = new Map();
  let maxWidth = 0;

  levelNodes.forEach((nodeIds, depth) => {
    const width = nodeIds.length * (opts.nodeWidth + opts.horizontalSpacing) - opts.horizontalSpacing;
    levelWidths.set(depth, width);
    maxWidth = Math.max(maxWidth, width);
  });

  // Position nodes level by level, centered
  levelNodes.forEach((nodeIds, depth) => {
    const levelWidth = levelWidths.get(depth) || 0;
    const levelStartX = startX + (maxWidth - levelWidth) / 2;
    const y = startY + depth * (opts.nodeHeight + opts.verticalSpacing);

    nodeIds.forEach((nodeId, index) => {
      const x = levelStartX + index * (opts.nodeWidth + opts.horizontalSpacing);
      positions.set(nodeId, { x, y });
    });
  });

  return maxWidth;
}

/**
 * Get node dimensions based on type
 */
export function getNodeDimensions(nodeType: NodeType): { width: number; height: number } {
  return {
    width: 240,
    height: 150,
  };
}
