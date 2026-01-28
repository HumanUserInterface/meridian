'use client';

import { useProjectStore, CocoonEdge } from '@/stores/projectStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LinkType, LinkPosition } from '@/types';

interface EdgePropertiesProps {
  edge: CocoonEdge;
}

const linkTypes: { value: LinkType; label: string; description: string }[] = [
  { value: 'contextual', label: 'Contextual', description: 'In-content link' },
  { value: 'navigation', label: 'Navigation', description: 'Menu/nav link' },
  { value: 'related', label: 'Related', description: 'Related posts section' },
  { value: 'breadcrumb', label: 'Breadcrumb', description: 'Breadcrumb link' },
  { value: 'cta', label: 'CTA', description: 'Call-to-action link' },
];

const linkPositions: { value: LinkPosition; label: string }[] = [
  { value: 'intro', label: 'Introduction' },
  { value: 'body', label: 'Body Content' },
  { value: 'conclusion', label: 'Conclusion' },
];

export default function EdgeProperties({ edge }: EdgePropertiesProps) {
  const { updateEdge, nodes } = useProjectStore();

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const handleUpdate = (field: string, value: unknown) => {
    updateEdge(edge.id, { [field]: value });
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Link Properties</h3>

        {/* Link Overview */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500">From:</span>
              <span className="font-medium truncate">{sourceNode?.data.title || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">To:</span>
              <span className="font-medium truncate">{targetNode?.data.title || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Link Type */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Link Type</Label>
            <Select
              value={edge.data?.linkType || 'contextual'}
              onValueChange={(value) => handleUpdate('linkType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {linkTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div>{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anchorText">Anchor Text</Label>
            <Input
              id="anchorText"
              value={edge.data?.anchorText || ''}
              onChange={(e) => handleUpdate('anchorText', e.target.value)}
              placeholder="Link anchor text"
            />
          </div>

          <div className="space-y-2">
            <Label>Link Position</Label>
            <Select
              value={edge.data?.position || 'body'}
              onValueChange={(value) => handleUpdate('position', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {linkPositions.map((pos) => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Link Status */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Link Status</h4>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isPlanned" className="font-normal">Planned Link</Label>
            <p className="text-xs text-gray-500">Link not yet implemented</p>
          </div>
          <Switch
            id="isPlanned"
            checked={edge.data?.isPlanned ?? true}
            onCheckedChange={(checked) => handleUpdate('isPlanned', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="nofollow" className="font-normal">Nofollow</Label>
            <p className="text-xs text-gray-500">Add rel=nofollow attribute</p>
          </div>
          <Switch
            id="nofollow"
            checked={edge.data?.nofollow ?? false}
            onCheckedChange={(checked) => handleUpdate('nofollow', checked)}
          />
        </div>
      </div>
    </div>
  );
}
