import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Workflow, Plus, Trash2, Edit2, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function WorkflowSettings() {
  const { currentProject } = useAuth();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState('#4F46E5');
  const [newColWip, setNewColWip] = useState(0);
  const [newColIsDone, setNewColIsDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentProject) {
      fetchWorkflow();
    }
  }, [currentProject]);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/api/boards/?project_id=${currentProject.id}`);
      const boards = res.data.results || res.data || [];
      if (boards[0]) {
        setBoard(boards[0]);
        setColumns(boards[0].columns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim() || !board) return;

    try {
      const res = await client.post(`/api/boards/${board.id}/columns/`, {
        name: newColName,
        color: newColColor,
        wip_limit: Number(newColWip) || 0,
        is_done_column: newColIsDone,
      });
      setColumns((prev) => [...prev, res.data]);
      setShowAddModal(false);
      setNewColName('');
      setNewColWip(0);
      setNewColIsDone(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add column.');
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm('Delete this workflow stage?')) return;
    try {
      await client.delete(`/api/boards/columns/${columnId}/`);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Cannot delete column with existing issues.');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-28">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Workflow className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Custom Workflows & WIP Limits</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Define custom issue stages and Work-In-Progress guardrails for {currentProject?.name}.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Workflow Stage</span>
        </button>
      </div>

      {/* Columns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Active Stages ({columns.length})
          </h4>
        </div>

        <div className="divide-y divide-slate-100">
          {columns.map((col, index) => (
            <div key={col.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3.5">
                <span className="w-6 text-xs font-bold text-slate-400 font-mono">#{index + 1}</span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                <div>
                  <div className="font-semibold text-sm text-slate-800 flex items-center space-x-2">
                    <span>{col.name}</span>
                    {col.is_done_column && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Done State
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    WIP Limit: {col.wip_limit > 0 ? `${col.wip_limit} issues` : 'Unlimited'} • {col.issues_count || 0} active issues
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteColumn(col.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                  title="Delete stage"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Stage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Add Workflow Stage</h3>
            <form onSubmit={handleAddColumn} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Stage Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. In Security Review"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Color Marker</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newColColor}
                    onChange={(e) => setNewColColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={newColColor}
                    onChange={(e) => setNewColColor(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Work-In-Progress (WIP) Limit
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newColWip}
                  onChange={(e) => setNewColWip(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Set to 0 for unlimited WIP.</span>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="doneCheckbox"
                  checked={newColIsDone}
                  onChange={(e) => setNewColIsDone(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="doneCheckbox" className="text-xs font-medium text-slate-700">
                  Mark as Completion ("Done") column
                </label>
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
                  Save Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
