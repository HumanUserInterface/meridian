import { v4 as uuidv4 } from 'uuid';
import { Keyword, CocoonAnalysis } from '@/types';
import { runResearchAgent } from './agents/research';
import { runBuilderAgent } from './agents/builder';
import { runLinkerAgent } from './agents/linker';
import {
  CocoonGeneratorInput,
  CocoonGeneratorOutput,
  StreamEvent,
  GenerationStage,
} from './types';

export type ProgressCallback = (event: StreamEvent) => void;

/**
 * Orchestrating Agent
 *
 * Coordinates the multi-agent workflow:
 * 1. Semantic Research Agent - keyword expansion/clustering
 * 2. Builder Agent - create nodes with metadata
 * 3. Internal Linking Agent - create edges
 *
 * Streams progress updates throughout the process.
 */
export async function orchestrateCocoonGeneration(
  input: CocoonGeneratorInput,
  onProgress: ProgressCallback
): Promise<CocoonGeneratorOutput> {
  const {
    seedKeyword,
    businessDescription,
    targetPageCount,
    importedKeywords,
    domain,
    language = 'en',
  } = input;

  // Validate input
  if (!seedKeyword?.trim()) {
    throw new Error('Seed keyword is required');
  }
  if (!businessDescription?.trim()) {
    throw new Error('Business description is required');
  }
  if (targetPageCount < 1 || targetPageCount > 2000) {
    throw new Error('Target page count must be between 1 and 2000');
  }

  try {
    // ==========================================
    // PHASE 1: SEMANTIC RESEARCH
    // ==========================================
    sendProgress(onProgress, 'research', 0, 'Starting semantic research...');

    const researchOutput = await runResearchAgent(
      {
        seedKeyword,
        businessDescription,
        targetPageCount,
        importedKeywords,
        language,
      },
      (message) => sendProgress(onProgress, 'research', 0.3, message)
    );

    sendProgress(
      onProgress,
      'research',
      0.9,
      `Found ${researchOutput.keywords.length} keywords in ${researchOutput.clusters.length} clusters`
    );

    // ==========================================
    // PHASE 2: BUILD NODES
    // ==========================================
    sendProgress(onProgress, 'build', 0, 'Starting page creation...');

    const nodes = await runBuilderAgent(
      {
        keywords: researchOutput.keywords,
        businessDescription,
        domain,
        language,
      },
      (message, current, total) => {
        const progress = current && total ? current / total : 0;
        sendProgress(onProgress, 'build', progress * 0.9, message, { current, total });
      }
    );

    sendProgress(onProgress, 'build', 0.95, `Created ${nodes.length} pages`);

    // ==========================================
    // PHASE 3: CREATE LINKS
    // ==========================================
    sendProgress(onProgress, 'link', 0, 'Starting internal linking...');

    const edges = await runLinkerAgent(
      {
        nodes,
        clusters: researchOutput.clusters,
      },
      (message) => sendProgress(onProgress, 'link', 0.5, message)
    );

    sendProgress(onProgress, 'link', 0.95, `Created ${edges.length} internal links`);

    // ==========================================
    // PHASE 4: COMPILE RESULTS
    // ==========================================
    sendProgress(onProgress, 'complete', 0.98, 'Compiling results...');

    // Create keyword objects for the project
    const keywords: Keyword[] = researchOutput.keywords.map((k, index) => ({
      id: uuidv4(),
      term: k.term,
      volume: k.volume,
      difficulty: k.difficulty,
      intent: k.intent,
      assignedNodeId: nodes[index]?.id,
    }));

    // Generate analysis
    const analysis = generateAnalysis(nodes, edges);

    const output: CocoonGeneratorOutput = {
      nodes,
      edges,
      keywords,
      analysis,
    };

    // Send complete event
    onProgress({
      event: 'complete',
      data: output,
    });

    return output;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    onProgress({
      event: 'error',
      data: { message: errorMessage },
    });
    throw error;
  }
}

