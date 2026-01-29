import { NodeType, SearchIntent } from '@/types';
import { ResearchKeyword } from './types';

// ==========================================
// RESEARCH AGENT PROMPTS
// ==========================================

export function getKeywordExpansionPrompt(
  seedKeyword: string,
  businessDescription: string,
  targetCount: number,
  language: string
): string {
  return `You are an expert SEO strategist creating a semantic cocoon structure.

BUSINESS CONTEXT:
- Seed keyword: "${seedKeyword}"
- Business: ${businessDescription}
- Target: Generate exactly ${targetCount} keywords
- Language: ${language}

TASK:
Generate a comprehensive list of ${targetCount} keywords related to "${seedKeyword}" that would form an effective semantic cocoon. The keywords should cover:

1. PILLAR TOPIC (1 keyword): The main, broad topic that encompasses the seed keyword
2. CLUSTER TOPICS (3-7 keywords): Subtopics that branch from the pillar
3. SUPPORTING CONTENT: Long-tail keywords for each cluster

For each keyword, determine:
- Search intent: "informational" (learning/how-to), "navigational" (finding specific page), "commercial" (comparing options), "transactional" (ready to buy/act)
- Node type based on intent:
  - "pillar" for the main topic
  - "cluster" for subtopics
  - "supporting" for long-tail informational content
  - "product" for transactional product-focused keywords
  - "category" for commercial comparison/category pages
  - "blog" for informational how-to/guide content

Group keywords into logical clusters by topic similarity.

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "keywords": [
    {
      "term": "keyword phrase",
      "intent": "informational|navigational|commercial|transactional",
      "nodeType": "pillar|cluster|supporting|product|category|blog",
      "cluster": "cluster name"
    }
  ],
  "clusters": [
    {
      "name": "cluster name",
      "pillar": "main keyword for this cluster"
    }
  ]
}

IMPORTANT:
- Generate EXACTLY ${targetCount} keywords
- Include 1 pillar, 3-7 clusters, and fill the rest with supporting/blog/product content
- Keywords should be natural phrases people actually search for
- Ensure good coverage of different search intents
- Each cluster should have at least 2-3 supporting keywords`;
}

export function getKeywordClusteringPrompt(
  keywords: string[],
  seedKeyword: string,
  businessDescription: string,
  language: string
): string {
  return `You are an expert SEO strategist analyzing imported keywords for a semantic cocoon.

CONTEXT:
- Seed keyword: "${seedKeyword}"
- Business: ${businessDescription}
- Language: ${language}
- Imported keywords: ${keywords.length} total

KEYWORDS TO ANALYZE:
${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

TASK:
Analyze these keywords and organize them into a semantic cocoon structure:

1. Identify which keyword should be the PILLAR (most broad/central topic)
2. Group related keywords into CLUSTERS (3-7 clusters)
3. Determine search intent and appropriate node type for each keyword

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "keywords": [
    {
      "term": "keyword phrase",
      "intent": "informational|navigational|commercial|transactional",
      "nodeType": "pillar|cluster|supporting|product|category|blog",
      "cluster": "cluster name"
    }
  ],
  "clusters": [
    {
      "name": "cluster name",
      "pillar": "main keyword for this cluster"
    }
  ]
}

RULES:
- Use EXACTLY the keywords provided (don't modify or add new ones)
- Assign exactly ONE keyword as "pillar" nodeType
- Each cluster should have one "cluster" nodeType keyword as its main topic
- Remaining keywords should be "supporting", "blog", "product", or "category"
- Every keyword must belong to a cluster`;
}

// ==========================================
// BUILDER AGENT PROMPTS
// ==========================================

