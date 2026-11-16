import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import BacklogView from './components/BacklogView';
import WorkflowSettings from './components/WorkflowSettings';
import AuditLogView from './components/AuditLogView';
import WebhooksView from './components/WebhooksView';
import BillingView from './components/BillingView';
import TeamMembersView from './components/TeamMembersView';
import IssueDetailModal from './components/IssueDetailModal';
import CreateIssueModal from './components/CreateIssueModal';
import CreateProjectModal from './components/CreateProjectModal';
import CreateWorkspaceModal from './components/CreateWorkspaceModal';
import Login from './components/Login';
import Register from './components/Register';
import AcceptInvitePage from './components/AcceptInvitePage';

function MainApp() {
  const { user, loading, isAdmin } = useAuth();

  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'backlog' | 'workflows' | 'audit' | 'webhooks' | 'billing' | 'team'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If a non-admin user lands on an admin tab, fallback to board
  React.useEffect(() => {
    if (!isAdmin && ['billing', 'webhooks', 'workflows', 'audit'].includes(activeTab)) {
      setActiveTab('board');
    }
  }, [isAdmin, activeTab]);

  // Modals
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if opening invitation URL
  const path = window.location.pathname;
  if (path.startsWith('/invite/')) {
    const inviteToken = path.split('/invite/')[1]?.replace('/', '');
    return <AcceptInvitePage token={inviteToken} onAccepted={() => window.location.href = '/'} />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400">Loading Workspace Security Context...</p>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F4F5F7]">
      {/* Top Navbar */}
      <Navbar
        onOpenCreateIssue={() => setShowCreateIssue(true)}
        onOpenCreateProject={() => setShowCreateProject(true)}
        onOpenCreateWorkspace={() => setShowCreateWorkspace(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 overflow-hidden relative min-h-0 flex flex-col">
          {activeTab === 'board' && (
            <KanbanBoard
              key={`board-${refreshKey}`}
              onSelectIssue={(issue) => setSelectedIssue(issue)}
              onOpenCreateIssue={() => setShowCreateIssue(true)}
            />
          )}

          {activeTab === 'backlog' && (
            <BacklogView
              key={`backlog-${refreshKey}`}
              onSelectIssue={(issue) => setSelectedIssue(issue)}
              onOpenCreateIssue={() => setShowCreateIssue(true)}
            />
          )}

          {activeTab === 'workflows' && <WorkflowSettings />}

          {activeTab === 'audit' && <AuditLogView key={`audit-${refreshKey}`} />}

          {activeTab === 'webhooks' && <WebhooksView />}

          {activeTab === 'billing' && <BillingView />}

          {activeTab === 'team' && <TeamMembersView />}
        </main>
      </div>

      {/* Global Modals */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdated={() => {
            setSelectedIssue(null);
            setRefreshKey((k) => k + 1);
          }}
          onDeleted={() => {
            setSelectedIssue(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {showCreateIssue && (
        <CreateIssueModal
          onClose={() => setShowCreateIssue(false)}
          onCreated={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreated={() => {
            setActiveTab('board');
          }}
        />
      )}

      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onCreated={() => {
            setActiveTab('board');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
