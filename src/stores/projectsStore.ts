import { create } from 'zustand';
import * as projectsApi from '@/lib/supabase/projects';

export interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
}

interface ProjectsState {
  projects: ProjectMeta[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  addProject: (name: string, description?: string, domain?: string) => Promise<string>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectMeta: (id: string, meta: Partial<Omit<ProjectMeta, 'id'>>) => void;
  getProject: (id: string) => ProjectMeta | undefined;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized || get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const projects = await projectsApi.fetchProjects();
      set({
        projects,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize projects:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load projects',
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  refresh: async () => {
    set({ isLoading: true, error: null });

    try {
      const projects = await projectsApi.fetchProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      console.error('Failed to refresh projects:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh projects',
        isLoading: false,
      });
    }
  },

  addProject: async (name, description, domain) => {
    try {
      const id = await projectsApi.createProject(name, description, domain);

      // Add to local state optimistically
      const now = new Date().toISOString();
      const newProject: ProjectMeta = {
        id,
        name,
        description,
        domain,
        createdAt: now,
        updatedAt: now,
        nodeCount: 0,
        edgeCount: 0,
      };

      set((state) => ({
        projects: [newProject, ...state.projects],
      }));

      return id;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await projectsApi.deleteProject(id);

      // Remove from local state
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  updateProjectMeta: (id, meta) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, ...meta, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id);
  },
}));
