import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export type CocoonNode = Node<CocoonNodeData>;
export type CocoonEdge = Edge<CocoonEdgeData>;

const defaultSettings: ProjectSettings = {
  autoSave: true,
  showMinimap: true,
  snapToGrid: false,
  gridSize: 20,
  defaultNodeType: 'cluster',
  theme: 'system',
};

const defaultProject: Project = {
  id: 'default',
  name: 'Untitled Project',
  description: '',
  domain: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: defaultSettings,
  keywords: [],
};

interface ProjectState {
  // Current project ID (for multi-project support)
  currentProjectId: string | null;

  // Project data
  project: Project;
  nodes: CocoonNode[];
  edges: CocoonEdge[];

  // Project actions
  setProject: (project: Partial<Project>) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  resetProject: () => void;

  // Multi-project actions
  loadProject: (id: string) => boolean;
  saveProject: () => void;
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

// Helper to get storage key for a project
const getProjectStorageKey = (id: string) => `meridian-project-${id}`;

// Helper to save project data to localStorage
const saveProjectToStorage = (id: string, data: { project: Project; nodes: CocoonNode[]; edges: CocoonEdge[] }) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getProjectStorageKey(id), JSON.stringify(data));
  }
};

// Helper to load project data from localStorage
const loadProjectFromStorage = (id: string): { project: Project; nodes: CocoonNode[]; edges: CocoonEdge[] } | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(getProjectStorageKey(id));
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProjectId: null,
      project: defaultProject,
      nodes: [],
      edges: [],

      setProject: (projectData) => {
        set((state) => ({
          project: {
            ...state.project,
            ...projectData,
            updatedAt: new Date().toISOString(),
          },
        }));
        // Auto-save after update
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        // Auto-save after update
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
        }
      },

      resetProject: () => {
        const state = get();
        const newProject = {
          ...defaultProject,
          id: state.currentProjectId || uuidv4(),
          createdAt: new Date().toISOString()
        };
        set({
          project: newProject,
          nodes: [],
          edges: [],
        });
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: newProject,
            nodes: [],
            edges: [],
          });
        }
      },

      loadProject: (id) => {
        const data = loadProjectFromStorage(id);
        if (data) {
          set({
            currentProjectId: id,
            project: data.project,
            nodes: data.nodes,
            edges: data.edges,
          });
          return true;
        }
        return false;
      },

      saveProject: () => {
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        saveProjectToStorage(id, {
          project: newProject,
          nodes: [],
          edges: [],
        });
      },

      onNodesChange: (changes) => {
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
        }));
        // Defer save to avoid blocking
        setTimeout(() => {
          const state = get();
          if (state.currentProjectId) {
            saveProjectToStorage(state.currentProjectId, {
              project: state.project,
              nodes: state.nodes,
              edges: state.edges,
            });
          }
        }, 0);
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
        // Save after adding
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        // Save after update
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        // Save after delete
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        // Save after duplicate
        const newState = get();
        if (newState.currentProjectId) {
          saveProjectToStorage(newState.currentProjectId, {
            project: newState.project,
            nodes: newState.nodes,
            edges: newState.edges,
          });
        }
      },

      onEdgesChange: (changes) => {
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        }));
        // Defer save
        setTimeout(() => {
          const state = get();
          if (state.currentProjectId) {
            saveProjectToStorage(state.currentProjectId, {
              project: state.project,
              nodes: state.nodes,
              edges: state.edges,
            });
          }
        }, 0);
      },

      onConnect: (connection: Connection) => {
        set((state) => ({
          edges: addEdge(
            {
              ...connection,
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
        // Save after connect
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        // Save after update
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
        }
      },

      deleteEdge: (edgeId) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
          project: { ...state.project, updatedAt: new Date().toISOString() },
        }));
        // Save after delete
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
        }
      },

      addKeyword: (keyword) => {
        set((state) => ({
          project: {
            ...state.project,
            keywords: [...state.project.keywords, { ...keyword, id: uuidv4() }],
            updatedAt: new Date().toISOString(),
          },
        }));
        // Save after add
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        // Save after update
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        // Save after delete
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
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
        // Save after assign
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
        }
      },

      setNodes: (nodes) => {
        set({ nodes });
        // Save after set
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
        }
      },

      setEdges: (edges) => {
        set({ edges });
        // Save after set
        const state = get();
        if (state.currentProjectId) {
          saveProjectToStorage(state.currentProjectId, {
            project: state.project,
            nodes: state.nodes,
            edges: state.edges,
          });
        }
      },
    }),
    {
      name: 'meridian-current-project',
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
      }),
    }
  )
);
