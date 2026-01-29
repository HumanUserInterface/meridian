'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsStore } from '@/stores/projectsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useStoreHydration } from '@/lib/useHydration';
import ProjectCard from '@/components/dashboard/ProjectCard';
import Sidebar from '@/components/dashboard/Sidebar';
import AIGeneratorModal from '@/components/modals/AIGeneratorModal';
import AIGenerationStatus from '@/components/AIGenerationStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  FolderOpen,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

type SortOption = 'modified' | 'created' | 'name';

export default function Dashboard() {
  const router = useRouter();
  const { projects, addProject, migrated, setMigrated } = useProjectsStore();
  const { initializeNewProject } = useProjectStore();
  const { setAIGeneratorModalOpen } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('modified');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDomain, setNewProjectDomain] = useState('');
  const isHydrated = useStoreHydration();

  // Migration logic: migrate old single-project data to new multi-project format
  useEffect(() => {
    if (!isHydrated) return;

    // Check if we need to migrate
    if (migrated) return;

    const oldProjectData = localStorage.getItem('meridian-project');
    if (oldProjectData) {
      try {
        const data = JSON.parse(oldProjectData);
        if (data.state) {
          const { project, nodes, edges } = data.state;

          // Generate new ID for the migrated project
          const newId = crypto.randomUUID();

          // Save the project data under the new key
          localStorage.setItem(`meridian-project-${newId}`, JSON.stringify({
            project: { ...project, id: newId },
            nodes: nodes || [],
            edges: edges || [],
          }));

          // Add to projects list
          addProject(
            project.name || 'Migrated Project',
            project.description,
            project.domain
          );

          // Update the newly added project with correct stats
          const projectsState = useProjectsStore.getState();
          const lastProject = projectsState.projects[projectsState.projects.length - 1];
          if (lastProject) {
            projectsState.updateProjectMeta(lastProject.id, {
              nodeCount: nodes?.length || 0,
              edgeCount: edges?.length || 0,
            });

            // Fix: we need to update the stored project data with the correct ID
            localStorage.removeItem(`meridian-project-${newId}`);
            localStorage.setItem(`meridian-project-${lastProject.id}`, JSON.stringify({
              project: { ...project, id: lastProject.id },
              nodes: nodes || [],
              edges: edges || [],
            }));
          }

          // Remove old data
          localStorage.removeItem('meridian-project');
        }
      } catch (e) {
        console.error('Failed to migrate old project data:', e);
      }
    }

    setMigrated(true);
  }, [isHydrated, migrated, addProject, setMigrated]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.domain?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'modified':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, searchQuery, sortBy]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const id = addProject(
      newProjectName.trim(),
      newProjectDescription.trim() || undefined,
      newProjectDomain.trim() || undefined
    );

    // Initialize the project store with the new project
    initializeNewProject(
      id,
      newProjectName.trim(),
      newProjectDescription.trim() || undefined,
      newProjectDomain.trim() || undefined
    );

    // Reset form
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectDomain('');
    setShowNewProjectDialog(false);

    // Navigate to the new project
    router.push(`/project/${id}`);
  };

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Projects</h1>
              <p className="text-sm text-muted-foreground">
                Manage your semantic cocoon projects
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => setAIGeneratorModalOpen(true)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Generate with AI
              </Button>
              <Button onClick={() => setShowNewProjectDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-48">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modified">Last modified</SelectItem>
                <SelectItem value="created">Date created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium text-foreground mb-1">No projects found</h3>
                  <p className="text-muted-foreground mb-4">
                    No projects match your search &quot;{searchQuery}&quot;
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-foreground mb-1">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first semantic cocoon project to get started
                  </p>
                  <Button onClick={() => setShowNewProjectDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Project
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Stats Footer */}
          {projects.length > 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
            </div>
          )}
        </main>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Start a new semantic cocoon project for your website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                placeholder="My SEO Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    handleCreateProject();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-domain">Domain (optional)</Label>
              <Input
                id="project-domain"
                placeholder="example.com"
                value={newProjectDomain}
                onChange={(e) => setNewProjectDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                placeholder="Brief description of your project..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generator Modal */}
      <AIGeneratorModal mode="dashboard" />

      {/* Floating AI Generation Status */}
      <AIGenerationStatus />
    </div>
  );
}
