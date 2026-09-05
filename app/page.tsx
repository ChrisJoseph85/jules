'use client';

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MainView from '@/components/MainView';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function Home() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSessionCreated = (id: string) => {
    setSelectedSessionId(id);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar
            onSelectSession={setSelectedSessionId}
            selectedSessionId={selectedSessionId}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors" />
        <Panel defaultSize={80}>
          <MainView
            sessionId={selectedSessionId}
            onSessionCreated={handleSessionCreated}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
