'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring, animate } from 'motion/react'

// ── Exact colors from CustomNode.tsx & CustomEdge.tsx ──────────────────
const NODE_STYLES = {
  homepage: {
    border: '#6366f1', bg: '#eef2ff', titleBg: '#e0e7ff',
    text: '#4f46e5', label: 'HOMEPAGE',
    // Lucide Home icon simplified SVG path
    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  },
  pillar: {
    border: '#3b82f6', bg: '#eff6ff', titleBg: '#dbeafe',
    text: '#2563eb', label: 'PILLAR',
    icon: 'M12 2a10 10 0 100 20 10 10 0 000-20z M12 8a4 4 0 100 8 4 4 0 000-8z M12 2v4 M12 18v4 M2 12h4 M18 12h4',
  },
  cluster: {
    border: '#10b981', bg: '#ecfdf5', titleBg: '#d1fae5',
    text: '#059669', label: 'CLUSTER',
    icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  },
  supporting: {
    border: '#9ca3af', bg: '#f9fafb', titleBg: '#f3f4f6',
    text: '#6b7280', label: 'SUPPORTING',
    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  },
  blog: {
    border: '#f43f5e', bg: '#fff1f2', titleBg: '#ffe4e6',
    text: '#e11d48', label: 'BLOG',
    icon: 'M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2z M18 14h-8 M18 18h-8 M18 10h-8',
  },
} as const

type NodeType = keyof typeof NODE_STYLES

const EDGE_STYLES = {
  contextual: { color: '#3B82F6', label: 'CTX' },
  navigation: { color: '#10B981', label: 'NAV' },
  related: { color: '#8B5CF6', label: 'REL' },
} as const

type EdgeType = keyof typeof EDGE_STYLES

// Status badge colors
const STATUS_STYLES = {
  published: { bg: '#dcfce7', text: '#15803d', label: 'Published' },
  planned: { bg: '#f1f5f9', text: '#475569', label: 'Planned' },
  draft: { bg: '#fef9c3', text: '#a16207', label: 'Draft' },
} as const

type StatusType = keyof typeof STATUS_STYLES

// ── Node definitions — positions for a 900x540 viewBox ────────────────
interface PreviewNode {
  id: string
  type: NodeType
  keyword: string
  title: string
  slug?: string
  status: StatusType
  x: number
  y: number
  w: number
  h: number
}

interface PreviewEdge {
  from: string
  to: string
  type: EdgeType
  dashed: boolean
}

const NODES: PreviewNode[] = [
  { id: 'homepage', type: 'homepage', keyword: 'StratX', title: 'StratX', slug: '/', status: 'published', x: 325, y: 18, w: 230, h: 130 },
  { id: 'pillar', type: 'pillar', keyword: 'Business Strategy', title: 'Strategy Guide', slug: '/strategy', status: 'published', x: 600, y: 320, w: 240, h: 130 },
  { id: 'cluster', type: 'cluster', keyword: 'Growth Hacking', title: 'Growth Tactics', slug: '/growth', status: 'draft', x: 310, y: 210, w: 230, h: 130 },
  { id: 'support', type: 'supporting', keyword: 'SEO Basics', title: 'SEO 101', slug: '/seo-basics', status: 'planned', x: 40, y: 360, w: 220, h: 130 },
  { id: 'blog', type: 'blog', keyword: 'Link Building Tips', title: '10 Link Building Tips', slug: '/blog/link-building', status: 'published', x: 60, y: 140, w: 200, h: 130 },
]

const EDGES: PreviewEdge[] = [
  { from: 'homepage', to: 'cluster', type: 'contextual', dashed: true },
  { from: 'homepage', to: 'blog', type: 'navigation', dashed: false },
  { from: 'cluster', to: 'support', type: 'contextual', dashed: true },
  { from: 'cluster', to: 'pillar', type: 'related', dashed: false },
  { from: 'pillar', to: 'support', type: 'navigation', dashed: true },
]

function getAnchor(node: PreviewNode, side: 'top' | 'bottom') {
  return {
    x: node.x + node.w / 2,
    y: side === 'top' ? node.y : node.y + node.h,
  }
}

