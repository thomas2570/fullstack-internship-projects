import React, { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { X, Building2 } from 'lucide-react';

export default function CreateWorkspaceModal({ onClose, onCreated }) {
  const { refreshWorkspaces, switchWorkspace } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await client.post('/api/workspaces/', {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      });
      await refreshWorkspaces();
      switchWorkspace(res.data.id);
      if (onCreated) onCreated(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.slug?.[0] || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Create New Workspace Tenant</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Company / Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Dynamics Corp"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                }
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Workspace URL Slug</label>
            <div className="flex items-center">
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2.5 rounded-l-lg border border-r-0 border-slate-200">
                app.saas.io/
              </span>
              <input
                type="text"
                required
                placeholder="apex-corp"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-r-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
