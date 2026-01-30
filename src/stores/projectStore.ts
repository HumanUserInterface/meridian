import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  ProjectSettings,
  CocoonNodeData,
  CocoonEdgeData,
  Keyword,
  NodeType,
} from '@/types';
import * as projectsApi from '@/lib/supabase/projects';

export type CocoonNode = Node<CocoonNodeData>;
export type CocoonEdge = Edge<CocoonEdgeData>;

const defaultSettings: ProjectSettings = {
  autoSave: true,
  showMinimap: true,
  snapToGrid: false,
  gridSize: 20,
  defaultNodeType: 'cluster',
  theme: 'system',
  linkStyle: 'smooth',
};

const defaultProject: Project = {
  id: '',
  name: 'Untitled Project',
  description: '',
  domain: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: defaultSettings,
  keywords: [],
};

interface ProjectState {
  // Current project ID
  currentProjectId: string | null;

  // Project data
  project: Project;
  nodes: CocoonNode[];
  edges: CocoonEdge[];

  // Loading state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Project actions
  setProject: (project: Partial<Project>) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  resetProject: () => void;

  // Multi-project actions
  loadProject: (id: string) => Promise<boolean>;
  saveProject: () => Promise<void>;
  clearProject: () => void;
  initializeNewProject: (id: string, name: string, description?: string, domain?: string) => void;

  // Node actions
  onNodesChange: OnNodesChange<CocoonNode>;
  addNode: (type: NodeType, position: { x: number; y: number }) => string;
  updateNode: (nodeId: string, data: Partial<CocoonNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // Edge actions
  onEdgesChange: OnEdgesChange<CocoonEdge>;
  onConnect: OnConnect;
  updateEdge: (edgeId: string, data: Partial<CocoonEdgeData>) => void;
  deleteEdge: (edgeId: string) => void;

  // Keyword actions
  addKeyword: (keyword: Omit<Keyword, 'id'>) => void;
  updateKeyword: (keywordId: string, data: Partial<Keyword>) => void;
  deleteKeyword: (keywordId: string) => void;
  assignKeywordToNode: (keywordId: string, nodeId: string | null) => void;

  // Bulk actions
  setNodes: (nodes: CocoonNode[]) => void;
  setEdges: (edges: CocoonEdge[]) => void;
}

// Debounced save function
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DELAY = 1000; // 1 second debounce

function debouncedSave(projectId: string, nodes: CocoonNode[], edges: CocoonEdge[]) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(async () => {
    try {
      await Promise.all([
        projectsApi.saveNodes(projectId, nodes),
        projectsApi.saveEdges(projectId, edges),
      ]);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, SAVE_DELAY);
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  currentProjectId: null,
  project: defaultProject,
  nodes: [],
  edges: [],
  isLoading: false,
  isSaving: false,
  error: null,

  setProject: (projectData) => {
    set((state) => ({
      project: {
        ...state.project,
        ...projectData,
        updatedAt: new Date().toISOString(),
      },
    }));
    // Save project metadata to Supabase
    const state = get();
    if (state.currentProjectId) {
      projectsApi.updateProject(state.currentProjectId, {
        name: state.project.name,
        description: state.project.description,
        domain: state.project.domain,
        settings: state.project.settings,
      }).catch(console.error);
    }
  },

  updateSettings: (settings) => {
    set((state) => ({
      project: {
        ...state.project,
        settings: { ...state.project.settings, ...settings },
        updatedAt: new Date().toISOString(),
      },
    }));
    const state = get();
    if (state.currentProjectId) {
      projectsApi.updateProject(state.currentProjectId, {
        settings: state.project.settings,
      }).catch(console.error);
    }
  },

  resetProject: () => {
    set({
      project: { ...defaultProject, id: get().currentProjectId || '' },
      nodes: [],
      edges: [],
    });
  },

  loadProject: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const data = await projectsApi.loadFullProject(id);
      if (data) {
        set({
          currentProjectId: id,
          project: data.project,
          nodes: data.nodes,
          edges: data.edges,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false, error: 'Project not found' });
      return false;
    } catch (error) {
      console.error('Failed to load project:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load project',
      });
      return false;
    }
  },

  saveProject: async () => {
    const state = get();
    if (!state.currentProjectId) return;

    set({ isSaving: true });

    try {
      await Promise.all([
        projectsApi.saveNodes(state.currentProjectId, state.nodes),
        projectsApi.saveEdges(state.currentProjectId, state.edges),
        projectsApi.updateProject(state.currentProjectId, {
          name: state.project.name,
          description: state.project.description,
          domain: state.project.domain,
          settings: state.project.settings,
        }),
      ]);
      set({ isSaving: false });
    } catch (error) {
      console.error('Failed to save project:', error);
      set({ isSaving: false, error: 'Failed to save' });
    }
  },

  clearProject: () => {
    set({
      currentProjectId: null,
      project: defaultProject,
      nodes: [],
      edges: [],
    });
  },