// ── Single SVG Node Card ───────────────────────────────────────────────
function NodeCard({
  node,
  delay,
  isVisible,
  onHover,
  isHovered,
}: {
  node: PreviewNode
  delay: number
  isVisible: boolean
  onHover: (id: string | null) => void
  isHovered: boolean
}) {
  const style = NODE_STYLES[node.type]
  const status = STATUS_STYLES[node.status]
  const headerH = 28
  const keywordH = node.slug ? 52 : 44
  const statusY = node.y + headerH + keywordH

  return (
    <motion.g
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'default' }}
    >
      {/* Shadow */}
      <rect x={node.x + 1} y={node.y + 2} width={node.w} height={node.h} rx={8} fill="black" opacity={isHovered ? 0.08 : 0.04} />

      {/* Card background */}
      <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={8} fill={style.bg} stroke={style.border} strokeWidth={2} />

      {/* Handle top */}
      <circle cx={node.x + node.w / 2} cy={node.y} r={4} fill={style.border} stroke="white" strokeWidth={2} />
      {/* Handle bottom */}
      <circle cx={node.x + node.w / 2} cy={node.y + node.h} r={4} fill={style.border} stroke="white" strokeWidth={2} />

      {/* Header bar */}
      <rect x={node.x} y={node.y} width={node.w} height={headerH} rx={8} fill={style.bg} />
      <rect x={node.x} y={node.y + headerH - 1} width={node.w} height={1} fill={style.border} opacity={0.3} />
      {/* Clip bottom corners of header */}
      <rect x={node.x + 1} y={node.y + 14} width={node.w - 2} height={14} fill={style.bg} />

      {/* Header icon (small square placeholder) */}
      <g transform={`translate(${node.x + 10}, ${node.y + 6}) scale(0.65)`}>
        <path d={style.icon} fill="none" stroke={style.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Header label */}
      <text x={node.x + 30} y={node.y + 18} fill={style.text} fontSize={10} fontWeight={700} fontFamily="var(--font-mono), monospace" letterSpacing="0.05em">
        {style.label}
      </text>

      {/* Three dots menu icon */}
      <circle cx={node.x + node.w - 14} cy={node.y + 10} r={1.2} fill={style.text} opacity={0.4} />
      <circle cx={node.x + node.w - 14} cy={node.y + 14} r={1.2} fill={style.text} opacity={0.4} />
      <circle cx={node.x + node.w - 14} cy={node.y + 18} r={1.2} fill={style.text} opacity={0.4} />

      {/* Keyword section background */}
      <rect x={node.x + 1} y={node.y + headerH} width={node.w - 2} height={keywordH} fill={style.titleBg} />
      <rect x={node.x} y={node.y + headerH + keywordH - 1} width={node.w} height={1} fill={style.border} opacity={0.2} />

      {/* Keyword text */}
      <text x={node.x + 12} y={node.y + headerH + 18} fill={style.text} fontSize={12.5} fontWeight={700} fontFamily="var(--font-sans), system-ui, sans-serif">
        {node.keyword}
      </text>

      {/* Page title */}
      <text x={node.x + 12} y={node.y + headerH + 32} fill="#6b7280" fontSize={10} fontFamily="var(--font-sans), system-ui, sans-serif">
        {node.title}
      </text>

      {/* Slug */}
      {node.slug && (
        <text x={node.x + 12} y={node.y + headerH + 44} fill="#9ca3af" fontSize={9} fontFamily="var(--font-mono), monospace">
          {node.slug}
        </text>
      )}

      {/* Status badge */}
      <rect x={node.x + 10} y={statusY + 8} width={node.status === 'published' ? 66 : 52} height={20} rx={4} fill={status.bg} />
      <text x={node.x + 16} y={statusY + 22} fill={status.text} fontSize={10} fontWeight={500} fontFamily="var(--font-sans), system-ui, sans-serif">
        {status.label}
      </text>
    </motion.g>
  )
}

