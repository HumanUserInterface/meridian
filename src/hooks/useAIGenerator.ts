'use client';

import { useState, useCallback, useRef } from 'react';
import {
  CocoonGeneratorInput,
  CocoonGeneratorOutput,
  StreamEvent,
  GenerationStage,
  AI_CONFIG,
} from '@/lib/ai/types';

export interface AIGeneratorState {
  isGenerating: boolean;
  stage: GenerationStage | null;
  progress: number;
  message: string;
  result: CocoonGeneratorOutput | null;
  error: string | null;
}

export interface UseAIGeneratorReturn extends AIGeneratorState {
  generate: (input: CocoonGeneratorInput) => Promise<CocoonGeneratorOutput | null>;
  cancel: () => void;
  reset: () => void;
  parseCSV: (file: File) => Promise<ParsedCSV | null>;
}

export interface ParsedCSV {
  keywords: Array<{
    term: string;
    volume?: number;
    difficulty?: number;
    intent?: string;
  }>;
  count: number;
  columns: {
    keyword: string;
    volume: string | null;
    difficulty: string | null;
    intent: string | null;
  };
}

const initialState: AIGeneratorState = {
  isGenerating: false,
  stage: null,
  progress: 0,
  message: '',
  result: null,
  error: null,
};

/**
 * React hook for AI cocoon generation
 * Handles streaming SSE responses and state management
 */
export function useAIGenerator(): UseAIGeneratorReturn {
  const [state, setState] = useState<AIGeneratorState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start cocoon generation
   */
  const generate = useCallback(async (input: CocoonGeneratorInput): Promise<CocoonGeneratorOutput | null> => {
    // Validate input
    if (!input.seedKeyword?.trim()) {
      setState(prev => ({ ...prev, error: 'Seed keyword is required' }));
      return null;
    }
    if (!input.businessDescription?.trim()) {
      setState(prev => ({ ...prev, error: 'Business description is required' }));
      return null;
    }
    if (input.targetPageCount < 1 || input.targetPageCount > AI_CONFIG.maxPages) {
      setState(prev => ({ ...prev, error: `Page count must be between 1 and ${AI_CONFIG.maxPages}` }));
      return null;
    }

    // Reset state and create abort controller
    abortControllerRef.current = new AbortController();
    setState({
      isGenerating: true,
      stage: 'research',
      progress: 0,
      message: 'Starting generation...',
      result: null,
      error: null,
    });

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: CocoonGeneratorOutput | null = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));

              if (event.event === 'progress') {
                setState(prev => ({
                  ...prev,
                  stage: event.data.stage,
                  progress: event.data.progress,
                  message: event.data.message,
                }));
              } else if (event.event === 'complete') {
                finalResult = event.data;
                setState(prev => ({
                  ...prev,
                  isGenerating: false,
                  stage: 'complete',
                  progress: 1,
                  message: 'Generation complete!',
                  result: event.data,
                }));
              } else if (event.event === 'error') {
                throw new Error(event.data.message);
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete chunks
              if (!(parseError instanceof SyntaxError)) {
                throw parseError;
              }
            }
          }
        }
      }

      return finalResult;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          stage: null,
          progress: 0,
          message: 'Generation cancelled',
          error: null,
        }));
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
      return null;
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancel();
    setState(initialState);
  }, [cancel]);

  /**
   * Parse CSV file for keyword import
   */
  const parseCSV = useCallback(async (file: File): Promise<ParsedCSV | null> => {
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

      const data = await response.json();
      return data as ParsedCSV;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, []);

  return {
    ...state,
    generate,
    cancel,
    reset,
    parseCSV,
  };
}
