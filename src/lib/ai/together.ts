import Together from 'together-ai';
import { AI_CONFIG } from './types';

// Initialize Together.ai client
const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Generate a JSON completion from Together.ai
 */
export async function generateCompletion<T>(
  prompt: string,
  options: CompletionOptions = {}
): Promise<T> {
  const {
    model = AI_CONFIG.models.reasoning,
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  const response = await together.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert SEO specialist and content strategist. Always respond with valid JSON only, no additional text or markdown formatting.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response content from Together.ai');
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    // Try to extract JSON from the response if it contains extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error(`Failed to parse JSON response: ${content.slice(0, 200)}...`);
  }
}

/**
 * Generate a simple text completion (for tasks that don't need JSON)
 */
export async function generateTextCompletion(
  prompt: string,
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = AI_CONFIG.models.simple,
    temperature = 0.7,
    maxTokens = 1024,
  } = options;

  const response = await together.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Retry wrapper for API calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = AI_CONFIG.retryAttempts,
  delay: number = AI_CONFIG.retryDelay
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Process items in batches with concurrency control
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = AI_CONFIG.batchSize
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}
