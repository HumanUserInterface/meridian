'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import { useAIGeneratorStore } from '@/stores/aiGeneratorStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { AI_CONFIG, PageCountOption } from '@/lib/ai/types';
import { autoLayoutNodes } from '@/lib/ai/autoLayout';

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
  Minimize2,
  CheckCircle2,
} from 'lucide-react';

interface ParsedCSV {
  keywords: Array<{
    term: string;
    volume?: number;
    difficulty?: number;
    intent?: string;
  }>;
  count: number;
}

interface AIGeneratorModalProps {
  mode: 'dashboard' | 'editor';
}

export default function AIGeneratorModal({ mode }: AIGeneratorModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { aiGeneratorModalOpen, setAIGeneratorModalOpen } = useUIStore();
  const { setNodes, setEdges, initializeNewProject } = useProjectStore();
  const { addProject } = useProjectsStore();

  const {
    isGenerating,
    stage,
    progress,
    message,
    result,
    error,
    input,
    startGeneration,
    cancel,
    reset,
  } = useAIGeneratorStore();

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
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track if we've handled completion
  const [completionHandled, setCompletionHandled] = useState(false);

  // Determine if we're in dashboard or editor mode based on pathname
  const isInEditor = pathname.startsWith('/project/');

  // Handle completion - auto-apply and redirect
  useEffect(() => {
    if (result && !completionHandled && stage === 'complete') {
      setCompletionHandled(true);

      // Apply results
      if (!isInEditor && input) {
        // Dashboard mode: Create new project (async)
        const createAndNavigate = async () => {
          try {
            const projectId = await addProject(
              input.seedKeyword,
              input.businessDescription,
              input.domain || undefined
            );

            // Auto-layout the generated nodes
            const layoutedNodes = autoLayoutNodes(result.nodes, result.edges);

            // Initialize the project store
            const store = useProjectStore.getState();
            store.initializeNewProject(
              projectId,
              input.seedKeyword,
              input.businessDescription,
              input.domain || undefined
            );

            // Set nodes and edges (this saves to Supabase)
            store.setNodes(layoutedNodes);
            store.setEdges(result.edges);

            // Auto-redirect after short delay
            setTimeout(() => {
              resetForm();
              reset();
              setAIGeneratorModalOpen(false);
              router.push(`/project/${projectId}`);
            }, 1500);
          } catch (error) {
            console.error('Failed to create project:', error);
          }
        };

        createAndNavigate();
      } else {
        // Editor mode: Add to current project
        const store = useProjectStore.getState();
        const currentNodes = store.nodes;
        const currentEdges = store.edges;

        // Auto-layout new nodes
        const layoutedNewNodes = autoLayoutNodes(result.nodes, result.edges);

        // Offset new nodes to avoid overlap
        const offsetX = currentNodes.length > 0
          ? Math.max(...currentNodes.map(n => n.position.x)) + 400
          : 0;

        const offsetNodes = layoutedNewNodes.map(node => ({
          ...node,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y,
          },
        }));

        store.setNodes([...currentNodes, ...offsetNodes]);
        store.setEdges([...currentEdges, ...result.edges]);
        // Force explicit save
        store.saveProject();

        // Close modal after short delay
        setTimeout(() => {
          resetForm();
          reset();
          setAIGeneratorModalOpen(false);
        }, 1500);
      }
    }
  }, [result, stage, completionHandled, isInEditor, input]);

  // Reset completionHandled when starting new generation
  useEffect(() => {
    if (isGenerating) {
      setCompletionHandled(false);
    }
  }, [isGenerating]);

  // Close modal (but keep generation running)
  const handleClose = () => {
    setAIGeneratorModalOpen(false);
  };

  // Cancel and close
  const handleCancelAndClose = () => {
    cancel();
    resetForm();
    setAIGeneratorModalOpen(false);
  };

  // Reset form fields
  const resetForm = () => {
    setSeedKeyword('');
    setBusinessDescription('');
    setTargetPageCount(20);
    setCustomPageCount('');
    setDomain('');
    setLanguage('en');
    setCsvData(null);
    setCsvFileName('');
    setCsvError(null);
    setCompletionHandled(false);
  };

  // Handle CSV file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCSV(true);
    setCsvFileName(file.name);
    setCsvError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/parse-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to parse CSV');
      }

      const csvResult = await response.json();
      setCsvData(csvResult);

      // Auto-adjust target count based on imported keywords
      if (csvResult.count > 0) {
        const currentCount = targetPageCount === 'custom' ? parseInt(customPageCount) : targetPageCount;
        if (csvResult.count > currentCount) {
          const nextOption = AI_CONFIG.defaultPageCounts.find(opt => opt >= csvResult.count);
          if (nextOption) {
            setTargetPageCount(nextOption);
          } else {
            setTargetPageCount('custom');
            setCustomPageCount(csvResult.count.toString());
          }
        }
      }
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setCsvData(null);
    } finally {
      setIsParsingCSV(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle generation start
  const handleGenerate = () => {
    const pageCount = targetPageCount === 'custom'
      ? parseInt(customPageCount) || 20
      : targetPageCount;

    startGeneration({
      seedKeyword,
      businessDescription,
      targetPageCount: pageCount,
      importedKeywords: csvData?.keywords.map(k => k.term),
      domain: domain || undefined,
      language,
    });
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
  const isComplete = stage === 'complete' && result;

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

        {/* Completion State */}
        {isComplete ? (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                Generation Complete!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Created {result.nodes.length} pages with {result.edges.length} internal links
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to your project...</span>
            </div>
          </div>
        ) : isGenerating ? (
          /* Generation Progress */
          <div className="py-8 space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">{stageInfo.icon}</div>
              <p className={`font-medium ${stageInfo.color}`}>{stageInfo.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>

            {/* Progress bar with percentage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono font-medium text-amber-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Stage indicators */}
            <div className="flex justify-center gap-2 text-sm text-muted-foreground">
              <span className={stage === 'research' || stage === 'build' || stage === 'link' || stage === 'complete' ? 'text-green-500' : ''}>
                {stage === 'build' || stage === 'link' || stage === 'complete' ? <Check className="w-4 h-4 inline mr-1" /> : stage === 'research' ? <Loader2 className="w-4 h-4 inline mr-1 animate-spin" /> : '○'} Research
              </span>
              <span>→</span>
              <span className={stage === 'build' || stage === 'link' || stage === 'complete' ? 'text-green-500' : ''}>
                {stage === 'link' || stage === 'complete' ? <Check className="w-4 h-4 inline mr-1" /> : stage === 'build' ? <Loader2 className="w-4 h-4 inline mr-1 animate-spin" /> : '○'} Build
              </span>
              <span>→</span>
              <span className={stage === 'link' || stage === 'complete' ? 'text-green-500' : ''}>
                {stage === 'complete' ? <Check className="w-4 h-4 inline mr-1" /> : stage === 'link' ? <Loader2 className="w-4 h-4 inline mr-1 animate-spin" /> : '○'} Link
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleClose} className="gap-2">
                <Minimize2 className="w-4 h-4" />
                Minimize
              </Button>
              <Button variant="destructive" onClick={handleCancelAndClose} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              You can minimize this dialog and continue working. Generation will continue in the background.
            </p>
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
              {csvError && (
                <p className="text-xs text-destructive">{csvError}</p>
              )}
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
