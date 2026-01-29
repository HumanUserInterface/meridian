import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/parse-csv
 *
 * Parses uploaded CSV file to extract keywords.
 * Supports flexible column matching for common keyword formats.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have a header row and at least one data row' },
        { status: 400 }
      );
    }

    // Parse header
    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

    // Find keyword column (flexible matching)
    const keywordColumnIndex = findColumnIndex(header, [
      'keyword',
      'keywords',
      'term',
      'terms',
      'query',
      'queries',
      'search term',
      'search query',
      'keyphrase',
      'phrase',
    ]);

    if (keywordColumnIndex === -1) {
      return NextResponse.json(
        { error: 'Could not find a keyword column. Expected column names: keyword, term, query, phrase' },
        { status: 400 }
      );
    }

    // Find optional columns
    const volumeColumnIndex = findColumnIndex(header, ['volume', 'search volume', 'sv', 'searches']);
    const difficultyColumnIndex = findColumnIndex(header, ['difficulty', 'kd', 'keyword difficulty', 'competition']);
    const intentColumnIndex = findColumnIndex(header, ['intent', 'search intent', 'type']);

    // Parse data rows
    const keywords: Array<{
      term: string;
      volume?: number;
      difficulty?: number;
      intent?: string;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const keyword = values[keywordColumnIndex]?.trim();

      if (!keyword) continue;

      const item: {
        term: string;
        volume?: number;
        difficulty?: number;
        intent?: string;
      } = { term: keyword };

      if (volumeColumnIndex !== -1) {
        const volume = parseInt(values[volumeColumnIndex], 10);
        if (!isNaN(volume)) item.volume = volume;
      }

      if (difficultyColumnIndex !== -1) {
        const difficulty = parseInt(values[difficultyColumnIndex], 10);
        if (!isNaN(difficulty)) item.difficulty = difficulty;
      }

      if (intentColumnIndex !== -1) {
        const intent = values[intentColumnIndex]?.trim().toLowerCase();
        if (intent && ['informational', 'navigational', 'commercial', 'transactional'].includes(intent)) {
          item.intent = intent;
        }
      }

      keywords.push(item);
    }

    // Remove duplicates (case-insensitive)
    const seen = new Set<string>();
    const uniqueKeywords = keywords.filter(k => {
      const lower = k.term.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    return NextResponse.json({
      success: true,
      keywords: uniqueKeywords,
      count: uniqueKeywords.length,
      columns: {
        keyword: header[keywordColumnIndex],
        volume: volumeColumnIndex !== -1 ? header[volumeColumnIndex] : null,
        difficulty: difficultyColumnIndex !== -1 ? header[difficultyColumnIndex] : null,
        intent: intentColumnIndex !== -1 ? header[intentColumnIndex] : null,
      },
    });
  } catch (error) {
    console.error('CSV parsing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse CSV' },
      { status: 500 }
    );
  }
}

/**
 * Find column index by trying multiple possible names
 */
function findColumnIndex(header: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = header.indexOf(name);
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Parse a CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
