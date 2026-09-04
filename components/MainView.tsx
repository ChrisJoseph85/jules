'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';

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
      const interval = setInterval(fetchSessionDetails, 5000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  useEffect(() => {
    activitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="flex-1 flex flex-col p-8 max-w-3xl mx-auto w-full">
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
    <div className="flex-1 flex flex-col h-screen max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold truncate">{sessionData?.title || 'Loading session...'}</h1>
          <p className="text-sm text-gray-500">State: {sessionData?.state || '...'}</p>
        </div>
        {sessionData?.state === 'AWAITING_PLAN_APPROVAL' && (
          <button
            onClick={handleApprovePlan}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700"
          >
            <CheckCircle2 size={18} /> Approve Plan
          </button>
        )}
        {sessionData?.state === 'AWAITING_USER_FEEDBACK' && (
          <button
            onClick={() => {
               // Send empty message to tell Jules to continue since we just need an unblock
               fetch(`/api/jules/sessions/${sessionId}:sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: "Please continue with the current plan." })
               }).then(() => fetchSessionDetails());
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
          >
            <CheckCircle2 size={18} /> Continue
          </button>
        )}
      </div>

      {/* Activities Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
        {activities.map((activity, idx) => (
          <div key={activity.name || idx} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-400 mb-2">{new Date(activity.createTime).toLocaleString()}</div>

            {/* Render different activity types here based on activity.* event types */}
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
                <div className="mt-1 text-sm bg-gray-100 p-3 rounded">
                  {activity.planGenerated.plan?.steps?.map((step: any, idx: number) => (
                    <div key={step.id || idx} className="mb-2">
                      <p className="font-medium">{step.index !== undefined ? step.index + 1 : idx + 1}. {step.title}</p>
                      {step.description && <p className="text-gray-600 ml-4 whitespace-pre-wrap">{step.description}</p>}
                    </div>
                  ))}
                  {!activity.planGenerated.plan?.steps && (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(activity.planGenerated, null, 2)}</pre>
                  )}
                </div>
              </div>
            )}

            {activity.progressUpdated && (activity.progressUpdated.title || activity.progressUpdated.description) && (
              <div>
                <span className="font-semibold text-orange-600">Progress:</span>
                <div className="mt-1 whitespace-pre-wrap text-sm bg-gray-100 p-3 rounded">
                  {activity.progressUpdated.title && <p className="font-medium">{activity.progressUpdated.title}</p>}
                  {activity.progressUpdated.description && <p className="mt-1 text-gray-600">{activity.progressUpdated.description}</p>}
                </div>
              </div>
            )}
             {/* Fallback for unhandled types or raw dump if needed temporarily */}
             {!activity.userMessaged && !activity.agentMessaged && !activity.planGenerated && !activity.progressUpdated && (
               <details>
                 <summary className="text-sm text-gray-500 cursor-pointer">Raw Activity Data</summary>
                 <pre className="text-xs mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded">{JSON.stringify(activity, null, 2)}</pre>
               </details>
             )}
          </div>
        ))}
        <div ref={activitiesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message to Jules..."
            className="flex-1 border rounded-md px-4 py-2"
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
  );
}
