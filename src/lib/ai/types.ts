import { NodeType, SearchIntent, CocoonNodeData, CocoonEdgeData, Keyword, CocoonAnalysis } from '@/types';

// ==========================================
// INPUT TYPES
// ==========================================

export interface CocoonGeneratorInput {
  seedKeyword: string;
  businessDescription: string;
  targetPageCount: number; // 10-2000
  importedKeywords?: string[]; // from CSV
  domain?: string;
  language?: string; // default: 'en'
}

export interface ImportedKeyword {
  term: string;
  volume?: number;
  difficulty?: number;
  intent?: SearchIntent;
}

// ==========================================
// OUTPUT TYPES
// ==========================================

export interface CocoonGeneratorOutput {
  nodes: GeneratedNode[];
  edges: GeneratedEdge[];
  keywords: Keyword[];
  analysis: CocoonAnalysis;
}

export interface GeneratedNode {
  id: string;
  type: 'cocoonNode';
  position: { x: number; y: number };
  data: CocoonNodeData;
}

export interface GeneratedEdge {
  id: string;
  source: string;
  target: string;
  type: 'cocoonEdge';
  data: CocoonEdgeData;
}

// ==========================================
// RESEARCH AGENT TYPES
// ==========================================

export interface ResearchKeyword {
  term: string;
  intent: SearchIntent;
  suggestedNodeType: NodeType;
  cluster: string;
  isImported: boolean;
  volume?: number;
  difficulty?: number;
}

export interface ResearchCluster {
  name: string;
  keywords: string[];
  suggestedPillar: string;
}

export interface ResearchOutput {
  keywords: ResearchKeyword[];
  clusters: ResearchCluster[];
  pillarKeyword: string;
}

// ==========================================
// BUILDER AGENT TYPES
// ==========================================

export interface BuilderNodeInput {
  keyword: ResearchKeyword;
  cluster: string;
  domain?: string;
  language: string;
}

export interface BuilderOutput {
  nodes: GeneratedNode[];
}

// ==========================================
// LINKER AGENT TYPES
// ==========================================

export interface LinkerInput {
  nodes: GeneratedNode[];
  clusters: ResearchCluster[];
}

export interface LinkerOutput {
  edges: GeneratedEdge[];
}

// ==========================================
// PROGRESS & STREAMING TYPES
// ==========================================

export type GenerationStage = 'research' | 'build' | 'link' | 'complete' | 'error';

export interface ProgressEvent {
  event: 'progress';
  data: {
    stage: GenerationStage;
    progress: number; // 0-1
    message: string;
    details?: {
      current?: number;
      total?: number;
    };
  };
}

export interface CompleteEvent {
  event: 'complete';
  data: CocoonGeneratorOutput;
}

export interface ErrorEvent {
  event: 'error';
  data: {
    message: string;
    stage?: GenerationStage;
  };
}

export type StreamEvent = ProgressEvent | CompleteEvent | ErrorEvent;

// ==========================================
// LLM RESPONSE TYPES
// ==========================================

export interface LLMKeywordExpansionResponse {
  keywords: {
    term: string;
    intent: SearchIntent;
    nodeType: NodeType;
    cluster: string;
  }[];
  clusters: {
    name: string;
    pillar: string;
  }[];
}

export interface LLMNodeMetadataResponse {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  wordCountTarget: number;
  tags: string[];
  secondaryKeywords: string[];
}

export interface LLMBatchMetadataResponse {
  nodes: LLMNodeMetadataResponse[];
}

export interface LLMLinkingResponse {
  links: {
    sourceKeyword: string;
    targetKeyword: string;
    linkType: 'contextual' | 'related' | 'navigation' | 'breadcrumb';
    anchorText: string;
  }[];
}

// ==========================================
// CONFIGURATION
// ==========================================

export const AI_CONFIG = {
  models: {
    reasoning: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    simple: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  },
  maxPages: 2000,
  defaultPageCounts: [10, 15, 20, 30, 50, 100, 200] as const,
  batchSize: 10, // Process nodes in batches
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

export type PageCountOption = typeof AI_CONFIG.defaultPageCounts[number] | 'custom';
