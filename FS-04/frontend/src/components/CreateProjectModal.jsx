import React, { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { X, FolderPlus } from 'lucide-react';

export default function CreateProjectModal({ onClose, onCreated }) {
  const { currentWorkspace, refreshProjects } = useAuth();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await client.post('/api/projects/', {
        name,
        key: key.toUpperCase().trim(),
        description,
      });
      await refreshProjects();
      if (onCreated) onCreated(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.response?.data?.key?.[0] || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>Create New Project</span>
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile iOS Client"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!key) {
                  setKey(e.target.value.slice(0, 3).toUpperCase());
                }
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Project Key (Short Prefix)</label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. MOB"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Used as issue identifier prefix (e.g. MOB-101).</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Brief summary of project scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
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
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
