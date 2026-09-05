'use client';

import { useEffect, useState } from 'react';
import { Plus, MessageSquare, Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface Session {
  name: string;
  id: string;
  title: string;
  state: string;
  createTime: string;
}

interface SidebarProps {
  onSelectSession: (sessionId: string | null) => void;
  selectedSessionId: string | null;
}

export default function Sidebar({ onSelectSession, selectedSessionId }: SidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/jules/sessions?pageSize=20');
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.sessions || []).sort((a: Session, b: Session) =>
          new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
        );
        setSessions(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="w-full h-screen border-r bg-gray-50 flex flex-col transition-all duration-300 relative">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          Jules
        </h2>
      </div>

      <div className="p-2">
        <button
          onClick={() => onSelectSession(null)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> New Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center p-4">No sessions yet</p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 truncate transition-colors ${
                    selectedSessionId === session.id
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="truncate">{session.title || 'Untitled Session'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
