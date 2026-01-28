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
  // Project data
  project: Project;
  nodes: CocoonNode[];
  edges: CocoonEdge[];

  // Project actions
  setProject: (project: Partial<Project>) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  resetProject: () => void;

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

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      project: defaultProject,
      nodes: [],
      edges: [],

      setProject: (projectData) =>
        set((state) => ({
          project: {
            ...state.project,
            ...projectData,
            updatedAt: new Date().toISOString(),
          },
        })),

      updateSettings: (settings) =>
        set((state) => ({
          project: {
            ...state.project,
            settings: { ...state.project.settings, ...settings },
            updatedAt: new Date().toISOString(),
          },
        })),

      resetProject: () =>
        set({
          project: { ...defaultProject, id: uuidv4(), createdAt: new Date().toISOString() },
          nodes: [],
          edges: [],
        }),

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
        })),

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
        return nodeId;
      },

      updateNode: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          project: { ...state.project, updatedAt: new Date().toISOString() },
        })),

      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          project: { ...state.project, updatedAt: new Date().toISOString() },
        })),

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
      },

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        })),

      onConnect: (connection: Connection) =>
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
        })),

      updateEdge: (edgeId, data) =>
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === edgeId
              ? { ...edge, data: { ...edge.data, ...data } }
              : edge
          ),
          project: { ...state.project, updatedAt: new Date().toISOString() },
        })),

      deleteEdge: (edgeId) =>
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
          project: { ...state.project, updatedAt: new Date().toISOString() },
        })),

      addKeyword: (keyword) =>
        set((state) => ({
          project: {
            ...state.project,
            keywords: [...state.project.keywords, { ...keyword, id: uuidv4() }],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateKeyword: (keywordId, data) =>
        set((state) => ({
          project: {
            ...state.project,
            keywords: state.project.keywords.map((kw) =>
              kw.id === keywordId ? { ...kw, ...data } : kw
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteKeyword: (keywordId) =>
        set((state) => ({
          project: {
            ...state.project,
            keywords: state.project.keywords.filter((kw) => kw.id !== keywordId),
            updatedAt: new Date().toISOString(),
          },
        })),

      assignKeywordToNode: (keywordId, nodeId) =>
        set((state) => ({
          project: {
            ...state.project,
            keywords: state.project.keywords.map((kw) =>
              kw.id === keywordId ? { ...kw, assignedNodeId: nodeId ?? undefined } : kw
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
    }),
    {
      name: 'cocoonflow-project',
      partialize: (state) => ({
        project: state.project,
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
