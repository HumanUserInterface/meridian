import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

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
  migrated: boolean;
  addProject: (name: string, description?: string, domain?: string) => string;
  deleteProject: (id: string) => void;
  updateProjectMeta: (id: string, meta: Partial<Omit<ProjectMeta, 'id'>>) => void;
  getProject: (id: string) => ProjectMeta | undefined;
  setMigrated: (migrated: boolean) => void;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      migrated: false,

      addProject: (name, description, domain) => {
        const id = uuidv4();
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
          projects: [...state.projects, newProject],
        }));
        return id;
      },

      deleteProject: (id) => {
        // Remove project metadata
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
        // Remove project data from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`cocoonflow-project-${id}`);
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

      setMigrated: (migrated) => {
        set({ migrated });
      },
    }),
    {
      name: 'cocoonflow-projects',
    }
  )
);
