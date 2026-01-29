'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAIGeneratorStore } from '@/stores/aiGeneratorStore';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Check, Loader2 } from 'lucide-react';

/**
 * Floating status indicator for AI generation
 * Shows progress when modal is closed but generation is in progress
 */
export default function AIGenerationStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isGenerating,
    stage,
    progress,
    message,
    result,
    error,
    input,
    cancel,
    reset,
  } = useAIGeneratorStore();

  const { aiGeneratorModalOpen, setAIGeneratorModalOpen } = useUIStore();
  const { setNodes, setEdges, initializeNewProject } = useProjectStore();
  const { addProject } = useProjectsStore();

  // Determine if we're in dashboard or editor mode based on pathname
  const isInEditor = pathname.startsWith('/project/');

  // Handle completion - apply results
  useEffect(() => {
    if (result && !aiGeneratorModalOpen) {
      // Auto-apply results when generation completes
      if (!isInEditor && input) {
        // Dashboard mode: Create new project
        const projectId = addProject(
          input.seedKeyword,
          input.businessDescription,
          input.domain || undefined
        );

        initializeNewProject(
          projectId,
          input.seedKeyword,
          input.businessDescription,
          input.domain || undefined
        );

        setNodes(result.nodes);
        setEdges(result.edges);

        // Navigate to the new project after a short delay
        setTimeout(() => {
          reset();
          router.push(`/project/${projectId}`);
        }, 1500);
      } else {
        // Editor mode: Add to current project
        const currentNodes = useProjectStore.getState().nodes;
        const currentEdges = useProjectStore.getState().edges;

        const offsetX = currentNodes.length > 0
          ? Math.max(...currentNodes.map(n => n.position.x)) + 400
          : 0;

        const offsetNodes = result.nodes.map(node => ({
          ...node,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y,
          },
        }));

        setNodes([...currentNodes, ...offsetNodes]);
        setEdges([...currentEdges, ...result.edges]);

        // Reset after a short delay
        setTimeout(() => {
          reset();
        }, 3000);
      }
    }
  }, [result, aiGeneratorModalOpen, isInEditor, input, addProject, initializeNewProject, setNodes, setEdges, router, reset]);

  // Don't show if modal is open (modal handles its own display)
  if (aiGeneratorModalOpen) return null;

  // Don't show if nothing is happening
  if (!isGenerating && !result && !error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-background border rounded-lg shadow-lg p-4 w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-sm">AI Generation</span>
          </div>
          {isGenerating ? (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={cancel}>
              <X className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={reset}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        {isGenerating && (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground capitalize">{stage}</span>
              <span className="font-mono text-amber-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground truncate">{message}</p>
          </>
        )}

        {result && (
          <div className="flex items-center gap-2 text-green-500">
            <Check className="w-4 h-4" />
            <span className="text-sm">
              Generated {result.nodes.length} pages with {result.edges.length} links
            </span>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive">
            <p className="font-medium">Generation failed</p>
            <p className="text-xs mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setAIGeneratorModalOpen(true)}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Click to expand */}
        {isGenerating && (
          <button
            onClick={() => setAIGeneratorModalOpen(true)}
            className="mt-3 w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Click to view details
          </button>
        )}
      </div>
    </div>
  );
}
