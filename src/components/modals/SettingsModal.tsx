'use client';

import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NodeType, LinkStyle } from '@/types';

const linkStyleOptions: { value: LinkStyle; label: string; description: string }[] = [
  { value: 'smooth', label: 'Smooth (Bezier)', description: 'Curved lines between nodes' },
  { value: 'orthogonal', label: 'Square (Orthogonal)', description: 'Right-angle lines around nodes' },
];

const nodeTypeOptions: { value: NodeType; label: string }[] = [
  { value: 'pillar', label: 'Pillar Page' },
  { value: 'cluster', label: 'Cluster Page' },
  { value: 'supporting', label: 'Supporting Page' },
  { value: 'blog', label: 'Blog Article' },
  { value: 'product', label: 'Product Page' },
  { value: 'category', label: 'Category Page' },
];

export default function SettingsModal() {
  const { project, updateSettings, setProject } = useProjectStore();
  const { settingsModalOpen, setSettingsModalOpen, showMinimap, setShowMinimap } = useUIStore();

  const settings = project.settings;

  return (
    <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Configure settings for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Project Information</h3>

            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={project.name}
                onChange={(e) => setProject({ name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-domain">Domain</Label>
              <Input
                id="project-domain"
                value={project.domain || ''}
                onChange={(e) => setProject({ domain: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                value={project.description || ''}
                onChange={(e) => setProject({ description: e.target.value })}
                placeholder="Brief description of the project"
              />
            </div>
          </div>

          {/* Canvas Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Canvas Settings</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Minimap</Label>
                <p className="text-xs text-muted-foreground">Display the minimap on the canvas</p>
              </div>
              <Switch
                checked={showMinimap}
                onCheckedChange={setShowMinimap}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Snap to Grid</Label>
                <p className="text-xs text-muted-foreground">Align nodes to grid when moving</p>
              </div>
              <Switch
                checked={settings.snapToGrid}
                onCheckedChange={(checked) => updateSettings({ snapToGrid: checked })}
              />
            </div>

            {settings.snapToGrid && (
              <div className="space-y-2">
                <Label htmlFor="grid-size">Grid Size</Label>
                <Input
                  id="grid-size"
                  type="number"
                  value={settings.gridSize}
                  onChange={(e) => updateSettings({ gridSize: parseInt(e.target.value) || 20 })}
                  min={10}
                  max={50}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Link Style</Label>
              <Select
                value={settings.linkStyle || 'smooth'}
                onValueChange={(value: LinkStyle) => updateSettings({ linkStyle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {linkStyleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div>{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Default Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Defaults</h3>

            <div className="space-y-2">
              <Label>Default Node Type</Label>
              <Select
                value={settings.defaultNodeType}
                onValueChange={(value: NodeType) => updateSettings({ defaultNodeType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Save</Label>
                <p className="text-xs text-muted-foreground">Automatically save changes</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
