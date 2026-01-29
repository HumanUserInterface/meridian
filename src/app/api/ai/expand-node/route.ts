import { NextResponse } from 'next/server';
import { generateCompletion, withRetry } from '@/lib/ai/together';
import { AI_CONFIG } from '@/lib/ai/types';
import { NodeType, SearchIntent } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ExpandNodeRequest {
  parentNodeId: string;
  parentKeyword: string;
  parentTitle: string;
  parentNodeType: NodeType;
  parentPosition: { x: number; y: number };
  count?: number; // Default 5
  language?: string;
}

interface GeneratedChildNode {
  id: string;
  keyword: string;
  title: string;
  slug: string;
  nodeType: NodeType;
  intent: SearchIntent;
  metaDescription: string;
}

interface LLMExpandResponse {
  children: {
    keyword: string;
    title: string;
    slug: string;
    nodeType: NodeType;
    intent: SearchIntent;
    metaDescription: string;
  }[];
}

function getExpandPrompt(
  parentKeyword: string,
  parentTitle: string,
  parentNodeType: NodeType,
  count: number,
  language: string
): string {
  return `You are an expert SEO content strategist. Generate ${count} related child page ideas for a semantic cocoon structure.

PARENT PAGE:
- Keyword: "${parentKeyword}"
- Title: "${parentTitle}"
- Page Type: ${parentNodeType}

TASK:
Generate ${count} child pages that would naturally link from this parent page. These should be:
- More specific subtopics of the parent keyword
- Semantically related and valuable for SEO
- Different enough from each other to avoid keyword cannibalization
- Appropriate page types based on the content

PAGE TYPE GUIDELINES:
- "cluster": Subtopic pages that support a pillar
- "supporting": Long-tail, specific content pages
- "blog": Article-style content, how-tos, guides
- "product": Product pages (if e-commerce context)
- "category": Category/collection pages

RESPONSE FORMAT (JSON):
{
  "children": [
    {
      "keyword": "primary keyword for this page",
      "title": "SEO-optimized page title",
      "slug": "url-friendly-slug",
      "nodeType": "cluster|supporting|blog|product|category",
      "intent": "informational|transactional|navigational|commercial",
      "metaDescription": "150-160 char meta description"
    }
  ]
}

Language: ${language}

Generate exactly ${count} unique child pages.`;
}

export async function POST(request: Request) {
  try {
    const body: ExpandNodeRequest = await request.json();
    const {
      parentNodeId,
      parentKeyword,
      parentTitle,
      parentNodeType,
      parentPosition,
      count = 5,
      language = 'en',
    } = body;

    if (!parentKeyword && !parentTitle) {
      return NextResponse.json(
        { error: 'Parent keyword or title is required' },
        { status: 400 }
      );
    }

    const keyword = parentKeyword || parentTitle;

    // Generate child nodes using AI
    const prompt = getExpandPrompt(
      keyword,
      parentTitle,
      parentNodeType,
      count,
      language
    );

    const response = await withRetry(() =>
      generateCompletion<LLMExpandResponse>(prompt, {
        model: AI_CONFIG.models.reasoning,
        temperature: 0.8,
        maxTokens: 2048,
      })
    );

    // Transform response into nodes and edges
    const nodes: GeneratedChildNode[] = response.children.map((child) => ({
      id: uuidv4(),
      keyword: child.keyword,
      title: child.title,
      slug: child.slug,
      nodeType: child.nodeType,
      intent: child.intent,
      metaDescription: child.metaDescription,
    }));

    // Calculate positions in a fan pattern below the parent
    const spacing = 300;
    const startX = parentPosition.x - ((nodes.length - 1) * spacing) / 2;
    const startY = parentPosition.y + 250;

    const formattedNodes = nodes.map((node, index) => ({
      id: node.id,
      type: 'cocoonNode' as const,
      position: {
        x: startX + index * spacing,
        y: startY,
      },
      data: {
        title: node.title,
        nodeType: node.nodeType,
        primaryKeyword: node.keyword,
        slug: node.slug,
        metaDescription: node.metaDescription,
        searchIntent: node.intent,
        secondaryKeywords: [],
        status: 'planned' as const,
        tags: [],
      },
    }));

    // Create edges from parent to each child
    const edges = formattedNodes.map((node) => ({
      id: `edge-${parentNodeId}-${node.id}`,
      source: parentNodeId,
      target: node.id,
      type: 'cocoonEdge' as const,
      data: {
        linkType: 'contextual' as const,
        nofollow: false,
        isPlanned: true,
      },
    }));

    return NextResponse.json({
      nodes: formattedNodes,
      edges,
    });
  } catch (error) {
    console.error('Error expanding node:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to expand node' },
      { status: 500 }
    );
  }
}