// ── Edge with dashed line + label ──────────────────────────────────────
function EdgeLine({
  edge,
  index,
  isVisible,
  hoveredNode,
}: {
  edge: PreviewEdge
  index: number
  isVisible: boolean
  hoveredNode: string | null
}) {
  const fromNode = NODES.find((n) => n.id === edge.from)!
  const toNode = NODES.find((n) => n.id === edge.to)!

  // Determine which side to connect from/to
  const fromCenter = { x: fromNode.x + fromNode.w / 2, y: fromNode.y + fromNode.h / 2 }
  const toCenter = { x: toNode.x + toNode.w / 2, y: toNode.y + toNode.h / 2 }

  const fromBottom = getAnchor(fromNode, 'bottom')
  const fromTop = getAnchor(fromNode, 'top')
  const toTop = getAnchor(toNode, 'top')
  const toBottom = getAnchor(toNode, 'bottom')

  // Simple heuristic: connect from bottom to top if target is below, otherwise top to bottom
  let start = fromBottom
  let end = toTop
  if (toCenter.y < fromCenter.y) {
    start = fromTop
    end = toBottom
  }

  // Bezier control points
  const midY = (start.y + end.y) / 2
  const pathD = `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`

  // Label position
  const labelX = (start.x + end.x) / 2
  const labelY = midY

  const edgeStyle = EDGE_STYLES[edge.type]
  const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to
  const opacity = hoveredNode ? (isHighlighted ? 0.7 : 0.15) : 0.4

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.8 + index * 0.15 }}
    >
      <motion.path
        d={pathD}
        fill="none"
        stroke={edgeStyle.color}
        strokeWidth={2}
        strokeDasharray={edge.dashed ? '6 4' : undefined}
        initial={{ pathLength: 0 }}
        animate={isVisible ? { pathLength: 1, opacity } : {}}
        transition={{
          pathLength: { duration: 1, delay: 0.8 + index * 0.15, ease: 'easeInOut' },
          opacity: { duration: 0.3 },
        }}
      />

      {/* Edge label badge */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isVisible ? { opacity: hoveredNode ? (isHighlighted ? 1 : 0.3) : 1, scale: 1 } : {}}
        transition={{ duration: 0.3, delay: 1.4 + index * 0.1 }}
      >
        <rect x={labelX - 16} y={labelY - 9} width={32} height={18} rx={4} fill="white" stroke="#e5e7eb" strokeWidth={1} />
        <text x={labelX} y={labelY + 3} textAnchor="middle" fill={edgeStyle.color} fontSize={9} fontWeight={600} fontFamily="var(--font-sans), system-ui, sans-serif">
          {edgeStyle.label}
        </text>
      </motion.g>
    </motion.g>
  )
}

// ── Main component ─────────────────────────────────────────────────────
export default function CocoonPreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Parallax tilt on mouse move
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 150, damping: 20 })
  const springY = useSpring(rotateY, { stiffness: 150, damping: 20 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    rotateX.set(y * -6)
    rotateY.set(x * 6)
  }, [rotateX, rotateY])

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
    setHoveredNode(null)
  }, [rotateX, rotateY])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative w-full" style={{ perspective: 1200 }}>
      <motion.div
        className="relative w-full aspect-[5/3] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-2xl shadow-black/8 dark:shadow-black/30 overflow-hidden"
        style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Dot grid background like the real canvas */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.12] dark:opacity-[0.08]">
          <defs>
            <pattern id="preview-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" className="fill-foreground/50" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#preview-dots)" />
        </svg>

        {/* Main SVG */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 880 540"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Edges behind nodes */}
          {EDGES.map((edge, i) => (
            <EdgeLine key={`edge-${i}`} edge={edge} index={i} isVisible={isVisible} hoveredNode={hoveredNode} />
          ))}

          {/* Nodes */}
          {NODES.map((node, i) => (
            <NodeCard
              key={node.id}
              node={node}
              delay={0.1 + i * 0.12}
              isVisible={isVisible}
              onHover={setHoveredNode}
              isHovered={hoveredNode === node.id}
            />
          ))}
        </svg>

        {/* Subtle gradient overlay at edges for depth */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.03]" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card/60 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  )
}
