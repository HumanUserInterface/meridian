import { SearchIntent, NodeType } from '@/types';
import { generateCompletion, withRetry } from '../together';
import {
  ResearchKeyword,
  ResearchCluster,
  ResearchOutput,
  LLMKeywordExpansionResponse,
  AI_CONFIG,
} from '../types';
import { getKeywordExpansionPrompt, getKeywordClusteringPrompt } from '../prompts';

export interface ResearchAgentInput {
  seedKeyword: string;
  businessDescription: string;
  targetPageCount: number;
  importedKeywords?: string[];
  language: string;
}

/**
 * Semantic Research Agent
 *
 * Mode A (No CSV Import): Expands seed keyword into targetPageCount keywords
 * Mode B (CSV Import): Clusters imported keywords and fills gaps if needed
 */
export async function runResearchAgent(
  input: ResearchAgentInput,
  onProgress?: (message: string) => void
): Promise<ResearchOutput> {
  const {
    seedKeyword,
    businessDescription,
    targetPageCount,
    importedKeywords,
    language,
  } = input;

  // Mode B: CSV Import provided
  if (importedKeywords && importedKeywords.length > 0) {
    onProgress?.(`Analyzing ${importedKeywords.length} imported keywords...`);
    return await processImportedKeywords(
      seedKeyword,
      businessDescription,
      targetPageCount,
      importedKeywords,
      language,
      onProgress
    );
  }

  // Mode A: Generate keywords from seed
  onProgress?.(`Expanding "${seedKeyword}" into ${targetPageCount} keywords...`);
  return await generateKeywords(
    seedKeyword,
    businessDescription,
    targetPageCount,
    language,
    onProgress
  );
}

/**
 * Mode A: Generate keywords from scratch using the seed keyword
 */
async function generateKeywords(
  seedKeyword: string,
  businessDescription: string,
  targetCount: number,
  language: string,
  onProgress?: (message: string) => void
): Promise<ResearchOutput> {
  const prompt = getKeywordExpansionPrompt(
    seedKeyword,
    businessDescription,
    targetCount,
    language
  );

  onProgress?.('Generating keyword expansion with AI...');

  const response = await withRetry(() =>
    generateCompletion<LLMKeywordExpansionResponse>(prompt, {
      model: AI_CONFIG.models.reasoning,
      temperature: 0.8,
      maxTokens: 8192,
    })
  );

  // Validate and transform response
  const keywords: ResearchKeyword[] = response.keywords.map(k => ({
    term: k.term,
    intent: validateIntent(k.intent),
    suggestedNodeType: validateNodeType(k.nodeType),
    cluster: k.cluster,
    isImported: false,
  }));

  const clusters: ResearchCluster[] = response.clusters.map(c => ({
    name: c.name,
    keywords: keywords.filter(k => k.cluster === c.name).map(k => k.term),
    suggestedPillar: c.pillar,
  }));

  // Find pillar keyword
  const pillarKeyword = keywords.find(k => k.suggestedNodeType === 'pillar')?.term || seedKeyword;

  onProgress?.(`Generated ${keywords.length} keywords in ${clusters.length} clusters`);

  return {
    keywords,
    clusters,
    pillarKeyword,
  };
}

/**
 * Mode B: Process imported keywords from CSV
 */
async function processImportedKeywords(
  seedKeyword: string,
  businessDescription: string,
  targetCount: number,
  importedKeywords: string[],
  language: string,
  onProgress?: (message: string) => void
): Promise<ResearchOutput> {
  // First, cluster the imported keywords
  const clusterPrompt = getKeywordClusteringPrompt(
    importedKeywords,
    seedKeyword,
    businessDescription,
    language
  );

  onProgress?.('Clustering imported keywords...');

  const clusterResponse = await withRetry(() =>
    generateCompletion<LLMKeywordExpansionResponse>(clusterPrompt, {
      model: AI_CONFIG.models.reasoning,
      temperature: 0.7,
      maxTokens: 8192,
    })
  );

  // Transform imported keywords
  let keywords: ResearchKeyword[] = clusterResponse.keywords.map(k => ({
    term: k.term,
    intent: validateIntent(k.intent),
    suggestedNodeType: validateNodeType(k.nodeType),
    cluster: k.cluster,
    isImported: true,
  }));

  const clusters: ResearchCluster[] = clusterResponse.clusters.map(c => ({
    name: c.name,
    keywords: keywords.filter(k => k.cluster === c.name).map(k => k.term),
    suggestedPillar: c.pillar,
  }));

  // If we need more keywords to reach target count, generate additional ones
  if (keywords.length < targetCount) {
    const gapCount = targetCount - keywords.length;
    onProgress?.(`Generating ${gapCount} additional keywords to reach target...`);

    const additionalPrompt = getKeywordExpansionPrompt(
      seedKeyword,
      businessDescription,
      gapCount,
      language
    );

    const additionalResponse = await withRetry(() =>
      generateCompletion<LLMKeywordExpansionResponse>(additionalPrompt, {
        model: AI_CONFIG.models.reasoning,
        temperature: 0.9, // Higher temp for diversity
        maxTokens: 8192,
      })
    );

    // Add generated keywords (not imported)
    const additionalKeywords: ResearchKeyword[] = additionalResponse.keywords
      .filter(k => !keywords.some(existing => existing.term.toLowerCase() === k.term.toLowerCase()))
      .slice(0, gapCount)
      .map(k => ({
        term: k.term,
        intent: validateIntent(k.intent),
        suggestedNodeType: validateNodeType(k.nodeType),
        cluster: k.cluster,
        isImported: false,
      }));

    keywords = [...keywords, ...additionalKeywords];

    // Update clusters with new keywords
    additionalKeywords.forEach(k => {
      const cluster = clusters.find(c => c.name === k.cluster);
      if (cluster) {
        cluster.keywords.push(k.term);
      }
    });
  }

  // Find pillar keyword
  const pillarKeyword = keywords.find(k => k.suggestedNodeType === 'pillar')?.term || seedKeyword;

  onProgress?.(`Processed ${keywords.length} keywords in ${clusters.length} clusters`);

  return {
    keywords,
    clusters,
    pillarKeyword,
  };
}

/**
 * Validate and default search intent
 */
function validateIntent(intent: string): SearchIntent {
  const validIntents: SearchIntent[] = ['informational', 'navigational', 'commercial', 'transactional'];
  if (validIntents.includes(intent as SearchIntent)) {
    return intent as SearchIntent;
  }
  return 'informational'; // Default
}

/**
 * Validate and default node type
 */
function validateNodeType(nodeType: string): NodeType {
  const validTypes: NodeType[] = ['pillar', 'cluster', 'supporting', 'blog', 'product', 'category'];
  if (validTypes.includes(nodeType as NodeType)) {
    return nodeType as NodeType;
  }
  return 'supporting'; // Default
}
