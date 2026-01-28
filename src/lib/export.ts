import { CocoonNode, CocoonEdge } from '@/stores/projectStore';
import { Project } from '@/types';

export interface ExportData {
  project: Project;
  nodes: CocoonNode[];
  edges: CocoonEdge[];
}

export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export function exportToCSV(nodes: CocoonNode[]): string {
  const headers = [
    'Title',
    'Node Type',
    'Primary Keyword',
    'Secondary Keywords',
    'Search Intent',
    'Status',
    'URL Slug',
    'Word Count Target',
    'Meta Title',
    'Meta Description',
    'Tags',
    'Notes',
  ];

  const rows = nodes.map((node) => [
    node.data.title,
    node.data.nodeType,
    node.data.primaryKeyword || '',
    node.data.secondaryKeywords.join('; '),
    node.data.searchIntent,
    node.data.status,
    node.data.slug || '',
    node.data.wordCountTarget?.toString() || '',
    node.data.metaTitle || '',
    node.data.metaDescription || '',
    node.data.tags.join('; '),
    node.data.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
}

export function exportToXMLSitemap(nodes: CocoonNode[], domain: string): string {
  const publishedNodes = nodes.filter((n) => n.data.status === 'published' && n.data.slug);

  const urls = publishedNodes
    .map((node) => {
      const loc = `${domain}${node.data.slug}`;
      const priority = node.data.nodeType === 'pillar' ? '1.0' : node.data.nodeType === 'cluster' ? '0.8' : '0.6';
      const changefreq = node.data.nodeType === 'pillar' ? 'weekly' : 'monthly';

      return `  <url>
    <loc>${loc}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function exportLinkMatrix(nodes: CocoonNode[], edges: CocoonEdge[]): string {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const headers = ['Source Page', 'Target Page', 'Link Type', 'Anchor Text', 'Position', 'Status'];

  const rows = edges.map((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    return [
      source?.data.title || 'Unknown',
      target?.data.title || 'Unknown',
      edge.data?.linkType || 'contextual',
      edge.data?.anchorText || '',
      edge.data?.position || '',
      edge.data?.isPlanned ? 'Planned' : 'Published',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
