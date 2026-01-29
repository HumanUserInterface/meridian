'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useAIGenerator, ParsedCSV } from '@/hooks/useAIGenerator';
import { AI_CONFIG, PageCountOption } from '@/lib/ai/types';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Upload,
  X,
  FileText,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AIGeneratorModalProps {
  mode: 'dashboard' | 'editor';
}

export default function AIGeneratorModal({ mode }: AIGeneratorModalProps) {
  const router = useRouter();
  const { aiGeneratorModalOpen, setAIGeneratorModalOpen } = useUIStore();
  const { setNodes, setEdges, project } = useProjectStore();
  const { addProject } = useProjectsStore();
  const { initializeNewProject } = useProjectStore();

  const {
    isGenerating,
    stage,
    progress,
    message,
    error,
    generate,
    cancel,
    reset,
    parseCSV,
  } = useAIGenerator();

  // Form state
  const [seedKeyword, setSeedKeyword] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [targetPageCount, setTargetPageCount] = useState<PageCountOption>(20);
  const [customPageCount, setCustomPageCount] = useState('');
  const [domain, setDomain] = useState('');
  const [language, setLanguage] = useState('en');

  // CSV import state
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [isParsingCSV, setIsParsingCSV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    if (isGenerating) {
      cancel();
    }
    reset();
    setSeedKeyword('');
    setBusinessDescription('');
    setTargetPageCount(20);
    setCustomPageCount('');
    setDomain('');
    setLanguage('en');
    setCsvData(null);
    setCsvFileName('');
    setAIGeneratorModalOpen(false);
  }, [isGenerating, cancel, reset, setAIGeneratorModalOpen]);

  // Handle CSV file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCSV(true);
    setCsvFileName(file.name);

    const result = await parseCSV(file);
    if (result) {
      setCsvData(result);
      // Auto-adjust target count based on imported keywords
      if (result.count > 0 && result.count > (targetPageCount === 'custom' ? parseInt(customPageCount) : targetPageCount)) {
        // Find the next higher option or use custom
        const nextOption = AI_CONFIG.defaultPageCounts.find(opt => opt >= result.count);
        if (nextOption) {
          setTargetPageCount(nextOption);
        } else {
          setTargetPageCount('custom');
          setCustomPageCount(result.count.toString());
        }
      }
    }
    setIsParsingCSV(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle generation
  const handleGenerate = async () => {
    const pageCount = targetPageCount === 'custom'
      ? parseInt(customPageCount) || 20
      : targetPageCount;

    const result = await generate({
      seedKeyword,
      businessDescription,
      targetPageCount: pageCount,
      importedKeywords: csvData?.keywords.map(k => k.term),
      domain: domain || undefined,
      language,
    });

    if (result) {
      if (mode === 'dashboard') {
        // Create new project with generated content
        const projectId = addProject(
          seedKeyword,
          businessDescription,
          domain || undefined
        );

        // Initialize project
        initializeNewProject(
          projectId,
          seedKeyword,
          businessDescription,
          domain || undefined
        );

        // Set nodes and edges
        setNodes(result.nodes);
        setEdges(result.edges);

        // Navigate to the new project
        handleClose();
        router.push(`/project/${projectId}`);
      } else {
        // Add to current project
        const currentNodes = useProjectStore.getState().nodes;
        const currentEdges = useProjectStore.getState().edges;

        // Offset new nodes to avoid overlap
        const offsetX = currentNodes.length > 0
          ? Math.max(...currentNodes.map(n => n.position.x)) + 400
          : 0;

        const offsetNodes = result.nodes.map(node => ({
          ...node,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y,
          },
        }));

        setNodes([...currentNodes, ...offsetNodes]);
        setEdges([...currentEdges, ...result.edges]);

        handleClose();
      }
    }
  };

  const isFormValid = seedKeyword.trim() && businessDescription.trim();
  const actualPageCount = targetPageCount === 'custom'
    ? parseInt(customPageCount) || 0
    : targetPageCount;

  // Get stage-specific info
  const getStageInfo = () => {
    switch (stage) {
      case 'research':
        return { label: 'Research', icon: '🔍', color: 'text-blue-500' };
      case 'build':
        return { label: 'Building', icon: '🏗️', color: 'text-amber-500' };
      case 'link':
        return { label: 'Linking', icon: '🔗', color: 'text-emerald-500' };
      case 'complete':
        return { label: 'Complete', icon: '✅', color: 'text-green-500' };
      default:
        return { label: 'Starting', icon: '⏳', color: 'text-gray-500' };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <Dialog open={aiGeneratorModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Generate Semantic Cocoon with AI
          </DialogTitle>
          <DialogDescription>
            {mode === 'dashboard'
              ? 'Create a new project with AI-generated content structure.'
              : 'Add AI-generated pages to your current project.'}
          </DialogDescription>
        </DialogHeader>

        {/* Generation Progress */}
        {isGenerating ? (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">{stageInfo.icon}</div>
              <p className={`font-medium ${stageInfo.color}`}>{stageInfo.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>

            <Progress value={progress * 100} className="h-2" />

            <div className="flex justify-center gap-2 text-sm text-muted-foreground">
              <span className={stage === 'research' || stage === 'build' || stage === 'link' || stage === 'complete' ? 'text-green-500' : ''}>
                {stage === 'research' || stage === 'build' || stage === 'link' || stage === 'complete' ? <Check className="w-4 h-4 inline mr-1" /> : '○'} Research
              </span>
              <span>→</span>
              <span className={stage === 'build' || stage === 'link' || stage === 'complete' ? 'text-green-500' : ''}>
                {stage === 'build' || stage === 'link' || stage === 'complete' ? <Check className="w-4 h-4 inline mr-1" /> : '○'} Build
              </span>
              <span>→</span>
              <span className={stage === 'link' || stage === 'complete' ? 'text-green-500' : ''}>
                {stage === 'link' || stage === 'complete' ? <Check className="w-4 h-4 inline mr-1" /> : '○'} Link
              </span>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={cancel} className="gap-2">
                <X className="w-4 h-4" />
                Cancel Generation
              </Button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <div className="space-y-4 py-2">
            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Seed Keyword */}
            <div className="space-y-2">
              <Label htmlFor="seed-keyword">
                Seed Keyword <span className="text-destructive">*</span>
              </Label>
              <Input
                id="seed-keyword"
                placeholder="e.g., running shoes"
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The main topic around which your semantic cocoon will be built.
              </p>
            </div>

            {/* Business Description */}
            <div className="space-y-2">
              <Label htmlFor="business-desc">
                Business Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="business-desc"
                placeholder="e.g., E-commerce store selling premium running gear for athletes"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Describe your business to help AI generate relevant content.
              </p>
            </div>

            {/* Number of Pages */}
            <div className="space-y-2">
              <Label>Number of Pages</Label>
              <div className="flex gap-2">
                <Select
                  value={targetPageCount.toString()}
                  onValueChange={(v) => setTargetPageCount(v === 'custom' ? 'custom' : parseInt(v) as PageCountOption)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_CONFIG.defaultPageCounts.map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} pages
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {targetPageCount === 'custom' && (
                  <Input
                    type="number"
                    placeholder="Enter count"
                    value={customPageCount}
                    onChange={(e) => setCustomPageCount(e.target.value)}
                    className="w-32"
                    min={1}
                    max={AI_CONFIG.maxPages}
                  />
                )}
              </div>
            </div>

            {/* CSV Import */}
            <div className="space-y-2">
              <Label>Import Keywords (Optional)</Label>
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-4 text-center
                  transition-colors cursor-pointer
                  ${csvData ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isParsingCSV ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing CSV...</span>
                  </div>
                ) : csvData ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">{csvFileName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCsvData(null);
                          setCsvFileName('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {csvData.count} keywords imported
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drop a CSV file or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Must have a &quot;keyword&quot; column
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain (Optional)</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="nl">Dutch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!isFormValid || actualPageCount < 1 || actualPageCount > AI_CONFIG.maxPages}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
