import { createClient } from './client';
import { CocoonNodeData, CocoonEdgeData, Project, ProjectSettings, Keyword } from '@/types';
import { Node, Edge } from '@xyflow/react';

type CocoonNode = Node<CocoonNodeData>;
type CocoonEdge = Edge<CocoonEdgeData>;

// Database types (matching Supabase schema)
interface DbProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
}

interface DbNode {
  id: string;
  project_id: string;
  position_x: number;
  position_y: number;
  node_type: string;
  title: string;
  slug: string | null;
  url: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[];
  search_intent: string;
  status: string;
  word_count_target: number | null;
  word_count_actual: number | null;
  meta_title: string | null;
  meta_description: string | null;
  notes: string | null;
  tags: string[];
  assignee: string | null;
  due_date: string | null;
  published_date: string | null;
  created_at: string;
  updated_at: string;
}

interface DbEdge {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  link_type: string;
  anchor_text: string | null;
  position: string | null;
  nofollow: boolean;
  is_planned: boolean;
  created_at: string;
  updated_at: string;
}

interface DbKeyword {
  id: string;
  project_id: string;
  assigned_node_id: string | null;
  term: string;
  volume: number | null;
  difficulty: number | null;
  intent: string | null;
  created_at: string;
}

// ==========================================
// CONVERSION HELPERS
// ==========================================

function dbNodeToReactFlow(dbNode: DbNode): CocoonNode {
  return {
    id: dbNode.id,
    type: 'cocoonNode',
    position: { x: dbNode.position_x, y: dbNode.position_y },
    data: {
      title: dbNode.title,
      nodeType: dbNode.node_type as CocoonNodeData['nodeType'],
      slug: dbNode.slug || undefined,
      url: dbNode.url || undefined,
      primaryKeyword: dbNode.primary_keyword || undefined,
      secondaryKeywords: dbNode.secondary_keywords || [],
      searchIntent: dbNode.search_intent as CocoonNodeData['searchIntent'],
      status: dbNode.status as CocoonNodeData['status'],
      wordCountTarget: dbNode.word_count_target || undefined,
      wordCountActual: dbNode.word_count_actual || undefined,
      metaTitle: dbNode.meta_title || undefined,
      metaDescription: dbNode.meta_description || undefined,
      notes: dbNode.notes || undefined,
      tags: dbNode.tags || [],
      assignee: dbNode.assignee || undefined,
      dueDate: dbNode.due_date || undefined,
      publishedDate: dbNode.published_date || undefined,
    },
  };
}

function reactFlowNodeToDb(node: CocoonNode, projectId: string): Omit<DbNode, 'created_at' | 'updated_at'> {
  return {
    id: node.id,
    project_id: projectId,
    position_x: node.position.x,
    position_y: node.position.y,
    node_type: node.data.nodeType,
    title: node.data.title,
    slug: node.data.slug || null,
    url: node.data.url || null,
    primary_keyword: node.data.primaryKeyword || null,
    secondary_keywords: node.data.secondaryKeywords || [],
    search_intent: node.data.searchIntent || 'informational',
    status: node.data.status || 'planned',
    word_count_target: node.data.wordCountTarget || null,
    word_count_actual: node.data.wordCountActual || null,
    meta_title: node.data.metaTitle || null,
    meta_description: node.data.metaDescription || null,
    notes: node.data.notes || null,
    tags: node.data.tags || [],
    assignee: node.data.assignee || null,
    due_date: node.data.dueDate || null,
    published_date: node.data.publishedDate || null,
  };
}

function dbEdgeToReactFlow(dbEdge: DbEdge): CocoonEdge {
  return {
    id: dbEdge.id,
    source: dbEdge.source_node_id,
    target: dbEdge.target_node_id,
    type: 'cocoonEdge',
    data: {
      linkType: dbEdge.link_type as CocoonEdgeData['linkType'],
      anchorText: dbEdge.anchor_text || undefined,
      position: dbEdge.position as CocoonEdgeData['position'] || undefined,
      nofollow: dbEdge.nofollow,
      isPlanned: dbEdge.is_planned,
    },
  };
}

function reactFlowEdgeToDb(edge: CocoonEdge, projectId: string): Omit<DbEdge, 'created_at' | 'updated_at'> {
  return {
    id: edge.id,
    project_id: projectId,
    source_node_id: edge.source,
    target_node_id: edge.target,
    link_type: edge.data?.linkType || 'contextual',
    anchor_text: edge.data?.anchorText || null,
    position: edge.data?.position || null,
    nofollow: edge.data?.nofollow || false,
    is_planned: edge.data?.isPlanned ?? true,
  };
}

function dbProjectToProject(dbProject: DbProject): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || '',
    domain: dbProject.domain || '',
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at,
    settings: dbProject.settings,
    keywords: [], // Keywords loaded separately
  };
}

// ==========================================
// PROJECT OPERATIONS
// ==========================================

