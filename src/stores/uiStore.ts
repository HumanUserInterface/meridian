import { create } from 'zustand';

interface UIState {
  // Panel states
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;

  // Selection states
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Modal states
  exportModalOpen: boolean;
  importModalOpen: boolean;
  settingsModalOpen: boolean;
  keyboardShortcutsModalOpen: boolean;
  aiGeneratorModalOpen: boolean;

  // View states
  showMinimap: boolean;
  showAnalysisPanel: boolean;

  // Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;

  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  clearSelection: () => void;

  setExportModalOpen: (open: boolean) => void;
  setImportModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setKeyboardShortcutsModalOpen: (open: boolean) => void;
  setAIGeneratorModalOpen: (open: boolean) => void;

  setShowMinimap: (show: boolean) => void;
  setShowAnalysisPanel: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial states
  leftPanelOpen: true,
  rightPanelOpen: true,
  selectedNodeId: null,
  selectedEdgeId: null,
  exportModalOpen: false,
  importModalOpen: false,
  settingsModalOpen: false,
  keyboardShortcutsModalOpen: false,
  aiGeneratorModalOpen: false,
  showMinimap: true,
  showAnalysisPanel: true,

  // Actions
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),

  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  setSelectedNodeId: (nodeId) =>
    set({ selectedNodeId: nodeId, selectedEdgeId: null }),

  setSelectedEdgeId: (edgeId) =>
    set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  clearSelection: () =>
    set({ selectedNodeId: null, selectedEdgeId: null }),

  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setImportModalOpen: (open) => set({ importModalOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
  setKeyboardShortcutsModalOpen: (open) => set({ keyboardShortcutsModalOpen: open }),
  setAIGeneratorModalOpen: (open) => set({ aiGeneratorModalOpen: open }),

  setShowMinimap: (show) => set({ showMinimap: show }),
  setShowAnalysisPanel: (show) => set({ showAnalysisPanel: show }),
}));