  initializeNewProject: (id, name, description, domain) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...defaultProject,
      id,
      name,
      description: description || '',
      domain: domain || '',
      createdAt: now,
      updatedAt: now,
    };
    set({
      currentProjectId: id,
      project: newProject,
      nodes: [],
      edges: [],
    });
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
    // Debounced save
    const state = get();
    if (state.currentProjectId) {
      debouncedSave(state.currentProjectId, state.nodes, state.edges);
    }
  },

  addNode: (type, position) => {
    const nodeId = uuidv4();
    const newNode: CocoonNode = {
      id: nodeId,
      type: 'cocoonNode',
      position,
      data: {
        title: type === 'pillar' ? 'New Pillar Page' : type === 'cluster' ? 'New Cluster Page' : 'New Page',
        nodeType: type,
        secondaryKeywords: [],
        searchIntent: 'informational',
        status: 'planned',
        tags: [],
      },
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
      project: { ...state.project, updatedAt: new Date().toISOString() },
    }));
    // Save immediately for new nodes
    const state = get();
    if (state.currentProjectId) {
      projectsApi.saveNode(state.currentProjectId, newNode).catch(console.error);
    }
    return nodeId;
  },

  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
      project: { ...state.project, updatedAt: new Date().toISOString() },
    }));
    // Debounced save
    const state = get();
    if (state.currentProjectId) {
      const updatedNode = state.nodes.find(n => n.id === nodeId);
      if (updatedNode) {
        debouncedSave(state.currentProjectId, state.nodes, state.edges);
      }
    }
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      project: { ...state.project, updatedAt: new Date().toISOString() },
    }));
    // Delete from Supabase
    const state = get();
    if (state.currentProjectId) {
      projectsApi.deleteNode(state.currentProjectId, nodeId).catch(console.error);
    }
  },

  duplicateNode: (nodeId) => {
    const state = get();
    const nodeToDuplicate = state.nodes.find((n) => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newNode: CocoonNode = {
      ...nodeToDuplicate,
      id: uuidv4(),
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
      data: {
        ...nodeToDuplicate.data,
        title: `${nodeToDuplicate.data.title} (Copy)`,
      },
    };

    set({
      nodes: [...state.nodes, newNode],
      project: { ...state.project, updatedAt: new Date().toISOString() },
    });
    // Save new node
    if (state.currentProjectId) {
      projectsApi.saveNode(state.currentProjectId, newNode).catch(console.error);
    }
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
    // Debounced save
    const state = get();
    if (state.currentProjectId) {
      debouncedSave(state.currentProjectId, state.nodes, state.edges);
    }
  },

  onConnect: (connection: Connection) => {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: uuidv4(),
          type: 'cocoonEdge',
          data: {
            linkType: 'contextual',
            nofollow: false,
            isPlanned: true,
          },
        },
        state.edges
      ),
      project: { ...state.project, updatedAt: new Date().toISOString() },
    }));
    // Save edges
    const state = get();
    if (state.currentProjectId) {
      debouncedSave(state.currentProjectId, state.nodes, state.edges);
    }
  },

  updateEdge: (edgeId, data) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...data } }
          : edge
      ),
      project: { ...state.project, updatedAt: new Date().toISOString() },
    }));
    // Debounced save
    const state = get();
    if (state.currentProjectId) {
      debouncedSave(state.currentProjectId, state.nodes, state.edges);
    }
  },

  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
      project: { ...state.project, updatedAt: new Date().toISOString() },
    }));
    // Save edges
    const state = get();
    if (state.currentProjectId) {
      debouncedSave(state.currentProjectId, state.nodes, state.edges);
    }
  },

  addKeyword: (keyword) => {
    const newKeyword = { ...keyword, id: uuidv4() };
    set((state) => ({
      project: {
        ...state.project,
        keywords: [...state.project.keywords, newKeyword],
        updatedAt: new Date().toISOString(),
      },
    }));
    // Save keywords
    const state = get();
    if (state.currentProjectId) {
      projectsApi.saveKeywords(state.currentProjectId, state.project.keywords).catch(console.error);
    }
  },

  updateKeyword: (keywordId, data) => {
    set((state) => ({
      project: {
        ...state.project,
        keywords: state.project.keywords.map((kw) =>
          kw.id === keywordId ? { ...kw, ...data } : kw
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
    // Save keywords
    const state = get();
    if (state.currentProjectId) {
      projectsApi.saveKeywords(state.currentProjectId, state.project.keywords).catch(console.error);
    }
  },

  deleteKeyword: (keywordId) => {
    set((state) => ({
      project: {
        ...state.project,
        keywords: state.project.keywords.filter((kw) => kw.id !== keywordId),
        updatedAt: new Date().toISOString(),
      },
    }));
    // Save keywords
    const state = get();
    if (state.currentProjectId) {
      projectsApi.saveKeywords(state.currentProjectId, state.project.keywords).catch(console.error);
    }
  },

  assignKeywordToNode: (keywordId, nodeId) => {
    set((state) => ({
      project: {
        ...state.project,
        keywords: state.project.keywords.map((kw) =>
          kw.id === keywordId ? { ...kw, assignedNodeId: nodeId ?? undefined } : kw
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
    // Save keywords
    const state = get();
    if (state.currentProjectId) {
      projectsApi.saveKeywords(state.currentProjectId, state.project.keywords).catch(console.error);
    }
  },

  setNodes: (nodes) => {
    set({ nodes });
    // Save nodes
    const state = get();
    if (state.currentProjectId) {
      projectsApi.saveNodes(state.currentProjectId, nodes).catch(console.error);
    }
  },

  setEdges: (edges) => {
    set({ edges });
    // Save edges
    const state = get();
    if (state.currentProjectId) {
      projectsApi.saveEdges(state.currentProjectId, edges).catch(console.error);
    }
  },
}));
