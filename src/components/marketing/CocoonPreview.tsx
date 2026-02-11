'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

// ── Node data matching the real Meridian app colors ────────────────────
interface PreviewNode {
  id: string
  label: string
  type: 'pillar' | 'cluster' | 'supporting' | 'blog'
  x: number
  y: number
  w: number
  h: number
}

interface PreviewEdge {
  from: string
  to: string
  dashed: boolean
  type: 'contextual' | 'navigation' | 'related'
}

const nodes: PreviewNode[] = [
  { id: 'pillar', label: 'Pillar Page', type: 'pillar', x: 340, y: 195, w: 152, h: 52 },
  { id: 'cluster-a', label: 'Cluster A', type: 'cluster', x: 150, y: 60, w: 120, h: 44 },
  { id: 'cluster-b', label: 'Cluster B', type: 'cluster', x: 510, y: 60, w: 120, h: 44 },
  { id: 'support-a', label: 'Support', type: 'supporting', x: 100, y: 330, w: 110, h: 42 },
  { id: 'support-b', label: 'Support', type: 'supporting', x: 570, y: 330, w: 110, h: 42 },
  { id: 'blog', label: 'Blog Post', type: 'blog', x: 340, y: 370, w: 110, h: 42 },
]

const edges: PreviewEdge[] = [
  { from: 'pillar', to: 'cluster-a', dashed: true, type: 'contextual' },
  { from: 'pillar', to: 'cluster-b', dashed: true, type: 'contextual' },
  { from: 'pillar', to: 'support-a', dashed: false, type: 'navigation' },
  { from: 'pillar', to: 'support-b', dashed: false, type: 'navigation' },
  { from: 'pillar', to: 'blog', dashed: false, type: 'related' },
  { from: 'cluster-a', to: 'support-a', dashed: false, type: 'navigation' },
  { from: 'cluster-b', to: 'support-b', dashed: false, type: 'navigation' },
]

// Colors matching the real CustomNode.tsx config
const typeStyles = {
  pillar: {
    fill: '#eff6ff',
    stroke: '#3b82f6',
    text: '#2563eb',
    dot: '#3b82f6',
    icon: 'M12 2L12 6M12 18L12 22M6 12L2 12M22 12L18 12M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07', // Target
  },
  cluster: {
    fill: '#ecfdf5',
    stroke: '#10b981',
    text: '#059669',
    dot: '#10b981',
    icon: 'M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12', // Layers
  },
  supporting: {
    fill: '#f9fafb',
    stroke: '#9ca3af',
    text: '#6b7280',
    dot: '#9ca3af',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', // FileText
  },
  blog: {
    fill: '#fff1f2',
    stroke: '#f43f5e',
    text: '#e11d48',
    dot: '#f43f5e',
    icon: 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8M18 18h-8M18 10h-8', // Newspaper
  },
} as const

function getNodeCenter(node: PreviewNode) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 }
}

// Edge color by type
const edgeColors = {
  contextual: '#3B82F6',
  navigation: '#10B981',
  related: '#8B5CF6',
}

