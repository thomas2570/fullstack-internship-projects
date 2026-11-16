import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Check,
  AlertCircle,
  Copy,
  Clock,
  Send,
  RefreshCw
} from 'lucide-react';

export default function TeamMembersView() {
  const { currentWorkspace, isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (currentWorkspace) {
      fetchMembersAndInvitations();
    }
  }, [currentWorkspace]);

  const fetchMembersAndInvitations = async () => {
    setLoading(true);
    try {
      const [membersRes, invRes] = await Promise.all([
        client.get('/api/workspaces/members/'),
        client.get('/api/workspaces/invitations/').catch(() => ({ data: [] })),
      ]);
      setMembers(membersRes.data.results || membersRes.data || []);
      setInvitations(invRes.data.results || invRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    setStatusMessage(null);
    try {
      await client.post('/api/workspaces/invite/', {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setStatusMessage({
        type: 'success',
        text: `Invitation email sent successfully to ${inviteEmail}!`,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      await fetchMembersAndInvitations();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to send invitation.',
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    if (!window.confirm('Revoke this invitation?')) return;
    try {
      await client.delete(`/api/workspaces/invitations/${invitationId}/revoke/`);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await client.patch(`/api/workspaces/members/${memberId}/`, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update member role.');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-28">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Team Members</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your team members and roles in {currentWorkspace?.name}.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setShowInviteModal(true);
              setStatusMessage(null);
            }}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Success / Error Notification */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2 font-semibold">
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold ml-2">✕</button>
        </div>
      )}

      {/* 1. Active Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Active Members ({members.length} / {currentWorkspace?.max_members || 5} seats)
          </h4>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className="p-3 sm:p-4 px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200">
                  {m.user.display_name?.charAt(0) || 'U'}
                </div>

                <div>
                  <div className="font-semibold text-sm text-slate-800">{m.user.display_name}</div>
                  <div className="text-xs text-slate-400">{m.user.email} • {m.user.job_title}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {m.role === 'owner' ? (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-100 text-purple-700">
                    Workspace Owner
                  </span>
                ) : !isAdmin ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    {m.role}
                  </span>
                ) : (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Pending Invitations Table (Admin Only) */}
      {isAdmin && invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending Invitations ({invitations.length})</span>
            </h4>
          </div>

          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-xs border border-amber-200">
                    <Mail className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="font-semibold text-sm text-slate-800">{inv.email}</div>
                    <div className="text-xs text-slate-400">
                      Invited as <span className="capitalize font-medium text-slate-600">{inv.role}</span> • Email sent
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleRevokeInvitation(inv.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Cancel invitation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Role Permission</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="member">Member (Can create, move, and edit issues)</option>
                  <option value="admin">Admin (Can configure workflows, webhooks, and billing)</option>
                  <option value="viewer">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  disabled={sendingInvite}
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  {sendingInvite ? (
                    <span>Sending email...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
