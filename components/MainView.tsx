'use client';

import { useState, useEffect } from 'react';
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
  const [autoCreatePr, setAutoCreatePr] = useState(false);
  const [creating, setCreating] = useState(false);

  // Active Session State
  const [sessionData, setSessionData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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
          requirePlanApproval: requireApproval,
          automationMode: autoCreatePr ? 'AUTO_CREATE_PR' : 'AUTOMATION_MODE_UNSPECIFIED'
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
      <div className="flex-1 flex flex-col p-8 w-full h-full overflow-y-auto">
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

          <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoCreatePr"
                checked={autoCreatePr}
                onChange={(e) => setAutoCreatePr(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoCreatePr" className="text-sm">Auto-Create PR</label>
            </div>
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

  const conversationActivities = activities.filter(a => a.userMessaged || a.agentMessaged || a.planGenerated);
  const progressActivities = activities.filter(a => a.progressUpdated || (!a.userMessaged && !a.agentMessaged && !a.planGenerated));

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-white flex justify-between items-center shrink-0">
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
      <div className="flex-1 overflow-hidden min-h-0">
        <PanelGroup direction="horizontal">
          {/* Conversation Panel */}
          <Panel defaultSize={60} minSize={30} className="flex flex-col h-full bg-gray-50 border-r">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {conversationActivities.map((activity, idx) => (
                <div key={activity.name || idx} className="bg-white border rounded-lg p-4 shadow-sm">
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
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t shrink-0">
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
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-colors" />

          {/* Progress Panel */}
          <Panel defaultSize={40} minSize={20} className="flex flex-col h-full bg-gray-50">
            <div className="p-3 border-b bg-gray-100 shrink-0">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">Progress & Logs</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {progressActivities.map((activity, idx) => (
                <div key={activity.name || idx} className="bg-white border rounded p-3 shadow-sm text-sm">
                  <div className="text-xs text-gray-400 mb-1">{new Date(activity.createTime).toLocaleString()}</div>

                  {activity.progressUpdated && (activity.progressUpdated.title || activity.progressUpdated.description) && (
                    <div>
                      <span className="font-semibold text-orange-600">Progress:</span>
                      <div className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded border">
                        {activity.progressUpdated.title && <p className="font-medium text-gray-800">{activity.progressUpdated.title}</p>}
                        {activity.progressUpdated.description && <p className="mt-1 text-gray-600 text-xs">{activity.progressUpdated.description}</p>}
                      </div>
                    </div>
                  )}

                  {!activity.userMessaged && !activity.agentMessaged && !activity.planGenerated && !activity.progressUpdated && (
                    <details>
                      <summary className="text-xs text-gray-500 cursor-pointer">Raw Activity Data</summary>
                      <pre className="text-[10px] mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(activity, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
