# Meridian - Claude Code Context

## Project Overview
Meridian is a visual semantic cocoon and topical authority planning tool for SEO professionals. It's an alternative to generic mind-mapping tools, focused entirely on creating, visualizing, and optimizing semantic cocoon structures (content silos/topical clusters) for websites.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Canvas**: React Flow 12 (@xyflow/react)
- **State**: Zustand with localStorage persistence
- **Icons**: Lucide React
- **Auth**: Supabase

## Branding

**See `BRANDING.md` for complete brand guidelines.**

### Quick Reference

| Color | Hex | CSS Variable | Tailwind Class |
|-------|-----|--------------|----------------|
| Cloud | `#E8F1F5` | `--brand-cloud` | `bg-brand-cloud` |
| Deep Ocean | `#1A4A6B` | `--brand-deep-ocean` | `bg-brand-deep-ocean` / `bg-primary` |
| Seafoam | `#3A9A85` | `--brand-seafoam` | `bg-brand-seafoam` |
| Steel Blue | `#5B8DAB` | `--brand-steel-blue` | `bg-brand-steel-blue` |
| Sky | `#8FC1DA` | `--brand-sky` | `bg-brand-sky` |
| Midnight | `#1A1A1A` | `--brand-midnight` | `bg-brand-midnight` |

### Fonts
- **Body**: Zalando Sans (Google Font)
- **Display/Mono**: Space Mono (Google Font)

### Logo Assets
- `/public/logo.svg` - Full logo with text (light mode)
- `/public/logo-dark.svg` - Full logo with text (dark mode)
- `/public/logo-icon.svg` - Icon only
- `/src/app/icon.png` - Favicon

