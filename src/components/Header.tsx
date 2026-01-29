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
} from 'lucide-react';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { project, setProject, resetProject, nodes, edges } = useProjectStore();
  const {
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    setExportModalOpen,
    setImportModalOpen,
    setSettingsModalOpen,
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
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-cocoon.json`;
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
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CF</span>
          </div>
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
              className="font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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

        <div className="w-px h-6 bg-border mx-1" />

        <TooltipProvider>
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
      </div>
    </header>
  );
}