export function getBatchMetadataPrompt(
  keywords: ResearchKeyword[],
  businessDescription: string,
  domain: string | undefined,
  language: string
): string {
  const keywordList = keywords.map((k, i) =>
    `${i + 1}. "${k.term}" (${k.suggestedNodeType}, ${k.intent} intent, cluster: ${k.cluster})`
  ).join('\n');

  return `You are an expert SEO content strategist creating page metadata for a semantic cocoon.

BUSINESS CONTEXT:
- Business: ${businessDescription}
- Domain: ${domain || 'example.com'}
- Language: ${language}

KEYWORDS TO PROCESS (${keywords.length} total):
${keywordList}

For EACH keyword, generate:

1. TITLE: SEO-optimized page title (compelling, includes keyword naturally, 50-60 chars)
2. SLUG: URL-friendly slug (lowercase, hyphens, no special chars)
3. META TITLE: SEO meta title (≤60 chars, includes primary keyword)
4. META DESCRIPTION: Compelling meta description (≤160 chars, includes keyword, has CTA)
5. WORD COUNT TARGET: Recommended word count based on intent and type:
   - Pillar pages: 2000-3000 words
   - Cluster pages: 1500-2000 words
   - Supporting/Blog: 1000-1500 words
   - Product pages: 500-800 words
   - Category pages: 800-1200 words
6. TAGS: 3-5 relevant tags for categorization
7. SECONDARY KEYWORDS: 2-4 related keywords to include in content

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "nodes": [
    {
      "title": "Page Title Here",
      "slug": "page-slug-here",
      "metaTitle": "Meta Title ≤60 chars",
      "metaDescription": "Meta description ≤160 chars with compelling CTA",
      "wordCountTarget": 1500,
      "tags": ["tag1", "tag2", "tag3"],
      "secondaryKeywords": ["related keyword 1", "related keyword 2"]
    }
  ]
}

IMPORTANT:
- Generate metadata for ALL ${keywords.length} keywords in the same order
- Ensure all meta titles are ≤60 characters
- Ensure all meta descriptions are ≤160 characters
- Make titles and descriptions compelling and unique for each page
- Slugs should be short, clean, and SEO-friendly`;
}

// ==========================================
// LINKER AGENT PROMPTS
// ==========================================

export function getLinkingPrompt(
  nodes: Array<{ keyword: string; nodeType: NodeType; cluster: string }>,
  clusters: Array<{ name: string; pillar: string }>
): string {
  const nodeList = nodes.map((n, i) =>
    `${i + 1}. "${n.keyword}" (${n.nodeType}) - Cluster: ${n.cluster}`
  ).join('\n');

  const clusterList = clusters.map(c =>
    `- ${c.name}: pillar is "${c.pillar}"`
  ).join('\n');

  return `You are an expert in internal linking and site architecture for SEO.

NODES IN THE COCOON (${nodes.length} total):
${nodeList}

CLUSTER STRUCTURE:
${clusterList}

TASK:
Create an internal linking structure following these rules:

1. PILLAR LINKS:
   - Pillar page links to ALL cluster pages (bidirectional, contextual)
   - This creates the hub-and-spoke structure

2. CLUSTER LINKS:
   - Each cluster page links to its supporting pages (contextual)
   - Supporting pages link back to their cluster (related or breadcrumb)

3. CROSS-CLUSTER LINKS:
   - Add semantic links between related content across clusters
   - Use "related" link type for these

4. LINK BALANCE:
   - Aim for 2-4 incoming links per page
   - No page should be orphaned (0 incoming links)
   - Pillar can have more links (it's the hub)

LINK TYPES:
- "contextual": In-content link (primary link type)
- "related": Related content section link
- "navigation": Menu/nav link (use sparingly)
- "breadcrumb": Breadcrumb trail link (from child to parent)

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "links": [
    {
      "sourceKeyword": "keyword of source page",
      "targetKeyword": "keyword of target page",
      "linkType": "contextual|related|navigation|breadcrumb",
      "anchorText": "anchor text for the link"
    }
  ]
}

IMPORTANT:
- Use EXACT keywords from the node list (case-sensitive)
- Create enough links so no page is orphaned
- Prioritize contextual links for SEO value
- Anchor text should be natural and relevant
- Don't create duplicate links (same source→target)
- Generate ${Math.min(nodes.length * 3, 150)} links approximately`;
}

// ==========================================
// HELPER: NODE TYPE TO WORD COUNT
// ==========================================

export function getDefaultWordCount(nodeType: NodeType, intent: SearchIntent): number {
  const baseWordCounts: Record<NodeType, number> = {
    pillar: 2500,
    cluster: 1800,
    supporting: 1200,
    blog: 1200,
    product: 600,
    category: 1000,
    homepage: 500,
    navpage: 300,
    external: 0,
    orphan: 1000,
  };

  // Adjust based on intent
  const intentMultiplier: Record<SearchIntent, number> = {
    informational: 1.2, // More detailed content
    commercial: 1.0,
    navigational: 0.8,
    transactional: 0.7, // Focus on conversion, not length
  };

  return Math.round(baseWordCounts[nodeType] * intentMultiplier[intent]);
}