## Project Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with ThemeProvider
│   ├── page.tsx           # Dashboard/Projects page
│   ├── icon.png           # Favicon
│   ├── globals.css        # Global styles & theme variables
│   ├── api/               # API routes (AI, parsing)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Projects dashboard
│   ├── project/[id]/      # Project editor page
│   ├── settings/          # User settings
│   └── workspace/         # Workspace settings
├── components/
│   ├── Header.tsx         # Editor header with logo
│   ├── ThemeProvider.tsx  # Theme context (light/dark/system)
│   ├── ThemeToggle.tsx    # Theme selector dropdown
│   ├── canvas/            # React Flow components
│   │   ├── Canvas.tsx     # Main canvas with ReactFlow
│   │   ├── CustomNode.tsx # SEO node component
│   │   ├── CustomEdge.tsx # Link edge component
│   │   └── AnimatedBackground.tsx
│   ├── dashboard/         # Dashboard components
│   │   ├── Sidebar.tsx    # Sidebar with logo
│   │   └── ProjectCard.tsx
│   ├── panels/            # Side panels
│   │   ├── LeftPanel.tsx  # Node types with color config
│   │   ├── RightPanel.tsx # Properties & analysis tabs
│   │   ├── NodeProperties.tsx
│   │   ├── EdgeProperties.tsx
│   │   └── AnalysisPanel.tsx
│   ├── modals/            # Dialog modals
│   │   ├── AIGeneratorModal.tsx
│   │   ├── ExportModal.tsx
│   │   └── ImportModal.tsx
│   └── ui/                # shadcn/ui components
├── stores/
│   ├── projectStore.ts    # Nodes, edges, project data (persisted)
│   ├── projectsStore.ts   # Projects list state
│   ├── authStore.ts       # Authentication state
│   ├── uiStore.ts         # UI state (panels, modals)
│   └── aiGeneratorStore.ts # AI generation state
├── lib/
│   ├── analysis.ts        # Cocoon health scoring algorithms
│   ├── export.ts          # Export to CSV, JSON, XML sitemap
│   ├── import.ts          # CSV import parsing
│   ├── utils.ts           # Tailwind merge utility
│   ├── supabase/          # Supabase client/server utilities
│   └── ai/                # AI integration
│       ├── together.ts    # Together AI API
│       ├── orchestrator.ts # AI workflow orchestration
│       ├── agents/        # AI agents (builder, linker, research)
│       ├── autoLayout.ts  # Auto-layout algorithm
│       └── prompts.ts     # AI prompts
├── types/
│   └── index.ts           # All TypeScript interfaces
├── hooks/                 # Custom React hooks
└── middleware.ts          # Next.js middleware
```

## Key Concepts

### Node Types
| Type | Color | Icon | Description |
|------|-------|------|-------------|
| **Homepage** | Indigo | Home | Main site entry point |
| **Pillar** | Blue | Target | Main topic page - center of the cocoon |
| **Category** | Cyan | FolderOpen | Category/collection pages |
| **Cluster** | Emerald | Layers | Subtopic pages - link to/from pillar |
| **Product** | Amber | Package | Product pages |
| **Blog** | Rose | Newspaper | Blog articles |
| **Supporting** | Gray | FileText | Long-tail content - provides depth |
| **NavPage** | Slate | Navigation | Non-SEO pages (contact, about, team) |
| **External** | Purple | ExternalLink | External link references |
| **Orphan** | Red | AlertTriangle | Pages without incoming links - auto-detected |

### Edge/Link Types
| Label | Type | Color | Description |
|-------|------|-------|-------------|
| CTX | Contextual | Blue | In-content link |
| NAV | Navigation | Green | Menu/nav link |
| REL | Related | Purple | "Related posts" section |
| BC | Breadcrumb | Amber | Breadcrumb link |
| CTA | Call to Action | Red | Call-to-action link |

### Special Node Behaviors
- **NavPage** nodes are excluded from orphan detection and keyword warnings (no SEO interest)
- **NavPage** nodes are excluded from XML sitemap exports
- **Homepage** gets highest sitemap priority (1.0) and daily changefreq

### Content Status Flow
`planned` → `draft` → `review` → `published` → `needs-update`

## State Management

### projectStore (Zustand + persist)
- `project`: Project metadata, settings, keywords
- `nodes`: React Flow nodes with CocoonNodeData
- `edges`: React Flow edges with CocoonEdgeData
- Actions: addNode, updateNode, deleteNode, onConnect, etc.

### projectsStore (Zustand + persist)
- `projects`: List of project metadata
- Actions: createProject, updateProjectMeta, deleteProject

### authStore (Zustand)
- `user`: Current authenticated user
- Actions: initialize, signIn, signOut

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

### Node Card Design
- Header: Node type icon + label + actions menu
- Title section: Colored background matching node type, shows page title and /slug
- Content: Primary keyword and clickable status badge (dropdown to change status)

### Edge Interaction
- Click on edge label (CTX, NAV, etc.) to open dropdown and change link type
- Select edge and press Delete/Backspace to remove
- Dashed lines indicate planned links, solid lines indicate published

### URL Slug Auto-formatting
- Automatically converts spaces to hyphens
- Converts to lowercase and removes accents
- Removes special characters

### LocalStorage Persistence
- Project auto-saves via Zustand persist middleware
- Theme preference key: `meridian-theme`

### Analysis Algorithm
- Health score (0-100) based on:
  - Pillar page presence (-30 if missing)
  - Orphan pages (-5 per orphan, max -20)
  - Link depth > 3 levels (-10)
  - Missing keywords (-3 per node, max -15)

### AI Features
- AI Generate button uses Seafoam color (`bg-brand-seafoam`)
- Uses Together AI for cocoon generation
- Auto-layout algorithm for organizing nodes

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `[` | Toggle left panel |
| `]` | Toggle right panel |
| `Delete/Backspace` | Delete selected node/edge |
| `Cmd/Ctrl + click` | Multi-select |

## Theme System
- Uses OkLCH color space for accessibility
- Three modes: Light, Dark, System
- Theme stored in localStorage (`meridian-theme`)
- Dark mode applies `.dark` class to `documentElement`
