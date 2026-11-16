import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Kanban,
  ListTodo,
  Workflow,
  History,
  Webhook,
  CreditCard,
  Users,
  Settings,
  Sparkles,
  X,
  Layers
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) {
  const { currentWorkspace, currentProject, isAdmin, userRole } = useAuth();

  const allNavItems = [
    { id: 'board', label: 'Kanban Board', icon: Kanban, disabled: !currentProject },
    { id: 'backlog', label: 'Backlog & Sprints', icon: ListTodo, disabled: !currentProject },
    { id: 'workflows', label: 'Custom Workflows', icon: Workflow, disabled: !currentProject, adminOnly: true },
    { id: 'audit', label: 'Audit Trail', icon: History, adminOnly: true },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook, adminOnly: true },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard, adminOnly: true },
    { id: 'team', label: 'Team Members', icon: Users },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileMenuOpen) setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Top: Project Info & Nav links */}
      <div className="px-3.5 py-3.5">
        {/* Project Header Pill */}
        {currentProject ? (
          <div className="mb-4 px-3 py-2.5 bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/80 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Active Project</div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight">{currentProject.name}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Key: {currentProject.key}</div>
          </div>
        ) : (
          <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            No active project selected.
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs border border-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Plan Status Pill (Admin Only) or Clean Role Pill for Employees */}
      {currentWorkspace && (
        <div className="px-3.5 py-3 border-t border-slate-100">
          {isAdmin ? (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/70 p-3 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs sm:text-sm font-bold text-indigo-950 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="capitalize">{currentWorkspace.plan || 'Free'} Plan</span>
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {currentWorkspace.plan === 'enterprise'
                  ? 'Unlimited projects & members'
                  : `${currentWorkspace.max_members || 5} members max • ${currentWorkspace.max_projects || 3} projects`}
              </p>
              {currentWorkspace.plan !== 'enterprise' && (
                <button
                  onClick={() => handleNavClick('billing')}
                  className="mt-2.5 w-full text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          ) : (
            <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 capitalize">{userRole}</span>
              <span className="text-slate-400 truncate max-w-[110px]">{currentWorkspace.name}</span>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-56 lg:w-60 bg-white border-r border-slate-200 flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] select-none">
        {sidebarContent}
      </aside>

      {/* 2. Mobile & Tablet Slide-in Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Top Header with Close Icon */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-indigo-600 font-bold text-base">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <span>AgilePlatform</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
