'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useUIStore } from '@/stores/uiStore';
import { useHydration } from '@/lib/useHydration';
import Header from '@/components/Header';
import Canvas from '@/components/canvas/Canvas';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import ExportModal from '@/components/modals/ExportModal';
import ImportModal from '@/components/modals/ImportModal';
import { cn } from '@/lib/utils';

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const isHydrated = useHydration();

  const { loadProject, currentProjectId, nodes, edges, project } = useProjectStore();
  const { getProject, updateProjectMeta, projects } = useProjectsStore();
  const { leftPanelOpen, rightPanelOpen, toggleLeftPanel, toggleRightPanel } = useUIStore();

  // Check if project exists
  // We include projects.length to trigger recalculation when projects list changes
  const projectMeta = useMemo(() => {
    if (!isHydrated) return undefined;
    return getProject(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, projectId, getProject, projects.length]);

  // Determine if project is loaded correctly
  const isLoading = !isHydrated || (projectMeta && currentProjectId !== projectId);
  const notFound = isHydrated && !projectMeta;

  // Load project when needed
  useEffect(() => {
    if (!isHydrated || !projectId || !projectMeta) return;

    // If we already have this project loaded, no need to reload
    if (currentProjectId === projectId) return;

    // Load the project
    loadProject(projectId);
  }, [isHydrated, projectId, loadProject, currentProjectId, projectMeta]);

  // Update project meta stats when nodes/edges change
  useEffect(() => {
    if (currentProjectId && isHydrated && projectMeta) {
      updateProjectMeta(currentProjectId, {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        name: project.name,
        description: project.description,
        domain: project.domain,
      });
    }
  }, [nodes.length, edges.length, project.name, project.description, project.domain, currentProjectId, isHydrated, projectMeta, updateProjectMeta]);

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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The project you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <button
          onClick={() => router.push('/')}
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out overflow-hidden',
            leftPanelOpen ? 'w-72' : 'w-0'
          )}
        >
          <LeftPanel />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>

        {/* Right Panel */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out overflow-hidden',
            rightPanelOpen ? 'w-80' : 'w-0'
          )}
        >
          <RightPanel />
        </div>
      </div>

      {/* Modals */}
      <ExportModal />
      <ImportModal />
    </div>
  );
}
