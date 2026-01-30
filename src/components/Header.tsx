'use client';

import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Download,
  Upload,
  Settings,
  PanelLeft,
  PanelRight,
  Share2,
  FileJson,
  FileImage,
  FileText,
  RotateCcw,
  HelpCircle,
  ChevronLeft,
  LayoutDashboard,
  User,
  LogOut,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { autoLayoutNodes } from '@/lib/ai/autoLayout';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { project, setProject, resetProject, nodes, edges } = useProjectStore();
  const { user, initialize, signOut } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);
  const {
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    setExportModalOpen,
    setImportModalOpen,
    setSettingsModalOpen,
    setAIGeneratorModalOpen,
  } = useUIStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project.name);

  // Check if we're in the editor (not on dashboard)
  const isInEditor = pathname.startsWith('/project/');

  const handleNameSubmit = () => {
    setProject({ name: projectName });
    setIsEditingName(false);
  };

  const handleExportJSON = () => {
    const data = {
      project,
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.project) setProject(data.project);
            if (data.nodes) useProjectStore.getState().setNodes(data.nodes);
            if (data.edges) useProjectStore.getState().setEdges(data.edges);
          } catch {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
    router.refresh();
  };

  // Sync project name when project changes
  if (projectName !== project.name && !isEditingName) {
    setProjectName(project.name);
  }

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {isInEditor && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDashboard}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Dashboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLeftPanel}
                className={leftPanelOpen ? 'bg-accent' : ''}
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle left panel ([)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-2">
          <img src="/logo-icon.svg" alt="Meridian" className="w-8 h-8" />
          {isEditingName ? (
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              className="w-48 h-8"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {project.name}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleImportJSON}>
              <FileJson className="w-4 h-4 mr-2" />
              Import JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportModalOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Import CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportJSON}>
              <FileJson className="w-4 h-4 mr-2" />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExportModalOpen(true)}>
              <FileImage className="w-4 h-4 mr-2" />
              Export Image/PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>

        <Button
          variant="default"
          size="sm"
          className="gap-2 bg-brand-seafoam hover:bg-brand-seafoam/90 text-white"
          onClick={() => setAIGeneratorModalOpen(true)}
        >
          <Sparkles className="w-4 h-4" />
          AI Generate
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const layoutedNodes = autoLayoutNodes(nodes, edges);
                  useProjectStore.getState().setNodes(layoutedNodes);
                }}
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto Layout (Clean View)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm('Reset project? This will clear all nodes and edges.')) {
                    resetProject();
                  }
                }}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Project</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setSettingsModalOpen(true)}>
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <ThemeToggle />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help & Keyboard Shortcuts</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRightPanel}
                className={rightPanelOpen ? 'bg-accent' : ''}
              >
                <PanelRight className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle right panel (])</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-6 bg-border mx-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="w-4 h-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
