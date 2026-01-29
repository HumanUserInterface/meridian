import { NextRequest } from 'next/server';
import { orchestrateCocoonGeneration } from '@/lib/ai/orchestrator';
import { CocoonGeneratorInput, StreamEvent, AI_CONFIG } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for large cocoons

/**
 * POST /api/ai/generate
 *
 * Streaming endpoint for AI cocoon generation.
 * Returns Server-Sent Events (SSE) for real-time progress updates.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.seedKeyword?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Seed keyword is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.businessDescription?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Business description is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key is configured
    if (!process.env.TOGETHER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Together.ai API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare input with defaults and validation
    const input: CocoonGeneratorInput = {
      seedKeyword: body.seedKeyword.trim(),
      businessDescription: body.businessDescription.trim(),
      targetPageCount: Math.min(
        Math.max(body.targetPageCount || 20, 1),
        AI_CONFIG.maxPages
      ),
      importedKeywords: Array.isArray(body.importedKeywords)
        ? body.importedKeywords.filter((k: unknown) => typeof k === 'string' && k.trim())
        : undefined,
      domain: body.domain?.trim() || undefined,
      language: body.language?.trim() || 'en',
    };

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: StreamEvent) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          await orchestrateCocoonGeneration(input, sendEvent);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Generation failed';
          sendEvent({
            event: 'error',
            data: { message: errorMessage },
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
