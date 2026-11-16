import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import {
  Layers,
  ChevronDown,
  Bell,
  CheckCheck,
  Plus,
  Building2,
  FolderGit2,
  LogOut,
  UserCheck,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({
  onOpenCreateProject,
  onOpenCreateWorkspace,
  onOpenCreateIssue,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const {
    user,
    workspaces,
    currentWorkspace,
    projects,
    currentProject,
    isAdmin,
    isOwner,
    switchWorkspace,
    switchProject,
    logout
  } = useAuth();

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [projDropdownOpen, setProjDropdownOpen] = useState(false);
  const [mobileContextOpen, setMobileContextOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchNotifications();
    }
  }, [currentWorkspace]);

  const fetchNotifications = async () => {
    try {
      const res = await client.get('/api/notifications/');
      setNotifications(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await client.post('/api/notifications/read-all/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 sticky top-0 shadow-xs select-none">
      
      {/* 1. Left Section: Hamburger + Logo + Desktop Workspace & Project Pickers */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <div className="flex items-center space-x-1.5 text-indigo-600 font-bold text-base sm:text-lg tracking-tight shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="hidden lg:inline bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent font-extrabold">
            AgilePlatform
          </span>
        </div>

        {/* Desktop Workspace Picker */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setWsDropdownOpen(!wsDropdownOpen);
              setProjDropdownOpen(false);
              setNotifDropdownOpen(false);
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-800 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="max-w-[120px] lg:max-w-[160px] truncate">
              {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
            </span>
            {currentWorkspace?.plan && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                currentWorkspace.plan === 'enterprise'
                  ? 'bg-purple-100 text-purple-700'
                  : currentWorkspace.plan === 'pro'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {currentWorkspace.plan}
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {wsDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Workspaces ({workspaces.length})
              </div>
              <div className="max-h-56 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setWsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      currentWorkspace?.id === ws.id ? 'bg-indigo-50/70 text-indigo-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate font-medium">{ws.name}</div>
                      <div className="text-[11px] text-slate-400">/{ws.slug}</div>
                    </div>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {ws.plan || 'Free'}
                    </span>
                  </button>
                ))}
              </div>
              {isAdmin && (
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setWsDropdownOpen(false);
                      onOpenCreateWorkspace();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Project Switcher */}
        {currentWorkspace && (
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setProjDropdownOpen(!projDropdownOpen);
                setWsDropdownOpen(false);
                setNotifDropdownOpen(false);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-700 transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="max-w-[110px] lg:max-w-[140px] truncate">
                {currentProject ? currentProject.name : 'Select Project'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {projDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Projects ({projects.length})
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        switchProject(proj.id);
                        setProjDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        currentProject?.id === proj.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{proj.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {proj.key}
                      </span>
                    </button>
                  ))}
                </div>
                {isAdmin && (
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setProjDropdownOpen(false);
                        onOpenCreateProject();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Project</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Unified Context Button (Workspace / Project) */}
        <div className="relative md:hidden">
          <button
            onClick={() => setMobileContextOpen(!mobileContextOpen)}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors max-w-[150px] truncate"
          >
            <span className="truncate">{currentProject?.key || currentWorkspace?.name?.slice(0, 8) || 'App'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
          </button>

          {/* Mobile Sheet for Workspace & Project Switching */}
          {mobileContextOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-4 border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Workspace & Project</h3>
                  <button onClick={() => setMobileContextOpen(false)} className="p-1 rounded-lg text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Workspace list */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">Switch Workspace</div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          switchWorkspace(ws.id);
                          setMobileContextOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          currentWorkspace?.id === ws.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{ws.name}</span>
                        <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-100">{ws.plan || 'Free'}</span>
                      </button>
                    ))}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMobileContextOpen(false);
                        onOpenCreateWorkspace();
                      }}
                      className="w-full mt-2 text-left px-2.5 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center space-x-1.5 transition-colors border border-dashed border-indigo-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Workspace</span>
                    </button>
                  )}
                </div>

                {/* Project list */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">Switch Project</div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchProject(p.id);
                          setMobileContextOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          currentProject?.id === p.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-100">{p.key}</span>
                      </button>
                    ))}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMobileContextOpen(false);
                        onOpenCreateProject();
                      }}
                      className="w-full mt-2 text-left px-2.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center space-x-1.5 transition-colors border border-dashed border-emerald-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Project</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Section: Notifications + User Avatar */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0 pr-1 sm:pr-3">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setWsDropdownOpen(false);
              setProjDropdownOpen(false);
              setUserDropdownOpen(false);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 relative transition-colors cursor-pointer shrink-0"
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[85vw] sm:w-80 max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-xs sm:text-sm text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark read</span>
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors ${
                        !n.is_read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-800 mb-0.5">{n.title}</div>
                      <div className="text-slate-600 leading-relaxed text-[11px]">{n.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setNotifDropdownOpen(false);
              setWsDropdownOpen(false);
            }}
            className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer shrink-0"
            title="User Profile"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <div className="font-semibold text-xs sm:text-sm text-slate-800 truncate">{user?.display_name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="text-[10px] text-indigo-600 font-medium mt-0.5">{user?.job_title || 'Member'}</div>
              </div>
              <div className="py-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
