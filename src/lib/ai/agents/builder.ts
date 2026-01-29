import { v4 as uuidv4 } from 'uuid';
import { CocoonNodeData, ContentStatus } from '@/types';
import { generateCompletion, withRetry } from '../together';
import {
  ResearchKeyword,
  GeneratedNode,
  LLMBatchMetadataResponse,
  AI_CONFIG,
} from '../types';
import { getBatchMetadataPrompt, getDefaultWordCount } from '../prompts';
import { calculateRadialLayout, adjustForOverlaps } from '../layout';

export interface BuilderAgentInput {
  keywords: ResearchKeyword[];
  businessDescription: string;
  domain?: string;
  language: string;
}

/**
 * Builder Agent
 *
 * Creates complete node objects with:
 * - Titles, slugs, meta titles, meta descriptions
 * - Word count targets, tags, secondary keywords
 * - Radial positions for visualization
 */
export async function runBuilderAgent(
  input: BuilderAgentInput,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<GeneratedNode[]> {
  const { keywords, businessDescription, domain, language } = input;

  // Calculate positions using radial layout
  onProgress?.('Calculating layout positions...', 0, keywords.length);
  const positions = calculateRadialLayout(keywords);
  const nodeTypes = new Map(keywords.map(k => [k.term, k.suggestedNodeType]));
  const adjustedPositions = adjustForOverlaps(positions, nodeTypes);

  // Process keywords in batches for metadata generation
  const batchSize = AI_CONFIG.batchSize;
  const nodes: GeneratedNode[] = [];

  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(keywords.length / batchSize);

    onProgress?.(
      `Generating metadata (batch ${batchNum}/${totalBatches})...`,
      i,
      keywords.length
    );

    const batchNodes = await processBatch(
      batch,
      businessDescription,
      domain,
      language,
      adjustedPositions
    );

    nodes.push(...batchNodes);
  }

  onProgress?.(`Created ${nodes.length} pages`, nodes.length, keywords.length);

  return nodes;
}

/**
 * Process a batch of keywords to generate node metadata
 */
async function processBatch(
  keywords: ResearchKeyword[],
  businessDescription: string,
  domain: string | undefined,
  language: string,
  positions: Map<string, { x: number; y: number }>
): Promise<GeneratedNode[]> {
  const prompt = getBatchMetadataPrompt(keywords, businessDescription, domain, language);

  const response = await withRetry(() =>
    generateCompletion<LLMBatchMetadataResponse>(prompt, {
      model: AI_CONFIG.models.simple, // Use faster model for metadata
      temperature: 0.7,
      maxTokens: 4096,
    })
  );

  // Map response to nodes
  return keywords.map((keyword, index) => {
    const metadata = response.nodes[index] || createFallbackMetadata(keyword, domain);
    const position = positions.get(keyword.term) || { x: index * 200, y: 0 };

    const nodeData: CocoonNodeData = {
      title: metadata.title || keyword.term,
      slug: sanitizeSlug(metadata.slug || keyword.term),
      url: domain ? `https://${domain}/${sanitizeSlug(metadata.slug || keyword.term)}` : undefined,
      primaryKeyword: keyword.term,
      secondaryKeywords: metadata.secondaryKeywords || [],
      searchIntent: keyword.intent,
      status: 'planned' as ContentStatus,
      wordCountTarget: metadata.wordCountTarget || getDefaultWordCount(keyword.suggestedNodeType, keyword.intent),
      metaTitle: truncate(metadata.metaTitle || metadata.title || keyword.term, 60),
      metaDescription: truncate(metadata.metaDescription || '', 160),
      tags: metadata.tags || [],
      nodeType: keyword.suggestedNodeType,
    };

    return {
      id: uuidv4(),
      type: 'cocoonNode' as const,
      position,
      data: nodeData,
    };
  });
}

/**
 * Create fallback metadata when LLM response is incomplete
 */
function createFallbackMetadata(
  keyword: ResearchKeyword,
  domain?: string
) {
  const title = capitalizeWords(keyword.term);
  const slug = sanitizeSlug(keyword.term);

  return {
    title,
    slug,
    metaTitle: truncate(title, 60),
    metaDescription: `Learn about ${keyword.term}. Comprehensive guide and information.`,
    wordCountTarget: getDefaultWordCount(keyword.suggestedNodeType, keyword.intent),
    tags: [keyword.cluster],
    secondaryKeywords: [],
  };
}

/**
 * Sanitize string to URL-friendly slug
 */
function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Truncate string to max length, adding ellipsis if needed
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
}
