import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layers, CheckCircle, AlertCircle, ArrowRight, Lock, User, Mail, ShieldCheck } from 'lucide-react';

export default function AcceptInvitePage({ token, onAccepted }) {
  const { user } = useAuth();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  // Form states for unauthenticated users
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  // 1. Fetch invitation details on page load
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await client.get(`/api/workspaces/invitations/${token}/`);
        setInvite(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'This invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  // 2. Handle accepting invitation
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {};
    if (!user) {
      payload.password = password;
      if (!invite?.user_exists) {
        payload.first_name = firstName;
        payload.last_name = lastName;
      }
    }

    try {
      const res = await client.post(`/api/workspaces/invitations/${token}/accept/`, payload);
      
      // Store session tokens returned by server
      if (res.data.access) {
        localStorage.setItem('access_token', res.data.access);
      }
      if (res.data.refresh) {
        localStorage.setItem('refresh_token', res.data.refresh);
      }
      if (res.data.workspace_id) {
        localStorage.setItem('active_workspace_id', res.data.workspace_id);
      }

      setStatus(res.data.message || 'Successfully joined workspace!');
      setTimeout(() => {
        if (onAccepted) onAccepted();
        window.location.href = '/';
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept invitation. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-4">
        <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Verifying invitation security token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-indigo-600/20">
          <Layers className="w-6 h-6" />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {invite ? `Join ${invite.workspace_name}` : 'Workspace Invitation'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {invite ? (
              <>
                <strong className="text-slate-700">{invite.inviter_name}</strong> invited you to collaborate as a{' '}
                <span className="font-semibold text-indigo-600 capitalize">{invite.role}</span>.
              </>
            ) : (
              'AgilePlatform Workspace Invitation'
            )}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {status && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-center space-x-2 font-semibold animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{status}</span>
          </div>
        )}

        {/* Content Body */}
        {!status && invite && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If user is already authenticated */}
            {user ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Signed in as <strong className="text-slate-800">{user.email}</strong>
                </span>
              </div>
            ) : (
              /* If user is NOT authenticated */
              <div className="space-y-3">
                {/* Invited Email (Read Only) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Invited Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      disabled
                      value={invite.email}
                      className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-slate-600 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* If New User: First & Last Name */}
                {!invite.user_exists && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Password field */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {invite.user_exists ? 'Enter your account password' : 'Create a secure password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {!invite.user_exists && (
                    <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters.</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
            >
              <span>
                {submitting
                  ? 'Joining Workspace...'
                  : user
                  ? `Accept Invitation & Join ${invite.workspace_name}`
                  : invite.user_exists
                  ? `Sign In & Join ${invite.workspace_name}`
                  : `Create Account & Join ${invite.workspace_name}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
