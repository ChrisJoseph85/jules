'use client';

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MainView from '@/components/MainView';

export default function Home() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSessionCreated = (id: string) => {
    setSelectedSessionId(id);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 m-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md absolute z-10 left-0 top-0"
          title="Open Sidebar"
        >
          <PanelLeftOpen size={24} />
        </button>
      )}

      <PanelGroup direction="horizontal">
        {isSidebarOpen && (
          <>
            <Panel defaultSize={20} minSize={10} maxSize={40} className="relative">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-md absolute top-4 right-4 z-10"
                title="Close Sidebar"
              >
                <PanelLeftClose size={20} />
              </button>
              <Sidebar
                onSelectSession={setSelectedSessionId}
                selectedSessionId={selectedSessionId}
              />
            </Panel>
            <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-colors" />
          </>
        )}
        <Panel defaultSize={80} className="flex flex-col h-full overflow-hidden">
          <MainView
            sessionId={selectedSessionId}
            onSessionCreated={handleSessionCreated}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
