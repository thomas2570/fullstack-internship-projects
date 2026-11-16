import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  X,
  Trash2,
  Send,
  Paperclip,
  Clock,
  MessageSquare,
  Check,
  CheckCircle2,
  Play,
  RotateCcw,
  Save,
  AlertCircle,
  FileText,
  UserCheck,
  ArrowRight
} from 'lucide-react';

export default function IssueDetailModal({ issue, onClose, onUpdated, onDeleted }) {
  const { user, currentWorkspace } = useAuth();

  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'attachments' | 'history'
  const [columns, setColumns] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Form states
  const [title, setTitle] = useState(issue?.title || '');
  const [description, setDescription] = useState(issue?.description || '');
  const [columnId, setColumnId] = useState(issue?.board_column?.id || '');
  const [priority, setPriority] = useState(issue?.priority || 'medium');
  const [issueType, setIssueType] = useState(issue?.issue_type || 'task');
  const [assigneeId, setAssigneeId] = useState(issue?.assignee?.id || '');
  const [storyPoints, setStoryPoints] = useState(issue?.story_points || 1);
  const [dueDate, setDueDate] = useState(issue?.due_date || '');

  // Sub-resources & UI states
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const isAssignee = Boolean(
    user && issue?.assignee && (user.id === issue.assignee.id || user.email === issue.assignee.email)
  );

  const canDelete = Boolean(
    currentWorkspace?.role === 'owner' ||
    currentWorkspace?.role === 'admin' ||
    (user && issue?.reporter && user.id === issue.reporter.id)
  );

  useEffect(() => {
    if (issue) {
      setTitle(issue.title || '');
      setDescription(issue.description || '');
      setColumnId(issue.board_column?.id || '');
      setPriority(issue.priority || 'medium');
      setIssueType(issue.issue_type || 'task');
      setAssigneeId(issue.assignee?.id || '');
      setStoryPoints(issue.story_points || 1);
      setDueDate(issue.due_date || '');

      fetchColumns();
      fetchTeamMembers();
      fetchComments();
      fetchAttachments();
      fetchHistory();
    }
  }, [issue]);

  const fetchColumns = async () => {
    try {
      const res = await client.get(`/api/boards/?project_id=${issue.project}`);
      const boards = res.data.results || res.data || [];
      if (boards[0]) setColumns(boards[0].columns || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await client.get('/api/workspaces/members/');
      setTeamMembers(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await client.get(`/api/issues/${issue.id}/comments/`);
      setComments(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttachments = async () => {
    try {
      const res = await client.get(`/api/issues/${issue.id}/attachments/`);
      setAttachments(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await client.get(`/api/audit/?search=${issue.key}`);
      setHistory(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Find standard workflow columns
  const activeColumn = columns.find((c) => c.id === columnId) || issue?.board_column;
  const isDone = activeColumn?.is_done_column || activeColumn?.name?.toLowerCase().includes('done');
  const doneColumn = columns.find((c) => c.is_done_column || c.name?.toLowerCase().includes('done'));
  const inProgressColumn = columns.find((c) => c.name?.toLowerCase().includes('progress'));
  const todoColumn = columns.find((c) => c.name?.toLowerCase().includes('to do') || c.name?.toLowerCase().includes('todo') || c.order === 1);

  // Main Save handler (saves all fields at once)
  const handleSave = async (fieldOverrides = {}) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const payload = {
        title: fieldOverrides.title !== undefined ? fieldOverrides.title : title,
        description: fieldOverrides.description !== undefined ? fieldOverrides.description : description,
        priority: fieldOverrides.priority !== undefined ? fieldOverrides.priority : priority,
        issue_type: fieldOverrides.issue_type !== undefined ? fieldOverrides.issue_type : issueType,
        board_column_id: fieldOverrides.board_column_id !== undefined ? fieldOverrides.board_column_id : columnId,
        assignee_id: fieldOverrides.assignee_id !== undefined ? fieldOverrides.assignee_id : (assigneeId || null),
        story_points: Number(fieldOverrides.story_points !== undefined ? fieldOverrides.story_points : storyPoints),
        due_date: fieldOverrides.due_date !== undefined ? fieldOverrides.due_date : (dueDate || null),
      };

      const res = await client.patch(`/api/issues/${issue.id}/`, payload);
      if (onUpdated) onUpdated(res.data);
      fetchHistory();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      return res.data;
    } catch (err) {
      console.error('Failed to update issue:', err);
      setStatusMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  // Workflow Actions
  const handleMarkAsSolved = async () => {
    if (!doneColumn) return;
    setSaving(true);
    try {
      setColumnId(doneColumn.id);
      await handleSave({ board_column_id: doneColumn.id });

      // Automatically post a resolution comment
      try {
        const commentRes = await client.post(`/api/issues/${issue.id}/comments/`, {
          content: `✅ Issue marked as Solved and Completed by ${user?.display_name || 'Team Member'}.`,
        });
        setComments((prev) => [...prev, commentRes.data]);
      } catch (commentErr) {
        console.error('Failed to post resolution comment:', commentErr);
      }

      setStatusMessage({ type: 'success', text: 'Problem solved and issue marked as Done!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to mark solved:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStartWorking = async () => {
    if (!inProgressColumn) return;
    setColumnId(inProgressColumn.id);
    await handleSave({ board_column_id: inProgressColumn.id });
    setStatusMessage({ type: 'success', text: 'Issue status moved to In Progress.' });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleReopen = async () => {
    const target = todoColumn || inProgressColumn || columns[0];
    if (!target) return;
    setColumnId(target.id);
    await handleSave({ board_column_id: target.id });
    setStatusMessage({ type: 'success', text: `Issue reopened in ${target.name}.` });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await client.post(`/api/issues/${issue.id}/comments/`, {
        content: newComment,
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      fetchHistory();
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await client.post(`/api/issues/${issue.id}/attachments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachments((prev) => [res.data, ...prev]);
      fetchHistory();
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${issue.key}?`)) return;
    try {
      await client.delete(`/api/issues/${issue.id}/`);
      if (onDeleted) onDeleted(issue.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete issue:', err);
    }
  };

  if (!issue) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* 1. Header Bar */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="font-mono font-bold text-xs sm:text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
              {issue.key}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate max-w-[120px] sm:max-w-none">
              in {issue.project_name || 'Project'}
            </span>

            {/* Current Status Pill */}
            <span
              className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isDone
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {activeColumn?.name || 'Open'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                title="Delete issue (Admin / Owner / Reporter only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Employee Workflow Action Ribbon */}
        <div className="bg-indigo-50/40 border-b border-indigo-100 px-3.5 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center space-x-2">
            {isAssignee ? (
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assigned to you: Review and resolve this problem</span>
              </div>
            ) : (
              <div className="text-xs text-slate-600">
                Assigned to: <strong className="text-slate-800">{issue.assignee?.display_name || 'Unassigned'}</strong>
              </div>
            )}
          </div>

          {/* Quick Workflow Transitions */}
          <div className="flex items-center space-x-2">
            {!isDone ? (
              <>
                {/* If in To Do -> Start Working */}
                {activeColumn?.name?.toLowerCase().includes('to do') && inProgressColumn && (
                  <button
                    onClick={handleStartWorking}
                    disabled={saving}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start Working</span>
                  </button>
                )}

                {/* Prominent Complete / Mark as Solved Button */}
                {doneColumn && (
                  <button
                    onClick={handleMarkAsSolved}
                    disabled={saving}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Problem Solved (Complete Issue)</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1 bg-emerald-100 px-2.5 py-1 rounded-md">
                  <Check className="w-3.5 h-3.5" />
                  <span>Problem Solved ✓</span>
                </span>
                <button
                  onClick={handleReopen}
                  disabled={saving}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reopen Issue</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {statusMessage && (
          <div
            className={`px-6 py-2 text-xs flex items-center space-x-2 border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* 3. Modal Main Body (2 Columns Layout) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Left Column (2/3): Title, Description, Comments/History Tabs */}
          <div className="md:col-span-2 p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Title Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Summary Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue summary title"
                className="w-full text-lg font-bold text-slate-900 border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-2 py-1.5 transition-colors"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Description & Reproduction Steps
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add acceptance criteria, technical requirements, or resolution notes..."
                className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            {/* Tabs Header */}
            <div>
              <div className="flex items-center space-x-4 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`pb-2.5 text-xs font-semibold flex items-center space-x-1.5 transition-colors border-b-2 -mb-px cursor-pointer ${
                    activeTab === 'comments'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion & Comments ({comments.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`pb-2.5 text-xs font-semibold flex items-center space-x-1.5 transition-colors border-b-2 -mb-px cursor-pointer ${
                    activeTab === 'attachments'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments ({attachments.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-2.5 text-xs font-semibold flex items-center space-x-1.5 transition-colors border-b-2 -mb-px cursor-pointer ${
                    activeTab === 'history'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Audit History</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="pt-4">
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {/* Add comment box */}
                    <form onSubmit={handleAddComment} className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Write a comment, share progress, or ask for review..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>

                    {/* Comments list */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {comments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">
                          No comments yet. Leave a note or solution details above.
                        </p>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span className="font-semibold text-slate-800">
                                {c.author?.display_name || 'Team Member'}
                              </span>
                              <span>{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="space-y-4">
                    <div>
                      <label className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer transition-colors">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{uploading ? 'Uploading...' : 'Upload Attachment'}</span>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {attachments.length === 0 ? (
                        <div className="col-span-2 text-xs text-slate-400 italic text-center py-4">
                          No attachments uploaded.
                        </div>
                      ) : (
                        attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center space-x-2 text-xs text-slate-700 transition-colors"
                          >
                            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div className="truncate flex-1">
                              <div className="font-medium truncate">{att.filename}</div>
                              <div className="text-[10px] text-slate-400">
                                {Math.round(att.file_size / 1024)} KB
                              </div>
                            </div>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
                    {history.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-4">No audit events recorded.</p>
                    ) : (
                      history.map((h) => {
                        const formatFieldName = (f) => {
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
                          };
                          return map[f] || f.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        };

                        const formatAction = (a) => {
                          switch (a) {
                            case 'ISSUE_CREATED': return 'created this issue';
                            case 'ISSUE_UPDATED': return 'updated properties';
                            case 'ISSUE_MOVED': return 'moved column stage';
                            default: return a ? a.replace('_', ' ').toLowerCase() : 'modified issue';
                          }
                        };

                        return (
                          <div key={h.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="text-slate-800">
                                <span className="font-bold text-slate-900">{h.actor?.display_name || 'System'}</span>{' '}
                                <span className="text-slate-500">{formatAction(h.action)}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{new Date(h.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>

                            {h.changes && Object.keys(h.changes).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/50">
                                {Object.entries(h.changes).map(([field, val]) => {
                                  const label = formatFieldName(field);
                                  if (val && typeof val === 'object' && ('from' in val || 'to' in val)) {
                                    const fromText = val.from === 'None' || val.from === null || val.from === '' ? 'Empty' : String(val.from);
                                    const toText = val.to === 'None' || val.to === null || val.to === '' ? 'Empty' : String(val.to);
                                    return (
                                      <div key={field} className="inline-flex items-center space-x-1 text-[11px] bg-white border border-slate-200 rounded-md px-2 py-0.5 text-slate-700">
                                        <span className="font-semibold text-slate-500">{label}:</span>
                                        <span className="text-slate-400 line-through text-[10px]">{fromText}</span>
                                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                                        <span className="font-bold text-indigo-700 bg-indigo-50 px-1 rounded text-[10px]">{toText}</span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={field} className="inline-flex items-center space-x-1 text-[11px] bg-white border border-slate-200 rounded-md px-2 py-0.5 text-slate-700">
                                      <span className="font-semibold text-slate-500">{label}:</span>
                                      <span className="font-medium text-slate-800">{String(val)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3): Attributes, Assignee, Workflow State */}
          <div className="p-4 sm:p-6 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Issue Properties
            </h4>

            {/* Workflow Stage */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Status Column</label>
              <select
                value={columnId}
                onChange={(e) => {
                  setColumnId(e.target.value);
                  handleSave({ board_column_id: e.target.value });
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_done_column ? '(Done)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  handleSave({ assignee_id: e.target.value || null });
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.display_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  handleSave({ priority: e.target.value });
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔵 Low</option>
              </select>
            </div>

            {/* Issue Type */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Type</label>
              <select
                value={issueType}
                onChange={(e) => {
                  setIssueType(e.target.value);
                  handleSave({ issue_type: e.target.value });
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="epic">Epic</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Story Points</label>
              <input
                type="number"
                min="0"
                max="100"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Bottom Sticky Action Footer with Save Button */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs">
            {saveSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center space-x-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>All changes saved successfully!</span>
              </span>
            ) : saving ? (
              <span className="text-indigo-600 font-semibold flex items-center space-x-1">
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Saving updates...</span>
              </span>
            ) : (
              <span className="text-slate-400 text-[11px] sm:text-xs">Click Save to persist title, description, or property edits.</span>
            )}
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
            >
              Close
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave()}
              className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
