import { v4 as uuidv4 } from 'uuid';
import { CocoonNode } from '@/stores/projectStore';
import { CocoonNodeData, NodeType, SearchIntent, ContentStatus } from '@/types';

interface CSVRow {
  title?: string;
  Title?: string;
  nodeType?: string;
  'Node Type'?: string;
  primaryKeyword?: string;
  'Primary Keyword'?: string;
  secondaryKeywords?: string;
  'Secondary Keywords'?: string;
  searchIntent?: string;
  'Search Intent'?: string;
  status?: string;
  Status?: string;
  slug?: string;
  'URL Slug'?: string;
  wordCountTarget?: string;
  'Word Count Target'?: string;
  metaTitle?: string;
  'Meta Title'?: string;
  metaDescription?: string;
  'Meta Description'?: string;
  tags?: string;
  Tags?: string;
  notes?: string;
  Notes?: string;
}

const validNodeTypes: NodeType[] = ['pillar', 'cluster', 'supporting', 'external', 'orphan'];
const validIntents: SearchIntent[] = ['informational', 'navigational', 'commercial', 'transactional'];
const validStatuses: ContentStatus[] = ['planned', 'draft', 'review', 'published', 'needs-update'];

function normalizeNodeType(value: string | undefined): NodeType {
  if (!value) return 'supporting';
  const normalized = value.toLowerCase().trim();
  if (validNodeTypes.includes(normalized as NodeType)) {
    return normalized as NodeType;
  }
  return 'supporting';
}

function normalizeIntent(value: string | undefined): SearchIntent {
  if (!value) return 'informational';
  const normalized = value.toLowerCase().trim();
  if (validIntents.includes(normalized as SearchIntent)) {
    return normalized as SearchIntent;
  }
  return 'informational';
}

function normalizeStatus(value: string | undefined): ContentStatus {
  if (!value) return 'planned';
  const normalized = value.toLowerCase().trim().replace(/\s+/g, '-');
  if (validStatuses.includes(normalized as ContentStatus)) {
    return normalized as ContentStatus;
  }
  return 'planned';
}

function splitAndTrim(value: string | undefined, separator: string = ';'): string[] {
  if (!value) return [];
  return value
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function importFromCSV(csvData: CSVRow[]): CocoonNode[] {
  const nodes: CocoonNode[] = [];
  const gridSize = 300;
  const nodesPerRow = 4;

  csvData.forEach((row, index) => {
    const title = row.title || row.Title;
    if (!title) return;

    const rowIndex = Math.floor(index / nodesPerRow);
    const colIndex = index % nodesPerRow;

    const nodeData: CocoonNodeData = {
      title,
      nodeType: normalizeNodeType(row.nodeType || row['Node Type']),
      primaryKeyword: row.primaryKeyword || row['Primary Keyword'] || undefined,
      secondaryKeywords: splitAndTrim(row.secondaryKeywords || row['Secondary Keywords']),
      searchIntent: normalizeIntent(row.searchIntent || row['Search Intent']),
      status: normalizeStatus(row.status || row.Status),
      slug: row.slug || row['URL Slug'] || undefined,
      wordCountTarget: parseInt(row.wordCountTarget || row['Word Count Target'] || '') || undefined,
      metaTitle: row.metaTitle || row['Meta Title'] || undefined,
      metaDescription: row.metaDescription || row['Meta Description'] || undefined,
      tags: splitAndTrim(row.tags || row.Tags),
      notes: row.notes || row.Notes || undefined,
    };

    const node: CocoonNode = {
      id: uuidv4(),
      type: 'cocoonNode',
      position: {
        x: colIndex * gridSize + 100,
        y: rowIndex * gridSize + 100,
      },
      data: nodeData,
    };

    nodes.push(node);
  });

  return nodes;
}

export function parseCSV(csvString: string): CSVRow[] {
  const lines = csvString.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: CSVRow = {};

    headers.forEach((header, index) => {
      row[header as keyof CSVRow] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}
