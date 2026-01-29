import { NodeType } from '@/types';
import { ResearchKeyword, GeneratedNode } from './types';

// ==========================================
// RADIAL LAYOUT ALGORITHM
// ==========================================

interface LayoutConfig {
  pillarRadius: number;
  clusterRadius: number;
  supportingRadius: number;
  outerRadius: number;
  nodeSpacing: number;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  pillarRadius: 0, // Center
  clusterRadius: 400, // Inner ring
  supportingRadius: 800, // Outer ring
  outerRadius: 1200, // Blog/products
  nodeSpacing: 200,
};

/**
 * Calculate radial positions for nodes in a semantic cocoon layout
 * - Pillar at center (0, 0)
 * - Clusters in inner ring, evenly distributed
 * - Supporting pages in outer ring, grouped by cluster
 * - Blog/products in outermost ring
 */
export function calculateRadialLayout(
  keywords: ResearchKeyword[],
  config: LayoutConfig = DEFAULT_LAYOUT
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Group keywords by type
  const pillar = keywords.find(k => k.suggestedNodeType === 'pillar');
  const clusters = keywords.filter(k => k.suggestedNodeType === 'cluster');
  const supporting = keywords.filter(k => k.suggestedNodeType === 'supporting');
  const blogs = keywords.filter(k => k.suggestedNodeType === 'blog');
  const products = keywords.filter(k => k.suggestedNodeType === 'product');
  const categories = keywords.filter(k => k.suggestedNodeType === 'category');

  // 1. Place pillar at center
  if (pillar) {
    positions.set(pillar.term, { x: 0, y: 0 });
  }

  // 2. Place clusters in inner ring
  const clusterPositions = new Map<string, { angle: number; x: number; y: number }>();
  clusters.forEach((cluster, i) => {
    const angle = (2 * Math.PI * i) / clusters.length - Math.PI / 2; // Start from top
    const x = Math.cos(angle) * config.clusterRadius;
    const y = Math.sin(angle) * config.clusterRadius;
    positions.set(cluster.term, { x, y });
    clusterPositions.set(cluster.cluster, { angle, x, y });
  });

  // 3. Place supporting pages in outer ring, grouped by cluster
  const supportingByCluster = groupByCluster(supporting);
  supportingByCluster.forEach((clusterKeywords, clusterName) => {
    const clusterPos = clusterPositions.get(clusterName);
    if (clusterPos) {
      // Spread around the cluster's angle
      const spreadAngle = Math.PI / 4; // 45 degrees spread
      placeNodesInArc(
        clusterKeywords,
        clusterPos.angle,
        spreadAngle,
        config.supportingRadius,
        positions
      );
    } else {
      // No cluster found, place in a default area
      placeNodesInGrid(clusterKeywords, config.supportingRadius, Math.PI, positions);
    }
  });

  // 4. Place blogs in outer ring (fill gaps)
  const blogsByCluster = groupByCluster(blogs);
  let blogAngleOffset = 0;
  blogsByCluster.forEach((clusterKeywords, clusterName) => {
    const clusterPos = clusterPositions.get(clusterName);
    if (clusterPos) {
      placeNodesInArc(
        clusterKeywords,
        clusterPos.angle + Math.PI / 8, // Slight offset from supporting
        Math.PI / 6,
        config.outerRadius,
        positions
      );
    } else {
      placeNodesInArc(
        clusterKeywords,
        blogAngleOffset,
        Math.PI / 4,
        config.outerRadius,
        positions
      );
      blogAngleOffset += Math.PI / 3;
    }
  });

  // 5. Place products and categories
  const commercialContent = [...products, ...categories];
  if (commercialContent.length > 0) {
    // Place on the right side of the cocoon
    placeNodesInGrid(
      commercialContent,
      config.outerRadius + 200,
      0, // Right side (angle = 0)
      positions
    );
  }

  return positions;
}

/**
 * Group keywords by their cluster name
 */
function groupByCluster(keywords: ResearchKeyword[]): Map<string, ResearchKeyword[]> {
  const grouped = new Map<string, ResearchKeyword[]>();

  keywords.forEach(keyword => {
    const existing = grouped.get(keyword.cluster) || [];
    existing.push(keyword);
    grouped.set(keyword.cluster, existing);
  });

  return grouped;
}

/**
 * Place nodes in an arc around a center angle
 */
function placeNodesInArc(
  keywords: ResearchKeyword[],
  centerAngle: number,
  spreadAngle: number,
  radius: number,
  positions: Map<string, { x: number; y: number }>
): void {
  const count = keywords.length;
  if (count === 0) return;

  if (count === 1) {
    const x = Math.cos(centerAngle) * radius;
    const y = Math.sin(centerAngle) * radius;
    positions.set(keywords[0].term, { x, y });
    return;
  }

  const startAngle = centerAngle - spreadAngle / 2;
  const angleStep = spreadAngle / (count - 1);

  keywords.forEach((keyword, i) => {
    const angle = startAngle + angleStep * i;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    positions.set(keyword.term, { x, y });
  });
}

/**
 * Place nodes in a grid pattern at a given position
 */
function placeNodesInGrid(
  keywords: ResearchKeyword[],
  radius: number,
  angle: number,
  positions: Map<string, { x: number; y: number }>
): void {
  const cols = Math.ceil(Math.sqrt(keywords.length));
  const spacing = 180;

  // Center point of the grid
  const centerX = Math.cos(angle) * radius;
  const centerY = Math.sin(angle) * radius;

  keywords.forEach((keyword, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = centerX + (col - cols / 2) * spacing;
    const y = centerY + row * spacing;
    positions.set(keyword.term, { x, y });
  });
}

/**
 * Get node dimensions based on type (for spacing calculations)
 */
export function getNodeDimensions(nodeType: NodeType): { width: number; height: number } {
  const dimensions: Record<NodeType, { width: number; height: number }> = {
    pillar: { width: 280, height: 180 },
    cluster: { width: 260, height: 160 },
    supporting: { width: 240, height: 140 },
    blog: { width: 240, height: 140 },
    product: { width: 220, height: 130 },
    category: { width: 240, height: 140 },
    homepage: { width: 280, height: 180 },
    navpage: { width: 200, height: 120 },
    external: { width: 180, height: 100 },
    orphan: { width: 240, height: 140 },
  };

  return dimensions[nodeType];
}

/**
 * Adjust positions to avoid overlapping
 */
export function adjustForOverlaps(
  positions: Map<string, { x: number; y: number }>,
  nodeTypes: Map<string, NodeType>
): Map<string, { x: number; y: number }> {
  const adjusted = new Map(positions);
  const minDistance = 200; // Minimum distance between node centers
  const iterations = 5;

  for (let iter = 0; iter < iterations; iter++) {
    const entries = Array.from(adjusted.entries());

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [termA, posA] = entries[i];
        const [termB, posB] = entries[j];

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance && distance > 0) {
          // Push nodes apart
          const pushFactor = (minDistance - distance) / 2;
          const angle = Math.atan2(dy, dx);

          adjusted.set(termA, {
            x: posA.x - Math.cos(angle) * pushFactor,
            y: posA.y - Math.sin(angle) * pushFactor,
          });
          adjusted.set(termB, {
            x: posB.x + Math.cos(angle) * pushFactor,
            y: posB.y + Math.sin(angle) * pushFactor,
          });
        }
      }
    }
  }

  return adjusted;
}
