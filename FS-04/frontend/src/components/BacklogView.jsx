import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  Play,
  CheckCircle,
  Plus,
  TrendingDown,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Clock,
  Sparkles,
  BarChart2
} from 'lucide-react';

export default function BacklogView({ onSelectIssue, onOpenCreateIssue }) {
  const { currentProject } = useAuth();

  const [sprints, setSprints] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [burndownSprint, setBurndownSprint] = useState(null);
  const [burndownData, setBurndownData] = useState(null);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');

  useEffect(() => {
    if (currentProject) {
      fetchSprintsAndIssues();
    }
  }, [currentProject]);

  const fetchSprintsAndIssues = async () => {
    setLoading(true);
    try {
      const [sprintRes, issuesRes] = await Promise.all([
        client.get(`/api/sprints/?project_id=${currentProject.id}`),
        client.get(`/api/issues/?project_id=${currentProject.id}`),
      ]);
      setSprints(sprintRes.data.results || sprintRes.data || []);
      setIssues(issuesRes.data.results || issuesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSprint = async (sprintId) => {
    try {
      await client.post(`/api/sprints/${sprintId}/start/`);
      fetchSprintsAndIssues();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start sprint.');
    }
  };

  const handleCompleteSprint = async (sprintId) => {
    if (!window.confirm('Complete this sprint? Unfinished issues will be moved to the backlog.')) return;
    try {
      await client.post(`/api/sprints/${sprintId}/complete/`);
      fetchSprintsAndIssues();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete sprint.');
    }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    try {
      await client.post('/api/sprints/', {
        project: currentProject.id,
        name: newSprintName,
        goal: newSprintGoal,
      });
      setShowCreateSprint(false);
      setNewSprintName('');
      setNewSprintGoal('');
      fetchSprintsAndIssues();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create sprint.');
    }
  };

  const openBurndownChart = async (sprint) => {
    setBurndownSprint(sprint);
    try {
      const res = await client.get(`/api/sprints/${sprint.id}/burndown/`);
      setBurndownData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const activeSprint = sprints.find((s) => s.status === 'active');
  const plannedSprints = sprints.filter((s) => s.status === 'planned');
  const backlogIssues = issues.filter((i) => !i.sprint);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Sprints & Backlog</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Plan agile iterations, estimate story points, and monitor sprint burndown velocity.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateSprint(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Create Sprint</span>
          </button>
          <button
            onClick={onOpenCreateIssue}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* 1. Active Sprint Section */}
      {activeSprint && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50/70 to-purple-50/50 px-5 py-4 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-slate-900">{activeSprint.name}</h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active Sprint
                  </span>
                </div>
                {activeSprint.goal && (
                  <p className="text-xs text-slate-600 mt-0.5 italic">"{activeSprint.goal}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => openBurndownChart(activeSprint)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 transition-colors shadow-2xs"
              >
                <TrendingDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>Burndown Chart</span>
              </button>

              <button
                onClick={() => handleCompleteSprint(activeSprint.id)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Complete Sprint</span>
              </button>
            </div>
          </div>

          {/* Active Sprint Issues */}
          <div className="p-4 divide-y divide-slate-100">
            {issues
              .filter((i) => i.sprint?.id === activeSprint.id)
              .map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-semibold text-slate-500">{issue.key}</span>
                    <span className="text-xs font-medium text-slate-800">{issue.title}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {issue.board_column?.name || 'Backlog'}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                      {issue.story_points}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 2. Planned Sprints Section */}
      <div className="space-y-4">
        {plannedSprints.map((sprint) => {
          const sprintIssues = issues.filter((i) => i.sprint?.id === sprint.id);
          const totalPoints = sprintIssues.reduce((acc, curr) => acc + (curr.story_points || 0), 0);

          return (
            <div key={sprint.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{sprint.name}</h4>
                  <span className="text-xs text-slate-500">
                    {sprintIssues.length} issues • {totalPoints} story points planned
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStartSprint(sprint.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Sprint</span>
                  </button>
                </div>
              </div>

              <div className="p-4 divide-y divide-slate-100">
                {sprintIssues.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No issues allocated to this sprint yet.
                  </div>
                ) : (
                  sprintIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => onSelectIssue(issue)}
                      className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs font-semibold text-slate-500">{issue.key}</span>
                        <span className="text-xs font-medium text-slate-800">{issue.title}</span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                        {issue.story_points}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Product Backlog Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Product Backlog ({backlogIssues.length})</h3>
            <p className="text-xs text-slate-500">Unassigned issues ready to be scoped into upcoming sprints.</p>
          </div>
        </div>

        <div className="p-4 divide-y divide-slate-100">
          {backlogIssues.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Backlog is empty! Create new issues or import tasks.
            </div>
          ) : (
            backlogIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-semibold text-slate-500">{issue.key}</span>
                  <span className="text-xs font-medium text-slate-800">{issue.title}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {issue.priority}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                    {issue.story_points}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Sprint Modal */}
      {showCreateSprint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Create New Sprint</h3>
            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Sprint Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 16 - API Hardening"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Sprint Goal</label>
                <textarea
                  rows={3}
                  placeholder="What is the key business outcome this sprint aims to ship?"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSprint(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Burndown Chart Modal */}
      {burndownSprint && burndownData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-indigo-600" />
                  <span>Burndown Chart: {burndownData.sprint_name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total points: {burndownData.total_points} • Dates: {burndownData.start_date} to {burndownData.end_date}
                </p>
              </div>
              <button onClick={() => setBurndownSprint(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                ✕
              </button>
            </div>

            {/* SVG Burndown Plot */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-4">
              <svg viewBox="0 0 500 240" className="w-full h-56">
                {/* Horizontal Grid lines */}
                <line x1="50" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeDasharray="4" />
                <line x1="50" y1="75" x2="480" y2="75" stroke="#e2e8f0" strokeDasharray="4" />
                <line x1="50" y1="130" x2="480" y2="130" stroke="#e2e8f0" strokeDasharray="4" />
                <line x1="50" y1="185" x2="480" y2="185" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Y-axis labels */}
                <text x="40" y="25" textAnchor="end" className="text-[9px] fill-slate-400">
                  {burndownData.total_points} pts
                </text>
                <text x="40" y="105" textAnchor="end" className="text-[9px] fill-slate-400">
                  {Math.round(burndownData.total_points / 2)} pts
                </text>
                <text x="40" y="190" textAnchor="end" className="text-[9px] fill-slate-400">
                  0 pts
                </text>

                {/* Ideal Burndown Line (Dashed Slate) */}
                <line
                  x1="50"
                  y1="25"
                  x2="470"
                  y2="185"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />

                {/* Actual Burn Line (Solid Indigo) */}
                {burndownData.metrics && burndownData.metrics.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={burndownData.metrics
                      .filter((m) => m.actual !== null)
                      .map((m, idx, arr) => {
                        const x = 50 + (idx / Math.max(1, arr.length - 1)) * 420;
                        const y = 185 - ((m.actual || 0) / Math.max(1, burndownData.total_points)) * 160;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>

              <div className="flex items-center justify-center space-x-6 text-xs mt-2">
                <div className="flex items-center space-x-1.5 text-slate-500">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" />
                  <span>Ideal Guideline</span>
                </div>
                <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold">
                  <span className="w-4 h-1 bg-indigo-600 rounded" />
                  <span>Actual Burn Velocity</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setBurndownSprint(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