export default function CocoonPreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative w-full aspect-[4/3]">
      {/* Outer frame with shadow */}
      <div className="absolute inset-0 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm shadow-2xl shadow-black/5 dark:shadow-black/30 overflow-hidden">
        {/* Subtle gradient background like the real app */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(143,193,218,0.08),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(58,154,133,0.06),transparent_50%)]" />

        {/* Dot grid like the real canvas */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.15]">
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" className="fill-foreground/40" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Main SVG visualization */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 780 440"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ── Edges ── */}
          {edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from)!
            const to = nodes.find((n) => n.id === edge.to)!
            const fc = getNodeCenter(from)
            const tc = getNodeCenter(to)

            // Curved path
            const mx = (fc.x + tc.x) / 2
            const my = (fc.y + tc.y) / 2
            const dx = tc.x - fc.x
            const dy = tc.y - fc.y
            const curveOffset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.15
            const cx1 = mx + (dy > 0 ? curveOffset : -curveOffset)
            const cy1 = my

            const pathD = `M ${fc.x} ${fc.y} Q ${cx1} ${cy1} ${tc.x} ${tc.y}`
            const pathLength = Math.sqrt(dx * dx + dy * dy) * 1.2

            return (
              <motion.path
                key={`edge-${i}`}
                d={pathD}
                fill="none"
                stroke={edgeColors[edge.type]}
                strokeWidth={edge.from === 'pillar' && edge.to.startsWith('cluster') ? 1.8 : 1.4}
                strokeDasharray={edge.dashed ? '6 4' : 'none'}
                strokeOpacity={0.35}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isVisible ? { pathLength: 1, opacity: 1 } : {}}
                transition={{
                  pathLength: { duration: 1.2, delay: 0.6 + i * 0.12, ease: 'easeInOut' },
                  opacity: { duration: 0.3, delay: 0.6 + i * 0.12 },
                }}
              />
            )
          })}

          {/* ── Ghost / background edges for depth ── */}
          {edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from)!
            const to = nodes.find((n) => n.id === edge.to)!
            const fc = getNodeCenter(from)
            const tc = getNodeCenter(to)

            return (
              <motion.line
                key={`ghost-${i}`}
                x1={fc.x}
                y1={fc.y}
                x2={tc.x}
                y2={tc.y}
                stroke={edgeColors[edge.type]}
                strokeWidth={0.5}
                strokeOpacity={0.08}
                initial={{ opacity: 0 }}
                animate={isVisible ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.5 }}
              />
            )
          })}

          {/* ── Nodes ── */}
          {nodes.map((node, i) => {
            const style = typeStyles[node.type]
            const isPillar = node.type === 'pillar'
            const delay = 0.15 + i * 0.1

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={
                  isVisible
                    ? { opacity: 1, y: 0, scale: 1 }
                    : {}
                }
                transition={{
                  duration: 0.6,
                  delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {/* Drop shadow */}
                <rect
                  x={node.x + 2}
                  y={node.y + 3}
                  width={node.w}
                  height={node.h}
                  rx={isPillar ? 10 : 8}
                  fill="black"
                  opacity={0.04}
                />

                {/* Node background */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={isPillar ? 10 : 8}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={isPillar ? 2 : 1.2}
                  className="dark:opacity-90"
                />

                {/* Pillar has a dot indicator */}
                {isPillar && (
                  <circle
                    cx={node.x + 20}
                    cy={node.y + node.h / 2}
                    r={4}
                    fill={style.dot}
                  />
                )}

                {/* Label text */}
                <text
                  x={isPillar ? node.x + node.w / 2 + 6 : node.x + node.w / 2}
                  y={node.y + node.h / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={style.text}
                  fontSize={isPillar ? 14 : 12}
                  fontWeight={isPillar ? 700 : 500}
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                >
                  {node.label}
                </text>

                {/* Handles (small circles on edges like React Flow) */}
                <circle cx={node.x + node.w / 2} cy={node.y} r={3} fill={style.stroke} opacity={0.5} stroke="white" strokeWidth={1.5} />
                <circle cx={node.x + node.w / 2} cy={node.y + node.h} r={3} fill={style.stroke} opacity={0.5} stroke="white" strokeWidth={1.5} />
              </motion.g>
            )
          })}
        </svg>

        {/* ── Corner badges ── */}
        <motion.div
          className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-md"
          initial={{ opacity: 0, x: -10 }}
          animate={isVisible ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.8 }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
            Health: 94/100
          </span>
        </motion.div>

        <motion.div
          className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md"
          initial={{ opacity: 0, x: 10 }}
          animate={isVisible ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.9 }}
        >
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 font-mono">
            6 Pages
          </span>
        </motion.div>

        {/* ── Edge type legend (bottom) ── */}
        <motion.div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4"
          initial={{ opacity: 0, y: 5 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 2.1 }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Contextual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#10B981" strokeWidth="1.5" /></svg>
            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Navigation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#8B5CF6" strokeWidth="1.5" /></svg>
            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Related</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
