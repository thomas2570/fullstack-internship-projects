import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Webhook, Plus, Send, Trash2, Key, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function WebhooksView() {
  const { currentWorkspace } = useAuth();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [pingStatus, setPingStatus] = useState(null);

  useEffect(() => {
    if (currentWorkspace) {
      fetchWebhooks();
    }
  }, [currentWorkspace]);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/webhooks/');
      setWebhooks(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebhook = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      const res = await client.post('/api/webhooks/', {
        target_url: newUrl,
        description: newDesc,
        events: ['issue.created', 'issue.moved', 'sprint.completed'],
      });
      setWebhooks((prev) => [res.data, ...prev]);
      setShowAddModal(false);
      setNewUrl('');
      setNewDesc('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register webhook.');
    }
  };

  const handleSendPing = async (webhookId) => {
    try {
      await client.post(`/api/webhooks/${webhookId}/ping/`);
      setPingStatus(`Ping event enqueued with HMAC-SHA256 signature for webhook ${webhookId.slice(0, 8)}...`);
      setTimeout(() => setPingStatus(null), 5000);
      fetchWebhooks();
    } catch (err) {
      alert('Failed to send test ping.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this webhook endpoint?')) return;
    try {
      await client.delete(`/api/webhooks/${id}/`);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSecret = (id) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-28">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Webhook className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Outbound Webhooks</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deliver real-time JSON event notifications signed with HMAC-SHA256 to external bots, CI/CD, or Slack.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Endpoint</span>
        </button>
      </div>

      {pingStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{pingStatus}</span>
        </div>
      )}

      {/* Webhooks List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Registered Endpoints ({webhooks.length})
          </h4>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No webhook endpoints configured. Click Register Endpoint to add one.
            </div>
          ) : (
            webhooks.map((wh) => (
              <div key={wh.id} className="p-4 px-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{wh.target_url}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>
                    {wh.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{wh.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSendPing(wh.id)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3 text-indigo-600" />
                      <span>Test Ping</span>
                    </button>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Secret key viewer */}
                <div className="mt-3 flex items-center space-x-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 font-medium">Signing Secret:</span>
                  <span className="font-mono text-[11px] text-slate-700">
                    {revealedSecrets[wh.id] ? wh.secret : '••••••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => toggleSecret(wh.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-2"
                  >
                    {revealedSecrets[wh.id] ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Webhook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Register Webhook Endpoint</h3>
            <form onSubmit={handleAddWebhook} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Endpoint URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://your-service.com/api/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. CI/CD automated deployment trigger"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
