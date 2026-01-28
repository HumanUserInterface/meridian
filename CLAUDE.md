# CocoonFlow - Claude Code Context

## Project Overview
CocoonFlow is a visual semantic cocoon and topical authority planning tool for SEO professionals. It's an alternative to generic mind-mapping tools, focused entirely on creating, visualizing, and optimizing semantic cocoon structures (content silos/topical clusters) for websites.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Canvas**: React Flow 12 (@xyflow/react)
- **State**: Zustand with localStorage persistence
- **Icons**: Lucide React

## Project Structure
```
src/
├── app/                    # Next.js app router pages
├── components/
│   ├── canvas/            # React Flow components
│   │   ├── Canvas.tsx     # Main canvas with ReactFlow
│   │   ├── CustomNode.tsx # SEO node component
│   │   └── CustomEdge.tsx # Link edge component
│   ├── panels/            # Side panels
│   │   ├── LeftPanel.tsx  # Node list & drag-to-add
│   │   ├── RightPanel.tsx # Properties & analysis tabs
│   │   ├── NodeProperties.tsx
│   │   ├── EdgeProperties.tsx
│   │   └── AnalysisPanel.tsx
│   ├── modals/            # Dialog modals
│   └── ui/                # shadcn/ui components
├── stores/
│   ├── projectStore.ts    # Nodes, edges, project data (persisted)
│   └── uiStore.ts         # UI state (panels, selection, modals)
├── lib/
│   ├── analysis.ts        # Cocoon health scoring algorithms
│   ├── export.ts          # Export to CSV, JSON, XML sitemap
│   ├── import.ts          # CSV import parsing
│   └── utils.ts           # Tailwind merge utility
└── types/
    └── index.ts           # All TypeScript interfaces
```

## Key Concepts

### Node Types
- **Pillar**: Main topic page (blue) - center of the cocoon
- **Cluster**: Subtopic pages (green) - link to/from pillar
- **Supporting**: Long-tail content (gray) - provides depth
- **External**: External link references (purple)
- **Orphan**: Pages without incoming links (red border) - auto-detected

### Edge/Link Types
- **Contextual**: In-content link (blue)
- **Navigation**: Menu/nav link (green)
- **Related**: "Related posts" section (purple)
- **Breadcrumb**: Breadcrumb link (amber)
- **CTA**: Call-to-action link (red)

### Content Status Flow
`planned` → `draft` → `review` → `published` → `needs-update`

## State Management

### projectStore (Zustand + persist)
- `project`: Project metadata, settings, keywords
- `nodes`: React Flow nodes with CocoonNodeData
- `edges`: React Flow edges with CocoonEdgeData
- Actions: addNode, updateNode, deleteNode, onConnect, etc.

### uiStore (Zustand)
- Panel visibility states
- Selected node/edge IDs
- Modal open states

## Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
```

## Implementation Notes

### React Flow Integration
- Custom node/edge types registered in Canvas.tsx
- Nodes use `type: 'cocoonNode'`, edges use `type: 'cocoonEdge'`
- Data interfaces extend `Record<string, unknown>` for RF compatibility

### LocalStorage Persistence
- Project auto-saves via Zustand persist middleware
- Key: `cocoonflow-project`

### Analysis Algorithm
- Health score (0-100) based on:
  - Pillar page presence (-30 if missing)
  - Orphan pages (-5 per orphan, max -20)
  - Link depth > 3 levels (-10)
  - Missing keywords (-3 per node, max -15)

## Future Development (Per Spec)

### Phase 2 - SEO Enhancement
- [ ] Keyword management with volume/difficulty
- [ ] URL structure planner with depth warnings
- [ ] XML sitemap export with priorities
- [ ] Keyword cannibalization detection

### Phase 3 - Collaboration
- [ ] Supabase integration for cloud storage
- [ ] Shareable public/private links
- [ ] Comments on nodes
- [ ] Version history

### Phase 4 - AI Features
- [ ] AI subtopic suggestions from pillar keyword
- [ ] Auto-generate meta descriptions
- [ ] Smart layout optimization
- [ ] Content gap analysis

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `[` | Toggle left panel |
| `]` | Toggle right panel |
| `Delete/Backspace` | Delete selected node/edge |
| `Cmd/Ctrl + click` | Multi-select |
