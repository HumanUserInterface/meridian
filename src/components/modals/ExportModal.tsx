'use client';

import { useState, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportToCSV, exportToXMLSitemap, exportLinkMatrix, downloadFile } from '@/lib/export';
import { FileJson, FileSpreadsheet, FileCode, Link } from 'lucide-react';

type ExportFormat = 'csv' | 'xml-sitemap' | 'link-matrix' | 'json';

export default function ExportModal() {
  const { project, nodes, edges } = useProjectStore();
  const { exportModalOpen, setExportModalOpen } = useUIStore();
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [domain, setDomain] = useState(project.domain || 'https://example.com');

  const handleExport = () => {
    const filename = project.name.replace(/\s+/g, '-').toLowerCase();

    switch (format) {
      case 'csv': {
        const csv = exportToCSV(nodes);
        downloadFile(csv, `${filename}-pages.csv`, 'text/csv');
        break;
      }
      case 'xml-sitemap': {
        const xml = exportToXMLSitemap(nodes, domain);
        downloadFile(xml, `${filename}-sitemap.xml`, 'application/xml');
        break;
      }
      case 'link-matrix': {
        const matrix = exportLinkMatrix(nodes, edges);
        downloadFile(matrix, `${filename}-links.csv`, 'text/csv');
        break;
      }
      case 'json': {
        const json = JSON.stringify({ project, nodes, edges }, null, 2);
        downloadFile(json, `${filename}.json`, 'application/json');
        break;
      }
    }

    setExportModalOpen(false);
  };

  return (
    <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Choose an export format for your semantic cocoon structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>CSV (Page Data)</span>
                  </div>
                </SelectItem>
                <SelectItem value="link-matrix">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    <span>Link Matrix (CSV)</span>
                  </div>
                </SelectItem>
                <SelectItem value="xml-sitemap">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    <span>XML Sitemap</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    <span>JSON (Full Project)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format === 'xml-sitemap' && (
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-xs text-gray-500">
                Only published pages with URLs will be included in the sitemap.
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">Export will include:</p>
            <ul className="text-gray-600 space-y-1">
              {format === 'csv' && (
                <>
                  <li>- {nodes.length} pages with SEO metadata</li>
                  <li>- Keywords, status, and content details</li>
                </>
              )}
              {format === 'link-matrix' && (
                <>
                  <li>- {edges.length} internal links</li>
                  <li>- Anchor text and link types</li>
                </>
              )}
              {format === 'xml-sitemap' && (
                <>
                  <li>- {nodes.filter((n) => n.data.status === 'published' && n.data.slug).length} published URLs</li>
                  <li>- Priority based on node type</li>
                </>
              )}
              {format === 'json' && (
                <>
                  <li>- Full project structure</li>
                  <li>- All nodes, edges, and settings</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setExportModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
