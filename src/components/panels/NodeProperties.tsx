'use client';

import { useProjectStore, CocoonNode } from '@/stores/projectStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NodeType, SearchIntent, ContentStatus } from '@/types';
import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface NodePropertiesProps {
  node: CocoonNode;
}

const nodeTypes: { value: NodeType; label: string }[] = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'pillar', label: 'Pillar Page' },
  { value: 'category', label: 'Category' },
  { value: 'cluster', label: 'Cluster Page' },
  { value: 'product', label: 'Product' },
  { value: 'blog', label: 'Blog Article' },
  { value: 'supporting', label: 'Supporting Page' },
  { value: 'navpage', label: 'Nav Page' },
  { value: 'external', label: 'External Link' },
];

const searchIntents: { value: SearchIntent; label: string }[] = [
  { value: 'informational', label: 'Informational' },
  { value: 'navigational', label: 'Navigational' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'transactional', label: 'Transactional' },
];

const contentStatuses: { value: ContentStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'published', label: 'Published' },
  { value: 'needs-update', label: 'Needs Update' },
];

// Convert text to URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export default function NodeProperties({ node }: NodePropertiesProps) {
  const { updateNode } = useProjectStore();
  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const handleUpdate = (field: string, value: unknown) => {
    updateNode(node.id, { [field]: value });
  };

  const handleSlugChange = (value: string) => {
    const slugified = slugify(value);
    handleUpdate('slug', slugified);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !node.data.tags.includes(newTag.trim())) {
      handleUpdate('tags', [...node.data.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleUpdate('tags', node.data.tags.filter((t) => t !== tag));
  };

  const handleAddSecondaryKeyword = () => {
    if (newKeyword.trim() && !node.data.secondaryKeywords.includes(newKeyword.trim())) {
      handleUpdate('secondaryKeywords', [...node.data.secondaryKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveSecondaryKeyword = (keyword: string) => {
    handleUpdate('secondaryKeywords', node.data.secondaryKeywords.filter((k) => k !== keyword));
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Node Properties</h3>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={node.data.title}
              onChange={(e) => handleUpdate('title', e.target.value)}
              placeholder="Enter page title"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Node Type</Label>
              <Select
                value={node.data.nodeType}
                onValueChange={(value) => handleUpdate('nodeType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={node.data.status}
                onValueChange={(value) => handleUpdate('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center">
              <span className="text-gray-400 text-sm mr-1">/</span>
              <Input
                id="slug"
                value={node.data.slug || ''}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="your-page-url"
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* SEO Info */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">SEO Details</h4>

        <div className="space-y-2">
          <Label htmlFor="primaryKeyword">Primary Keyword</Label>
          <Input
            id="primaryKeyword"
            value={node.data.primaryKeyword || ''}
            onChange={(e) => handleUpdate('primaryKeyword', e.target.value)}
            placeholder="Enter target keyword"
          />
        </div>

        <div className="space-y-2">
          <Label>Secondary Keywords</Label>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add keyword"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSecondaryKeyword()}
            />
            <Button size="icon" variant="outline" onClick={handleAddSecondaryKeyword}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {node.data.secondaryKeywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="gap-1">
                {keyword}
                <button onClick={() => handleRemoveSecondaryKeyword(keyword)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Search Intent</Label>
          <Select
            value={node.data.searchIntent}
            onValueChange={(value) => handleUpdate('searchIntent', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {searchIntents.map((intent) => (
                <SelectItem key={intent.value} value={intent.value}>
                  {intent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wordCountTarget">Word Count Target</Label>
          <Input
            id="wordCountTarget"
            type="number"
            value={node.data.wordCountTarget || ''}
            onChange={(e) => handleUpdate('wordCountTarget', parseInt(e.target.value) || undefined)}
            placeholder="2000"
          />
        </div>
      </div>

      <Separator />

      {/* Meta Info */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Meta Data</h4>

        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input
            id="metaTitle"
            value={node.data.metaTitle || ''}
            onChange={(e) => handleUpdate('metaTitle', e.target.value)}
            placeholder="SEO title (50-60 chars)"
            maxLength={60}
          />
          <p className="text-xs text-gray-500">
            {(node.data.metaTitle || '').length}/60 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Textarea
            id="metaDescription"
            value={node.data.metaDescription || ''}
            onChange={(e) => handleUpdate('metaDescription', e.target.value)}
            placeholder="SEO description (150-160 chars)"
            maxLength={160}
            rows={3}
          />
          <p className="text-xs text-gray-500">
            {(node.data.metaDescription || '').length}/160 characters
          </p>
        </div>
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Tags</h4>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button size="icon" variant="outline" onClick={handleAddTag}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {node.data.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1">
              {tag}
              <button onClick={() => handleRemoveTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={node.data.notes || ''}
          onChange={(e) => handleUpdate('notes', e.target.value)}
          placeholder="Add notes about this page..."
          rows={4}
        />
      </div>
    </div>
  );
}
