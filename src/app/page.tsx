'use client';

import { useUIStore } from '@/stores/uiStore';
import Header from '@/components/Header';
import Canvas from '@/components/canvas/Canvas';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import ExportModal from '@/components/modals/ExportModal';
import ImportModal from '@/components/modals/ImportModal';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function Home() {
  const { leftPanelOpen, rightPanelOpen, toggleLeftPanel, toggleRightPanel } = useUIStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '[') {
        toggleLeftPanel();
      } else if (e.key === ']') {
        toggleRightPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftPanel, toggleRightPanel]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out overflow-hidden',
            leftPanelOpen ? 'w-72' : 'w-0'
          )}
        >
          <LeftPanel />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>

        {/* Right Panel */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out overflow-hidden',
            rightPanelOpen ? 'w-80' : 'w-0'
          )}
        >
          <RightPanel />
        </div>
      </div>

      {/* Modals */}
      <ExportModal />
      <ImportModal />
    </div>
  );
}
