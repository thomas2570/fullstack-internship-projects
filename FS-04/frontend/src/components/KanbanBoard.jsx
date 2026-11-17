import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Plus,
  AlertCircle,
  CheckSquare,
  Bookmark,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  MessageSquare,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';

export default function KanbanBoard({ onSelectIssue, onOpenCreateIssue }) {
  const { currentProject } = useAuth();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (currentProject) {
      fetchBoardAndIssues();
    }
  }, [currentProject]);

  const fetchBoardAndIssues = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Parallelize board, issues, and team members fetch for ultra-fast loading
      const [boardRes, issuesRes, membersRes] = await Promise.all([
        client.get(`/api/boards/?project_id=${currentProject.id}`),
        client.get(`/api/issues/?project_id=${currentProject.id}`),
        client.get('/api/workspaces/members/').catch(() => ({ data: [] })),
      ]);

      const boardList = boardRes.data.results || boardRes.data || [];
      const activeBoard = boardList[0];

      if (activeBoard) {
        setBoard(activeBoard);
        setColumns(activeBoard.columns || []);
      }
      setIssues(issuesRes.data.results || issuesRes.data || []);
      setTeamMembers(membersRes.data.results || membersRes.data || []);
    } catch (err) {
      console.error('Error fetching board data:', err);
      setErrorMessage('Failed to load project board.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await client.get('/api/workspaces/members/');
      setTeamMembers(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and drop handler for desktop
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destColId = destination.droppableId;
    const movedIssue = issues.find((i) => i.id === draggableId);
    if (!movedIssue) return;

    const destColumn = columns.find((c) => c.id === destColId);
    const destColumnIssues = issues.filter((i) => i.board_column?.id === destColId && i.id !== movedIssue.id);

    if (destColumn && destColumn.wip_limit > 0 && destColumnIssues.length >= destColumn.wip_limit) {
      setErrorMessage(`WIP limit reached! Column "${destColumn.name}" cannot hold more than ${destColumn.wip_limit} issues.`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const previousIssues = [...issues];
    const newOrder = destination.index * 1000 + 1000;

    const updatedIssue = {
      ...movedIssue,
      board_column: destColumn || movedIssue.board_column,
      order: newOrder,
    };

    setIssues((prev) => prev.map((i) => (i.id === draggableId ? updatedIssue : i)));

    try {
      await client.post(`/api/issues/${draggableId}/move/`, {
        column_id: destColId,
        order: newOrder,
      });
    } catch (err) {
      console.error('Failed to move issue:', err);
      setIssues(previousIssues);
      setErrorMessage(err.response?.data?.detail || 'Failed to update issue position.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  // Quick move handler for mobile
  const handleQuickMove = async (e, issueId, targetColId) => {
    e.stopPropagation();
    const destColumn = columns.find((c) => c.id === targetColId);
    if (!destColumn) return;

    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, board_column: destColumn } : i))
    );

    try {
      await client.post(`/api/issues/${issueId}/move/`, {
        column_id: targetColId,
      });
    } catch (err) {
      console.error(err);
      fetchBoardAndIssues();
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const q = searchTerm.trim().toLowerCase();
    let matchSearch = true;
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      const textToSearch = [
        issue.title,
        issue.key,
        issue.description,
        issue.priority,
        issue.issue_type,
        issue.board_column?.name,
        issue.assignee?.display_name,
        issue.assignee?.email,
      ].filter(Boolean).join(' ').toLowerCase();

      matchSearch = words.every((word) => textToSearch.includes(word));
    }

    const matchColumn = selectedColumn === 'ALL' || issue.board_column?.id === selectedColumn;
    const matchPriority = selectedPriority === 'ALL' || issue.priority === selectedPriority;
    const matchType = selectedType === 'ALL' || issue.issue_type === selectedType;
    const matchAssignee = selectedAssignee === 'ALL' || issue.assignee?.id === selectedAssignee;
    return matchSearch && matchColumn && matchPriority && matchType && matchAssignee;
  });

  const getIssueTypeIcon = (type) => {
    switch (type) {
      case 'story':
        return <Bookmark className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />;
      case 'bug':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'epic':
        return <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-100" />;
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center space-x-1 text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[11px] font-bold">
            <ArrowUp className="w-3 h-3 stroke-[2.5]" />
            <span>Urgent</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px] font-semibold">
            <ArrowUp className="w-3 h-3" />
            <span>High</span>
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center space-x-1 text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] font-medium">
            <ArrowDown className="w-3 h-3" />
            <span>Low</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px] font-medium">
            <Minus className="w-3 h-3" />
            <span>Med</span>
          </span>
        );
    }
  };

  if (!currentProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <Layers className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-700">No Project Selected</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select or create a project to view its Kanban sprint board.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3.5 sm:p-5 lg:p-6 overflow-hidden select-none">
      {/* Top Banner / Error Toast */}
      {errorMessage && (
        <div className="mb-2 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
          <span className="font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Top Header Bar: Board Title & Create Issue Action */}
      <div className="mb-3.5 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Kanban Board</h2>
            {currentProject && (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentProject.key}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage issues, track sprint flow, and collaborate with your team across columns.
          </p>
        </div>

        <button
          onClick={onOpenCreateIssue}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Issue</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="mb-4 shrink-0 space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search issues by key, title, assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clean Filter Dropdowns */}
          <div className="grid grid-cols-2 md:flex md:items-center gap-2">
            {/* Status / Column Filter Dropdown */}
            <div className="relative flex-1 md:w-40">
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs appearance-none cursor-pointer"
              >
                <option value="ALL">Status: All ({issues.length})</option>
                {columns.map((c) => {
                  const count = issues.filter((i) => i.board_column?.id === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      Status: {c.name} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Priority Filter Dropdown */}
            <div className="relative flex-1 md:w-32">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs appearance-none cursor-pointer"
              >
                <option value="ALL">Priority: All</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔵 Low</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Type Filter Dropdown */}
            <div className="relative flex-1 md:w-32">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs appearance-none cursor-pointer"
              >
                <option value="ALL">Type: All</option>
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="epic">Epic</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Assignee Filter Dropdown */}
            <div className="relative flex-1 md:w-36">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs appearance-none cursor-pointer"
              >
                <option value="ALL">Assignee: All</option>
                {teamMembers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.display_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active filter feedback badge */}
        {(searchTerm.trim() || selectedColumn !== 'ALL' || selectedPriority !== 'ALL' || selectedType !== 'ALL' || selectedAssignee !== 'ALL') && (
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-indigo-50/70 border border-indigo-200/60 rounded-xl text-xs sm:text-sm text-indigo-800 animate-in fade-in">
            <span className="flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Showing <strong>{filteredIssues.length}</strong> of <strong>{issues.length}</strong> issues
                {searchTerm.trim() && <span> matching "<strong>{searchTerm.trim()}</strong>"</span>}
              </span>
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedColumn('ALL');
                setSelectedPriority('ALL');
                setSelectedType('ALL');
                setSelectedAssignee('ALL');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 underline cursor-pointer ml-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 1. Mobile List View (md:hidden) */}
      <div className="md:hidden flex-1 overflow-y-auto space-y-4 pb-8">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-slate-400">
            Loading issues...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center space-y-3 my-2">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-800">No issues found</h4>
              <p className="text-sm text-slate-400 mt-1">Create your first task or change filter criteria.</p>
            </div>
            <button
              onClick={onOpenCreateIssue}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              Create Issue
            </button>
          </div>
        ) : (
          /* Render issues grouped or filtered */
          (selectedColumn === 'ALL' ? columns : columns.filter((c) => c.id === selectedColumn)).map((col) => {
            const colIssues = filteredIssues
              .filter((i) => i.board_column?.id === col.id)
              .sort((a, b) => a.order - b.order);

            if (selectedColumn === 'ALL' && colIssues.length === 0) return null;

            const colIndex = columns.findIndex((c) => c.id === col.id);
            const nextCol = colIndex >= 0 && colIndex < columns.length - 1 ? columns[colIndex + 1] : null;

            return (
              <div key={col.id} className="space-y-2">
                {/* Stage Section Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color || '#4F46E5' }} />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-700">
                      {col.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    {colIssues.length}
                  </span>
                </div>

                {/* Issues in this stage */}
                <div className="space-y-2">
                  {colIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => onSelectIssue(issue)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          {getIssueTypeIcon(issue.issue_type)}
                          <span className="text-sm font-mono font-bold text-slate-700">{issue.key}</span>
                        </div>
                        {getPriorityBadge(issue.priority)}
                      </div>

                      <h5 className="text-sm font-semibold text-slate-800 leading-snug">{issue.title}</h5>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center space-x-2">
                          {issue.assignee ? (
                            <span className="font-medium text-slate-700 truncate max-w-[130px]">
                              {issue.assignee.display_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                          {issue.comments_count > 0 && (
                            <span className="flex items-center space-x-0.5 text-slate-400">
                              <MessageSquare className="w-3 h-3" />
                              <span>{issue.comments_count}</span>
                            </span>
                          )}
                        </div>

                        {nextCol && (
                          <button
                            onClick={(e) => handleQuickMove(e, issue.id, nextCol.id)}
                            className="flex items-center space-x-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                          >
                            <span>Move to {nextCol.name} ➔</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Kanban DragDrop Board (hidden md:flex) */}
      <div className="hidden md:flex flex-1 overflow-x-auto overflow-y-hidden pb-2">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Loading Kanban board...
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex items-start space-x-3 h-full w-full min-w-0">
              {columns
                .filter((c) => selectedColumn === 'ALL' || c.id === selectedColumn)
                .map((column) => {
                  const colIssues = filteredIssues
                    .filter((i) => i.board_column?.id === column.id)
                    .sort((a, b) => a.order - b.order);

                  const isWipExceeded = column.wip_limit > 0 && colIssues.length > column.wip_limit;

                  return (
                    <div
                      key={column.id}
                      className="flex-1 min-w-[215px] max-w-[320px] bg-slate-100/90 rounded-xl flex flex-col max-h-full border border-slate-200/80 shadow-xs shrink-0 lg:shrink"
                    >
                      {/* Column Header */}
                      <div className="px-3.5 py-2.5 border-b border-slate-200/70 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: column.color || '#4F46E5' }}
                          />
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                            {column.name}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isWipExceeded
                                ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                                : 'bg-slate-200/80 text-slate-600'
                            }`}
                          >
                            {colIssues.length}
                            {column.wip_limit > 0 && ` / ${column.wip_limit}`}
                          </span>
                        </div>
                      </div>

                      {/* Droppable Issue Area */}
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-2 flex-1 overflow-y-auto space-y-2.5 min-h-[140px] transition-colors rounded-b-xl ${
                              snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                            }`}
                          >
                            {colIssues.length === 0 ? (
                              <div className="h-28 flex flex-col items-center justify-center text-center p-3 text-slate-400">
                                <span className="text-xs font-medium">
                                  {searchTerm.trim() ? 'No matching issues' : 'No issues'}
                                </span>
                              </div>
                            ) : (
                              colIssues.map((issue, index) => (
                                <Draggable key={issue.id} draggableId={issue.id} index={index}>
                                  {(dragProvided, dragSnapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      onClick={() => onSelectIssue(issue)}
                                      className={`bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer select-none group ${
                                        dragSnapshot.isDragging ? 'rotate-1 scale-102 ring-2 ring-indigo-500 shadow-lg' : ''
                                      }`}
                                    >
                                      {/* Card Top: Type, Key, Priority */}
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-1.5">
                                          {getIssueTypeIcon(issue.issue_type)}
                                          <span className="text-xs font-mono font-semibold text-slate-500">
                                            {issue.key}
                                          </span>
                                        </div>
                                        {getPriorityBadge(issue.priority)}
                                      </div>

                                      {/* Card Title */}
                                      <h5 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 mb-2.5 leading-snug group-hover:text-indigo-600 transition-colors">
                                        {issue.title}
                                      </h5>

                                      {/* Card Bottom Meta */}
                                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                                        <div className="flex items-center space-x-2">
                                          {issue.story_points > 0 && (
                                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center border border-slate-200">
                                              {issue.story_points}
                                            </span>
                                          )}
                                          {issue.comments_count > 0 && (
                                            <span className="flex items-center space-x-1 text-slate-500">
                                              <MessageSquare className="w-3.5 h-3.5" />
                                              <span className="text-xs">{issue.comments_count}</span>
                                            </span>
                                          )}
                                        </div>

                                        {issue.assignee ? (
                                          <div className="flex items-center space-x-1.5" title={issue.assignee.display_name}>
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-200">
                                              {issue.assignee.display_name?.charAt(0) || 'U'}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {/* Quick Create Issue button inside column */}
                      <div className="p-2 border-t border-slate-200/50 bg-slate-50/50">
                        <button
                          onClick={onOpenCreateIssue}
                          className="w-full py-2 px-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-white flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create issue</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
