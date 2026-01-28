'use client';

import { useState, useCallback } from 'react';
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
import { parseCSV, importFromCSV } from '@/lib/import';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ImportModal() {
  const { setNodes, nodes } = useProjectStore();
  const { importModalOpen, setImportModalOpen } = useUIStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);
    setPreview(null);

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const rows = parseCSV(content);
        const importedNodes = importFromCSV(rows);

        if (importedNodes.length === 0) {
          setError('No valid data found in CSV. Make sure it has a "Title" column.');
          return;
        }

        setFile(selectedFile);
        setPreview({
          count: importedNodes.length,
          sample: importedNodes.slice(0, 3).map((n) => n.data.title),
        });
      } catch {
        setError('Failed to parse CSV file');
      }
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImport = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const rows = parseCSV(content);
      const importedNodes = importFromCSV(rows);
      setNodes([...nodes, ...importedNodes]);
      setImportModalOpen(false);
      setFile(null);
      setPreview(null);
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setImportModalOpen(false);
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <Dialog open={importModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from CSV</DialogTitle>
          <DialogDescription>
            Import pages from a CSV file. Required column: Title.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging && 'border-blue-500 bg-blue-50',
              error && 'border-red-300 bg-red-50',
              preview && 'border-green-300 bg-green-50',
              !isDragging && !error && !preview && 'border-gray-300 hover:border-gray-400'
            )}
          >
            {error ? (
              <div className="text-red-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">{error}</p>
              </div>
            ) : preview ? (
              <div className="text-green-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">{preview.count} pages ready to import</p>
                <p className="text-sm text-gray-500 mt-2">
                  Preview: {preview.sample.join(', ')}
                  {preview.count > 3 && '...'}
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="font-medium text-gray-700">Drop CSV file here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>

          {/* Expected format */}
          <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Expected CSV columns:
            </p>
            <p className="text-gray-600 text-xs">
              Title, Node Type, Primary Keyword, Secondary Keywords, Search Intent, Status, URL Slug, Word Count Target, Meta Title, Meta Description, Tags, Notes
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Only &quot;Title&quot; is required. All other columns are optional.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!preview}>
            Import {preview?.count || 0} Pages
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
