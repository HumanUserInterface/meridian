// Node Types
export type NodeType = 'pillar' | 'cluster' | 'supporting' | 'external' | 'orphan';

export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';

export type ContentStatus = 'planned' | 'draft' | 'review' | 'published' | 'needs-update';

export type LinkType = 'contextual' | 'navigation' | 'related' | 'breadcrumb' | 'cta';

export type LinkPosition = 'intro' | 'body' | 'conclusion';

// Node Data
export interface CocoonNodeData extends Record<string, unknown> {
  title: string;
  slug?: string;
  url?: string;
  primaryKeyword?: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  status: ContentStatus;
  wordCountTarget?: number;
  wordCountActual?: number;
  metaTitle?: string;
  metaDescription?: string;
  notes?: string;
  tags: string[];
  assignee?: string;
  dueDate?: string;
  publishedDate?: string;
  nodeType: NodeType;
}

// Edge Data
export interface CocoonEdgeData extends Record<string, unknown> {
  anchorText?: string;
  position?: LinkPosition;
  nofollow?: boolean;
  isPlanned?: boolean;
  linkType?: LinkType;
}

// Keyword
export interface Keyword {
  id: string;
  term: string;
  volume?: number;
  difficulty?: number;
  intent?: SearchIntent;
  assignedNodeId?: string;
}

// Project Settings
export interface ProjectSettings {
  autoSave: boolean;
  showMinimap: boolean;
  snapToGrid: boolean;
  gridSize: number;
  defaultNodeType: NodeType;
  theme: 'light' | 'dark' | 'system';
}

// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  keywords: Keyword[];
}

// Analysis Results
export interface CocoonAnalysis {
  healthScore: number;
  orphanNodes: string[];
  maxLinkDepth: number;
  nodeCount: {
    pillar: number;
    cluster: number;
    supporting: number;
    external: number;
    orphan: number;
  };
  linkCount: number;
  avgLinksPerNode: number;
  warnings: AnalysisWarning[];
}

export interface AnalysisWarning {
  type: 'orphan' | 'deep-link' | 'missing-keyword' | 'duplicate-keyword' | 'no-pillar';
  message: string;
  nodeIds?: string[];
}

// UI State
export interface PanelState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}

// Export Options
export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'csv' | 'json' | 'xml';
  includeMetadata: boolean;
  highResolution: boolean;
}
