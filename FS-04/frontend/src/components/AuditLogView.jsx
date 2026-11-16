import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  History,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
  ChevronDown,
  Activity,
  Calendar,
  CheckCircle2,
  Edit3,
  PlusCircle,
  MoveRight,
  UserPlus
} from 'lucide-react';

export default function AuditLogView() {
  const { currentWorkspace } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    if (currentWorkspace) {
      fetchLogs();
    }
  }, [currentWorkspace, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/audit/?search=${encodeURIComponent(search)}`;
      if (actionFilter) url += `&action=${actionFilter}`;
      const res = await client.get(url);
      setLogs(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Convert technical database action keys into human-friendly badges
  const getActionMeta = (action) => {
    switch (action) {
      case 'ISSUE_CREATED':
        return { label: 'Created Issue', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'ISSUE_UPDATED':
        return { label: 'Updated Issue', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
      case 'ISSUE_MOVED':
        return { label: 'Moved Stage', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'ISSUE_DELETED':
        return { label: 'Deleted Issue', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      case 'INVITATION_SENT':
        return { label: 'Invited Member', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'INVITATION_ACCEPTED':
        return { label: 'Member Joined', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
      case 'PROJECT_CREATED':
        return { label: 'Created Project', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'SPRINT_STARTED':
        return { label: 'Started Sprint', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
      case 'SPRINT_COMPLETED':
        return { label: 'Completed Sprint', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      default:
        return { label: action.replace('_', ' '), bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  // Convert technical field names into plain English
  const formatFieldName = (field) => {
    const map = {
      due_date: 'Due Date',
      board_column: 'Status Column',
      column: 'Status Column',
      priority: 'Priority',
      issue_type: 'Issue Type',
      story_points: 'Story Points',
      title: 'Title',
      description: 'Description',
      assignee: 'Assignee',
      email: 'Invited Email',
      role: 'Assigned Role'
    };
    return map[field] || field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Human-readable change differences instead of raw JSON
  const renderChanges = (changes) => {
    if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) return null;

    return (
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
        {Object.entries(changes).map(([field, val]) => {
          const label = formatFieldName(field);

          // Value is a diff with from -> to
          if (val && typeof val === 'object' && ('from' in val || 'to' in val)) {
            const fromText = val.from === 'None' || val.from === null || val.from === '' ? 'Empty' : String(val.from);
            const toText = val.to === 'None' || val.to === null || val.to === '' ? 'Empty' : String(val.to);

            return (
              <div
                key={field}
                className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
              >
                <span className="font-semibold text-slate-500">{label}:</span>
                <span className="text-slate-400 line-through text-[11px]">{fromText}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[11px]">
                  {toText}
                </span>
              </div>
            );
          }

          // Value is a direct key-value pair
          return (
            <div
              key={field}
              className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <span className="font-semibold text-slate-500">{label}:</span>
              <span className="font-medium text-slate-800">{String(val)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-28">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <History className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Compliance Audit Trail</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verified activity timeline of all actions and modifications in {currentWorkspace?.name}.
          </p>
        </div>

        {/* Clean Filter Dropdown */}
        <div className="relative w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-60 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs appearance-none cursor-pointer"
          >
            <option value="">All Activities ({logs.length})</option>
            <option value="ISSUE_UPDATED">Issue Updates</option>
            <option value="ISSUE_CREATED">New Issues Created</option>
            <option value="ISSUE_MOVED">Workflow Stage Moves</option>
            <option value="INVITATION_SENT">Team Invitations</option>
            <option value="INVITATION_ACCEPTED">Member Onboarding</option>
            <option value="SPRINT_STARTED">Sprint Cycles</option>
            <option value="PLAN_UPGRADED">Billing & Plan Upgrades</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* Activity Timeline Card Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Banner */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Activity History ({logs.length})
          </span>
          <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tamper-Proof Audit Log</span>
          </span>
        </div>

        {/* List of activity cards */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading audit history...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No activity records found matching this filter.
            </div>
          ) : (
            logs.map((log) => {
              const meta = getActionMeta(log.action);
              const actorName = log.actor?.display_name || log.actor?.email || 'System';
              const actorInitial = actorName.charAt(0).toUpperCase();

              return (
                <div key={log.id} className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: User Avatar + Action Narrative */}
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200 shrink-0 mt-0.5">
                        {actorInitial}
                      </div>

                      <div className="min-w-0">
                        {/* Action Badge & Title */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.bg} ${meta.text} ${meta.border}`}
                          >
                            {meta.label}
                          </span>
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {log.target_title || log.target_type}
                          </span>
                        </div>

                        {/* Actor details */}
                        <div className="text-xs sm:text-sm text-slate-600">
                          Performed by <strong className="text-slate-800">{actorName}</strong>
                          {log.actor?.job_title && (
                            <span className="text-slate-400"> • {log.actor.job_title}</span>
                          )}
                        </div>

                        {/* Human-readable field modifications */}
                        {renderChanges(log.changes)}
                      </div>
                    </div>

                    {/* Right: Timestamp */}
                    <div className="text-[11px] text-slate-400 shrink-0 flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span className="hidden sm:inline">{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
