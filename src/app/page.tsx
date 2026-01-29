'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsStore } from '@/stores/projectsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useHydration } from '@/lib/useHydration';
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
  Loader2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

type SortOption = 'modified' | 'created' | 'name';

export default function Dashboard() {
  const router = useRouter();
  const isHydrated = useHydration();

  const { user, isInitialized: authInitialized, initialize: initAuth } = useAuthStore();
  const { projects, isLoading, isInitialized, initialize: initProjects, addProject } = useProjectsStore();
  const { initializeNewProject } = useProjectStore();
  const { setAIGeneratorModalOpen } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('modified');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDomain, setNewProjectDomain] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Initialize auth and projects
  useEffect(() => {
    if (!isHydrated) return;
    initAuth();
  }, [isHydrated, initAuth]);

  useEffect(() => {
    if (!isHydrated || !authInitialized) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Initialize projects
    initProjects();
  }, [isHydrated, authInitialized, user, router, initProjects]);

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

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const id = await addProject(
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
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading state during initialization
  if (!isHydrated || !authInitialized || (user && !isInitialized)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect handled in useEffect
  if (!user) {
    return null;
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Projects Grid */}
          {!isLoading && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredProjects.length === 0 && (
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
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
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
