import { v4 as uuidv4 } from 'uuid';
import { LinkType, CocoonEdgeData } from '@/types';
import { generateCompletion, withRetry } from '../together';
import {
  GeneratedNode,
  GeneratedEdge,
  ResearchCluster,
  LLMLinkingResponse,
  AI_CONFIG,
} from '../types';
import { getLinkingPrompt } from '../prompts';

export interface LinkerAgentInput {
  nodes: GeneratedNode[];
  clusters: ResearchCluster[];
}

/**
 * Internal Linking Agent
 *
 * Creates the link structure (edges) following these rules:
 * 1. Pillar ↔ all Clusters (bidirectional contextual)
 * 2. Cluster → Supporting pages (contextual)
 * 3. Supporting → Cluster (related, breadcrumb)
 * 4. Cross-cluster links for semantic similarity
 * 5. Aim for 2-4 incoming links per node
 * 6. No orphan pages
 */
export async function runLinkerAgent(
  input: LinkerAgentInput,
  onProgress?: (message: string) => void
): Promise<GeneratedEdge[]> {
  const { nodes, clusters } = input;

  onProgress?.('Analyzing content relationships...');

  // Build lookup maps
  const nodeByKeyword = new Map<string, GeneratedNode>();
  nodes.forEach(node => {
    if (node.data.primaryKeyword) {
      nodeByKeyword.set(node.data.primaryKeyword.toLowerCase(), node);
    }
  });

  // Prepare node info for prompt
  const nodeInfo = nodes.map(n => ({
    keyword: n.data.primaryKeyword || n.data.title,
    nodeType: n.data.nodeType,
    cluster: getNodeCluster(n, clusters),
  }));

  // Generate links using LLM
  onProgress?.('Generating internal links with AI...');

  // Map clusters to expected format
  const mappedClusters = clusters.map(c => ({
    name: c.name,
    pillar: c.suggestedPillar,
  }));

  const prompt = getLinkingPrompt(nodeInfo, mappedClusters);

  const response = await withRetry(() =>
    generateCompletion<LLMLinkingResponse>(prompt, {
      model: AI_CONFIG.models.reasoning,
      temperature: 0.6,
      maxTokens: 8192,
    })
  );

  // Transform LLM response to edges
  const edges: GeneratedEdge[] = [];
  const createdLinks = new Set<string>();

  for (const link of response.links) {
    const sourceNode = nodeByKeyword.get(link.sourceKeyword.toLowerCase());
    const targetNode = nodeByKeyword.get(link.targetKeyword.toLowerCase());

    if (!sourceNode || !targetNode) {
      // Try fuzzy match
      const fuzzySource = findFuzzyMatch(link.sourceKeyword, nodeByKeyword);
      const fuzzyTarget = findFuzzyMatch(link.targetKeyword, nodeByKeyword);

      if (!fuzzySource || !fuzzyTarget) continue;

      const linkKey = `${fuzzySource.id}-${fuzzyTarget.id}`;
      if (createdLinks.has(linkKey)) continue;
      createdLinks.add(linkKey);

      edges.push(createEdge(fuzzySource, fuzzyTarget, link.linkType, link.anchorText));
    } else {
      const linkKey = `${sourceNode.id}-${targetNode.id}`;
      if (createdLinks.has(linkKey)) continue;
      createdLinks.add(linkKey);

      edges.push(createEdge(sourceNode, targetNode, link.linkType, link.anchorText));
    }
  }

  // Ensure no orphan pages - add missing links
  onProgress?.('Verifying link coverage...');
  const incomingLinks = new Map<string, number>();
  nodes.forEach(n => incomingLinks.set(n.id, 0));

  edges.forEach(e => {
    const count = incomingLinks.get(e.target) || 0;
    incomingLinks.set(e.target, count + 1);
  });

  // Find orphans and link them
  const orphans = nodes.filter(n => {
    const incoming = incomingLinks.get(n.id) || 0;
    return incoming === 0 && n.data.nodeType !== 'pillar';
  });

  if (orphans.length > 0) {
    onProgress?.(`Connecting ${orphans.length} orphan pages...`);

    // Find pillar or cluster to link from
    const pillar = nodes.find(n => n.data.nodeType === 'pillar');
    const clusterNodes = nodes.filter(n => n.data.nodeType === 'cluster');

    orphans.forEach(orphan => {
      // Find the best node to link from
      const orphanCluster = getNodeCluster(orphan, clusters);
      const clusterNode = clusterNodes.find(c =>
        getNodeCluster(c, clusters) === orphanCluster
      );

      const sourceNode = clusterNode || pillar || nodes[0];

      if (sourceNode && sourceNode.id !== orphan.id) {
        const linkKey = `${sourceNode.id}-${orphan.id}`;
        if (!createdLinks.has(linkKey)) {
          createdLinks.add(linkKey);
          edges.push(createEdge(
            sourceNode,
            orphan,
            'related',
            orphan.data.primaryKeyword || orphan.data.title
          ));
        }
      }
    });
  }

  onProgress?.(`Created ${edges.length} internal links`);

  return edges;
}

/**
 * Create an edge object
 */
function createEdge(
  source: GeneratedNode,
  target: GeneratedNode,
  linkType: string,
  anchorText: string
): GeneratedEdge {
  const edgeData: CocoonEdgeData = {
    anchorText: anchorText || target.data.primaryKeyword || target.data.title,
    linkType: validateLinkType(linkType),
    position: 'body',
    nofollow: false,
    isPlanned: true,
  };

  return {
    id: uuidv4(),
    source: source.id,
    target: target.id,
    type: 'cocoonEdge',
    data: edgeData,
  };
}

/**
 * Get the cluster name for a node
 */
function getNodeCluster(node: GeneratedNode, clusters: ResearchCluster[]): string {
  const keyword = node.data.primaryKeyword?.toLowerCase();
  if (!keyword) return 'default';

  for (const cluster of clusters) {
    if (cluster.keywords.some(k => k.toLowerCase() === keyword)) {
      return cluster.name;
    }
    if (cluster.suggestedPillar.toLowerCase() === keyword) {
      return cluster.name;
    }
  }

  return 'default';
}

/**
 * Find a node by fuzzy keyword match
 */
function findFuzzyMatch(
  keyword: string,
  nodeMap: Map<string, GeneratedNode>
): GeneratedNode | undefined {
  const lowerKeyword = keyword.toLowerCase();

  // Exact match
  if (nodeMap.has(lowerKeyword)) {
    return nodeMap.get(lowerKeyword);
  }

  // Partial match
  for (const [key, node] of nodeMap) {
    if (key.includes(lowerKeyword) || lowerKeyword.includes(key)) {
      return node;
    }
  }

  return undefined;
}

/**
 * Validate link type
 */
function validateLinkType(linkType: string): LinkType {
  const validTypes: LinkType[] = ['contextual', 'navigation', 'related', 'breadcrumb', 'cta'];
  if (validTypes.includes(linkType as LinkType)) {
    return linkType as LinkType;
  }
  return 'contextual';
}
