'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface Source {
  name: string;
  id: string;
  githubRepo?: {
    owner: string;
    repo: string;
    branches?: { displayName: string }[];
  };
}

interface MainViewProps {
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
}

export default function MainView({ sessionId, onSessionCreated }: MainViewProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  // New Session State
  const [prompt, setPrompt] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [startingBranch, setStartingBranch] = useState('main');
  const [requireApproval, setRequireApproval] = useState(false);
  const [creating, setCreating] = useState(false);

  // Active Session State
  const [sessionData, setSessionData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const activitiesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) {
      fetchSources();
    } else {
      fetchSessionDetails();
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      const interval = setInterval(() => {
        // Only poll if the session is active and not finished
        if (sessionData && (sessionData.state === 'COMPLETED' || sessionData.state === 'FAILED')) {
            return;
        }
        fetchSessionDetails();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [sessionId, sessionData?.state]);

  // Auto-scroll logic: only scroll if already at bottom or slightly above
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    if (activitiesEndRef.current) {
        // Stash scroll state on the ref element as a data attribute to avoid extra state renders
        activitiesEndRef.current.dataset.atBottom = String(isAtBottom);
    }
  };

  useEffect(() => {
    const isAtBottom = activitiesEndRef.current?.dataset.atBottom !== 'false';
    if (isAtBottom) {
      activitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activities]);

  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const res = await fetch('/api/jules/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
        if (data.sources?.length > 0) {
          setSelectedSource(data.sources[0].name);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSources(false);
    }
  };

  const fetchSessionDetails = async () => {
    if (!sessionId) return;
    try {
      const [sessionRes, activitiesRes] = await Promise.all([
        fetch(`/api/jules/sessions/${sessionId}`),
        fetch(`/api/jules/sessions/${sessionId}/activities?pageSize=50`)
      ]);

      if (sessionRes.ok) {
        setSessionData(await sessionRes.json());
      }
      if (activitiesRes.ok) {
        const actData = await activitiesRes.json();
        setActivities((actData.activities || []).reverse());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !selectedSource) return;
    setCreating(true);
    try {
      const res = await fetch('/api/jules/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: prompt.substring(0, 50),
          sourceContext: {
            source: selectedSource,
            githubRepoContext: { startingBranch }
          },
          requirePlanApproval: requireApproval
        })
      });
      if (res.ok) {
        const data = await res.json();
        onSessionCreated(data.id || data.name.split('/').pop());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !sessionId) return;
    setSendingMessage(true);
    try {
      await fetch(`/api/jules/sessions/${sessionId}:sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message })
      });
      setMessage('');
      fetchSessionDetails();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!sessionId) return;
    try {
      await fetch(`/api/jules/sessions/${sessionId}:approvePlan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      fetchSessionDetails();
    } catch (e) {
      console.error(e);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col p-8 w-full">
        <h1 className="text-3xl font-bold mb-8">Start a New Session</h1>
        <form onSubmit={handleCreateSession} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full border rounded-md p-3 min-h-[120px] resize-y"
              placeholder="What would you like Jules to do?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Source (Repository)</label>
            {loadingSources ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="animate-spin w-4 h-4" /> Loading sources...
              </div>
            ) : (
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full border rounded-md p-2"
                required
              >
                {sources.map(s => (
                  <option key={s.name} value={s.name}>
                    {s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Starting Branch</label>
            <input
              type="text"
              value={startingBranch}
              onChange={(e) => setStartingBranch(e.target.value)}
              className="w-full border rounded-md p-2"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requireApproval"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="requireApproval" className="text-sm">Require Plan Approval</label>
          </div>

          <button
            type="submit"
            disabled={creating || !prompt || !selectedSource}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {creating ? <><Loader2 className="animate-spin" size={20} /> Creating...</> : 'Create Session'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen w-full">
      {/* Header */}
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold truncate">{sessionData?.title || 'Loading session...'}</h1>
          <p className="text-sm text-gray-500">State: {sessionData?.state || '...'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSessionDetails}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-300"
          >
            Reload
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 p-4 overflow-hidden bg-gray-50">
      <PanelGroup direction="horizontal">

        {/* Left Column: Chat and Plan */}
        <Panel defaultSize={60} minSize={30}>
        <div className="flex flex-col h-full bg-white border rounded-lg overflow-hidden shadow-sm mr-2">
          <div className="flex-1 overflow-y-auto p-4 space-y-6" onScroll={handleScroll}>
            {sessionData?.state === 'AWAITING_PLAN_APPROVAL' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex justify-between items-center">
                <span className="text-sm text-blue-800">A plan is waiting for your approval.</span>
                <button
                  onClick={handleApprovePlan}
                  className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 text-sm"
                >
                  <CheckCircle2 size={16} /> Approve Plan
                </button>
              </div>
            )}

            {activities
              .filter(a => a.userMessaged || a.agentMessaged || a.planGenerated)
              .map((activity, idx) => (
              <div key={activity.name || idx} className="bg-gray-50 border rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-2">{new Date(activity.createTime).toLocaleString()}</div>

                {activity.userMessaged && (
                  <div>
                    <span className="font-semibold text-blue-600">User:</span>
                    <p className="mt-1 whitespace-pre-wrap">{activity.userMessaged.message}</p>
                  </div>
                )}

                {activity.agentMessaged && (
                  <div>
                    <span className="font-semibold text-green-600">Jules:</span>
                    <div className="mt-1 whitespace-pre-wrap font-mono text-sm bg-gray-100 p-3 rounded overflow-x-auto">
                      {activity.agentMessaged.message}
                    </div>
                  </div>
                )}

                {activity.planGenerated && (
                  <div>
                    <span className="font-semibold text-purple-600">Plan Generated:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-sm bg-gray-100 p-3 rounded">
                      {JSON.stringify(activity.planGenerated, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            <div ref={activitiesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-50 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message to Jules..."
                className="flex-1 border rounded-md px-4 py-2 bg-white"
                disabled={sendingMessage || sessionData?.state === 'COMPLETED' || sessionData?.state === 'FAILED'}
              />
              <button
                type="submit"
                disabled={!message || sendingMessage || sessionData?.state === 'COMPLETED' || sessionData?.state === 'FAILED'}
                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {sendingMessage ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </form>
          </div>
        </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors rounded" />

        {/* Right Column: Progress Updates */}
        <Panel defaultSize={40} minSize={20}>
        <div className="flex flex-col h-full bg-white border rounded-lg overflow-hidden shadow-sm ml-2">
          <div className="bg-gray-100 border-b p-3 font-semibold text-gray-700 text-sm">
            Progress Feed
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activities
              .filter(a => a.progressUpdated || (!a.userMessaged && !a.agentMessaged && !a.planGenerated))
              .map((activity, idx) => (
              <div key={activity.name || idx} className="bg-gray-50 border rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-2">{new Date(activity.createTime).toLocaleString()}</div>

                {activity.progressUpdated && (
                  <div>
                    <span className="font-semibold text-orange-600 text-sm">Progress:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(activity.progressUpdated, null, 2)}
                    </pre>
                  </div>
                )}

                {!activity.userMessaged && !activity.agentMessaged && !activity.planGenerated && !activity.progressUpdated && (
                  <details>
                    <summary className="text-sm text-gray-500 cursor-pointer">Raw Activity Data</summary>
                    <pre className="text-xs mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded">{JSON.stringify(activity, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
        </Panel>
      </PanelGroup>
      </div>
    </div>
  );
}