/**
 * Send a progress event
 */
function sendProgress(
  onProgress: ProgressCallback,
  stage: GenerationStage,
  progress: number,
  message: string,
  details?: { current?: number; total?: number }
): void {
  onProgress({
    event: 'progress',
    data: {
      stage,
      progress: Math.min(Math.max(progress, 0), 1),
      message,
      details,
    },
  });
}

/**
 * Generate analysis from generated cocoon
 */
function generateAnalysis(
  nodes: CocoonGeneratorOutput['nodes'],
  edges: CocoonGeneratorOutput['edges']
): CocoonAnalysis {
  // Count nodes by type
  const nodeCount = {
    pillar: 0,
    cluster: 0,
    supporting: 0,
    external: 0,
    orphan: 0,
    homepage: 0,
    product: 0,
    category: 0,
    navpage: 0,
    blog: 0,
  };

  nodes.forEach(node => {
    const type = node.data.nodeType;
    if (type in nodeCount) {
      nodeCount[type as keyof typeof nodeCount]++;
    }
  });

  // Find orphan nodes (no incoming links)
  const incomingLinks = new Map<string, number>();
  nodes.forEach(n => incomingLinks.set(n.id, 0));
  edges.forEach(e => {
    const count = incomingLinks.get(e.target) || 0;
    incomingLinks.set(e.target, count + 1);
  });

  const orphanNodes = nodes
    .filter(n => {
      const incoming = incomingLinks.get(n.id) || 0;
      return incoming === 0 && n.data.nodeType !== 'pillar';
    })
    .map(n => n.id);

  // Calculate link depth (BFS from pillar)
  const maxLinkDepth = calculateMaxDepth(nodes, edges);

  // Calculate average links per node
  const avgLinksPerNode = nodes.length > 0 ? edges.length / nodes.length : 0;

  // Generate warnings
  const warnings: CocoonAnalysis['warnings'] = [];

  if (nodeCount.pillar === 0) {
    warnings.push({
      type: 'no-pillar',
      message: 'No pillar page found. Consider adding a central topic page.',
    });
  }

  if (orphanNodes.length > 0) {
    warnings.push({
      type: 'orphan',
      message: `${orphanNodes.length} page(s) have no incoming links.`,
      nodeIds: orphanNodes,
    });
  }

  if (maxLinkDepth > 3) {
    warnings.push({
      type: 'deep-link',
      message: `Link depth of ${maxLinkDepth} exceeds recommended maximum of 3.`,
    });
  }

  // Calculate health score
  let healthScore = 100;
  if (nodeCount.pillar === 0) healthScore -= 30;
  healthScore -= Math.min(orphanNodes.length * 5, 20);
  if (maxLinkDepth > 3) healthScore -= 10;

  return {
    healthScore: Math.max(healthScore, 0),
    orphanNodes,
    maxLinkDepth,
    nodeCount,
    linkCount: edges.length,
    avgLinksPerNode: Math.round(avgLinksPerNode * 10) / 10,
    warnings,
  };
}

/**
 * Calculate maximum link depth from pillar using BFS
 */
function calculateMaxDepth(
  nodes: CocoonGeneratorOutput['nodes'],
  edges: CocoonGeneratorOutput['edges']
): number {
  const pillar = nodes.find(n => n.data.nodeType === 'pillar');
  if (!pillar) return nodes.length > 0 ? 1 : 0;

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.id, []));
  edges.forEach(e => {
    const neighbors = adjacency.get(e.source) || [];
    neighbors.push(e.target);
    adjacency.set(e.source, neighbors);
  });

  // BFS to find max depth
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: pillar.id, depth: 0 }];
  let maxDepth = 0;

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    maxDepth = Math.max(maxDepth, depth);

    const neighbors = adjacency.get(id) || [];
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    });
  }

  return maxDepth;
}
