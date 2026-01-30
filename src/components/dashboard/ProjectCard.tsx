'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectMeta, useProjectsStore } from '@/stores/projectsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreVertical,
  Trash2,
  Pencil,
  FolderOpen,
  Globe,
  Calendar,
  GitBranch,
  FileText,
} from 'lucide-react';

interface ProjectCardProps {
  project: ProjectMeta;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const { updateProjectMeta, deleteProject } = useProjectsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleOpen = () => {
    router.push(`/project/${project.id}`);
  };

  const handleRename = () => {
    if (editName.trim()) {
      updateProjectMeta(project.id, { name: editName.trim() });
    } else {
      setEditName(project.name);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    setShowDeleteDialog(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <>
      <div
        className="group relative bg-card border rounded-xl p-5 hover:border-[#1A4A6B] hover:shadow-lg dark:hover:shadow-[#1A4A6B]/10 transition-all duration-200 cursor-pointer"
        onClick={handleOpen}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1A4A6B' }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setEditName(project.name);
                      setIsEditing(false);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 text-sm font-semibold"
                  autoFocus
                />
              ) : (
                <h3
                  className="font-semibold text-foreground truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  {project.name}
                </h3>
              )}
              {project.domain && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{project.domain}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpen(); }}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="secondary" className="text-xs font-normal">
            <FileText className="w-3 h-3 mr-1" />
            {project.nodeCount} {project.nodeCount === 1 ? 'node' : 'nodes'}
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            <GitBranch className="w-3 h-3 mr-1" />
            {project.edgeCount} {project.edgeCount === 1 ? 'link' : 'links'}
          </Badge>
        </div>

        {/* Footer */}
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 mr-1" />
          Modified {formatDate(project.updatedAt)}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
