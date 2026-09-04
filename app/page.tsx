'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MainView from '@/components/MainView';

export default function Home() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleSessionCreated = (id: string) => {
    setSelectedSessionId(id);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        onSelectSession={setSelectedSessionId}
        selectedSessionId={selectedSessionId}
      />
      <MainView
        sessionId={selectedSessionId}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}