export async function fetchProjects(): Promise<{ id: string; name: string; description?: string; domain?: string; createdAt: string; updatedAt: string; nodeCount: number; edgeCount: number }[]> {
  const supabase = createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      domain,
      created_at,
      updated_at,
      nodes(count),
      edges(count)
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return (projects || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || undefined,
    domain: p.domain || undefined,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    nodeCount: p.nodes?.[0]?.count || 0,
    edgeCount: p.edges?.[0]?.count || 0,
  }));
}

export async function createProject(
  name: string,
  description?: string,
  domain?: string
): Promise<string> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Auth error:', authError);
    throw new Error(`Authentication error: ${authError.message}`);
  }

  if (!user) {
    console.error('No user found - not authenticated');
    throw new Error('Not authenticated. Please log in again.');
  }

  console.log('Creating project for user:', user.id);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      domain: domain || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating project:', error.message, error.details, error.hint);
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data.id;
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export async function updateProject(
  projectId: string,
  updates: { name?: string; description?: string; domain?: string; settings?: ProjectSettings }
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('projects')
    .update({
      name: updates.name,
      description: updates.description,
      domain: updates.domain,
      settings: updates.settings,
    })
    .eq('id', projectId);

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

// ==========================================
// LOAD FULL PROJECT (with nodes, edges, keywords)
// ==========================================

export async function loadFullProject(projectId: string): Promise<{
  project: Project;
  nodes: CocoonNode[];
  edges: CocoonEdge[];
} | null> {
  const supabase = createClient();

  // Fetch project
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !projectData) {
    console.error('Error loading project:', projectError);
    return null;
  }

  // Fetch nodes
  const { data: nodesData, error: nodesError } = await supabase
    .from('nodes')
    .select('*')
    .eq('project_id', projectId);

  if (nodesError) {
    console.error('Error loading nodes:', nodesError);
    throw nodesError;
  }

  // Fetch edges
  const { data: edgesData, error: edgesError } = await supabase
    .from('edges')
    .select('*')
    .eq('project_id', projectId);

  if (edgesError) {
    console.error('Error loading edges:', edgesError);
    throw edgesError;
  }

  // Fetch keywords
  const { data: keywordsData, error: keywordsError } = await supabase
    .from('keywords')
    .select('*')
    .eq('project_id', projectId);

  if (keywordsError) {
    console.error('Error loading keywords:', keywordsError);
  }

  const project = dbProjectToProject(projectData as DbProject);
  project.keywords = (keywordsData || []).map((k: DbKeyword) => ({
    id: k.id,
    term: k.term,
    volume: k.volume || undefined,
    difficulty: k.difficulty || undefined,
    intent: k.intent as Keyword['intent'] || undefined,
    assignedNodeId: k.assigned_node_id || undefined,
  }));

  return {
    project,
    nodes: (nodesData || []).map(dbNodeToReactFlow),
    edges: (edgesData || []).map(dbEdgeToReactFlow),
  };
}

// ==========================================
// SAVE OPERATIONS (upsert nodes/edges)
// ==========================================

export async function saveNodes(projectId: string, nodes: CocoonNode[]): Promise<void> {
  const supabase = createClient();

  if (nodes.length === 0) {
    // Delete all nodes for this project
    await supabase.from('nodes').delete().eq('project_id', projectId);
    return;
  }

  const dbNodes = nodes.map(n => reactFlowNodeToDb(n, projectId));

  const { error } = await supabase
    .from('nodes')
    .upsert(dbNodes, { onConflict: 'id' });

  if (error) {
    console.error('Error saving nodes:', error);
    throw error;
  }
}

export async function saveEdges(projectId: string, edges: CocoonEdge[]): Promise<void> {
  const supabase = createClient();

  // First delete all existing edges for this project (simpler than diffing)
  await supabase.from('edges').delete().eq('project_id', projectId);

  if (edges.length === 0) return;

  const dbEdges = edges.map(e => reactFlowEdgeToDb(e, projectId));

  const { error } = await supabase
    .from('edges')
    .insert(dbEdges);

  if (error) {
    console.error('Error saving edges:', error);
    throw error;
  }
}

export async function saveNode(projectId: string, node: CocoonNode): Promise<void> {
  const supabase = createClient();

  const dbNode = reactFlowNodeToDb(node, projectId);

  const { error } = await supabase
    .from('nodes')
    .upsert(dbNode, { onConflict: 'id' });

  if (error) {
    console.error('Error saving node:', error);
    throw error;
  }
}

export async function deleteNode(projectId: string, nodeId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('nodes')
    .delete()
    .eq('id', nodeId)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error deleting node:', error);
    throw error;
  }
}

export async function saveKeywords(projectId: string, keywords: Keyword[]): Promise<void> {
  const supabase = createClient();

  // Delete existing keywords
  await supabase.from('keywords').delete().eq('project_id', projectId);

  if (keywords.length === 0) return;

  const dbKeywords = keywords.map(k => ({
    id: k.id,
    project_id: projectId,
    assigned_node_id: k.assignedNodeId || null,
    term: k.term,
    volume: k.volume || null,
    difficulty: k.difficulty || null,
    intent: k.intent || null,
  }));

  const { error } = await supabase
    .from('keywords')
    .insert(dbKeywords);

  if (error) {
    console.error('Error saving keywords:', error);
    throw error;
  }
}
