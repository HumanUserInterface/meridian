'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useHydration } from '@/lib/useHydration';
import Header from '@/components/Header';
import Canvas from '@/components/canvas/Canvas';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import ExportModal from '@/components/modals/ExportModal';
import ImportModal from '@/components/modals/ImportModal';
import AIGeneratorModal from '@/components/modals/AIGeneratorModal';
import SettingsModal from '@/components/modals/SettingsModal';
import AIGenerationStatus from '@/components/AIGenerationStatus';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const isHydrated = useHydration();

  const { user, isInitialized: authInitialized, initialize: initAuth } = useAuthStore();
  const { loadProject, currentProjectId, isLoading, error, nodes, edges, project } = useProjectStore();
  const { updateProjectMeta } = useProjectsStore();
  const { leftPanelOpen, rightPanelOpen, toggleLeftPanel, toggleRightPanel } = useUIStore();

  // Initialize auth
  useEffect(() => {
    if (!isHydrated) return;
    initAuth();
  }, [isHydrated, initAuth]);

  // Load project when authenticated
  useEffect(() => {
    if (!isHydrated || !authInitialized) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load the project if not already loaded
    if (projectId && currentProjectId !== projectId) {
      loadProject(projectId);
    }
  }, [isHydrated, authInitialized, user, projectId, currentProjectId, loadProject, router]);

  // Update project meta stats when nodes/edges change
  useEffect(() => {
    if (currentProjectId && currentProjectId === projectId) {
      updateProjectMeta(currentProjectId, {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        name: project.name,
        description: project.description,
        domain: project.domain,
      });
    }
  }, [nodes.length, edges.length, project.name, project.description, project.domain, currentProjectId, projectId, updateProjectMeta]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '[') {
        toggleLeftPanel();
      } else if (e.key === ']') {
        toggleRightPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftPanel, toggleRightPanel]);

  // Loading state
  if (!isHydrated || !authInitialized || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading project...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Error state (project not found)
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h1>
        <p className="text-muted-foreground mb-4">
          {error}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out overflow-hidden relative',
            leftPanelOpen ? 'w-72' : 'w-0'
          )}
        >
          <LeftPanel />
        </div>

        {/* Left Panel Expand Button (visible when collapsed) */}
        {!leftPanelOpen && (
          <button
            onClick={toggleLeftPanel}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-background border rounded-r-md shadow-md hover:bg-accent transition-colors flex items-center justify-center"
            title="Expand left panel"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>

        {/* Right Panel Expand Button (visible when collapsed) */}
        {!rightPanelOpen && (
          <button
            onClick={toggleRightPanel}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-background border rounded-l-md shadow-md hover:bg-accent transition-colors flex items-center justify-center"
            title="Expand right panel"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Right Panel */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out overflow-hidden relative',
            rightPanelOpen ? 'w-80' : 'w-0'
          )}
        >
          <RightPanel />
        </div>
      </div>

      {/* Modals */}
      <ExportModal />
      <ImportModal />
      <AIGeneratorModal mode="editor" />
      <SettingsModal />

      {/* Floating AI Generation Status */}
      <AIGenerationStatus />
    </div>
  );
}
