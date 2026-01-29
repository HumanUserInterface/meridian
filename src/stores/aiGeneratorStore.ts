import { create } from 'zustand';
import { CocoonGeneratorInput, CocoonGeneratorOutput, GenerationStage, AI_CONFIG } from '@/lib/ai/types';

interface AIGeneratorState {
  // Generation state
  isGenerating: boolean;
  stage: GenerationStage | null;
  progress: number; // 0-100
  message: string;
  result: CocoonGeneratorOutput | null;
  error: string | null;

  // Input (stored for retry/reference)
  input: CocoonGeneratorInput | null;

  // Abort controller reference
  abortController: AbortController | null;

  // Actions
  startGeneration: (input: CocoonGeneratorInput) => void;
  updateProgress: (stage: GenerationStage, progress: number, message: string) => void;
  setResult: (result: CocoonGeneratorOutput) => void;
  setError: (error: string) => void;
  cancel: () => void;
  reset: () => void;
}

export const useAIGeneratorStore = create<AIGeneratorState>((set, get) => ({
  isGenerating: false,
  stage: null,
  progress: 0,
  message: '',
  result: null,
  error: null,
  input: null,
  abortController: null,

  startGeneration: (input) => {
    // Cancel any existing generation
    const existing = get().abortController;
    if (existing) {
      existing.abort();
    }

    const abortController = new AbortController();

    set({
      isGenerating: true,
      stage: 'research',
      progress: 0,
      message: 'Starting generation...',
      result: null,
      error: null,
      input,
      abortController,
    });

    // Start the actual generation
    generateCocoon(input, abortController.signal);
  },

  updateProgress: (stage, progress, message) => {
    set({ stage, progress, message });
  },

  setResult: (result) => {
    set({
      isGenerating: false,
      stage: 'complete',
      progress: 100,
      message: 'Generation complete!',
      result,
      abortController: null,
    });
  },

  setError: (error) => {
    set({
      isGenerating: false,
      error,
      abortController: null,
    });
  },

  cancel: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      isGenerating: false,
      stage: null,
      progress: 0,
      message: 'Generation cancelled',
      abortController: null,
    });
  },

  reset: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      isGenerating: false,
      stage: null,
      progress: 0,
      message: '',
      result: null,
      error: null,
      input: null,
      abortController: null,
    });
  },
}));

/**
 * Run the cocoon generation with SSE streaming
 */
async function generateCocoon(input: CocoonGeneratorInput, signal: AbortSignal) {
  const store = useAIGeneratorStore.getState();

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));

            if (event.event === 'progress') {
              // Calculate overall progress percentage
              const stageWeights = { research: 0.3, build: 0.5, link: 0.2 };
              const stageOffsets = { research: 0, build: 30, link: 80 };
              const stage = event.data.stage as keyof typeof stageWeights;

              let overallProgress = 0;
              if (stage in stageWeights) {
                overallProgress = stageOffsets[stage] + (event.data.progress * stageWeights[stage] * 100);
              }

              useAIGeneratorStore.getState().updateProgress(
                event.data.stage,
                Math.round(overallProgress),
                event.data.message
              );
            } else if (event.event === 'complete') {
              useAIGeneratorStore.getState().setResult(event.data);
            } else if (event.event === 'error') {
              throw new Error(event.data.message);
            }
          } catch (parseError) {
            if (!(parseError instanceof SyntaxError)) {
              throw parseError;
            }
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return; // Cancelled, already handled
    }
    useAIGeneratorStore.getState().setError(
      error instanceof Error ? error.message : 'Generation failed'
    );
  }
}
