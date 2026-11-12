import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Shield,
  CheckCircle,
  Check,
  X
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, payoutsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/payouts'),
      ]);
      setStats(statsRes.data.stats);
      setPayouts(payoutsRes.data.payouts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayout = async (payoutId, status) => {
    try {
      await api.put(`/admin/payouts/${payoutId}`, {
        status,
        adminNotes: `Updated to ${status} by administrator on ${new Date().toLocaleDateString()}`,
      });
      setActionMsg(`Payout status updated to ${status}.`);
      fetchAdminData();
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payout');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading platform administration overview...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Platform Governance & Audit</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Administration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review ecosystem metrics, platform revenue, and approve instructor payout disbursements
        </p>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Platform Revenue</span>
            <div className="text-2xl font-black text-white">${stats.totalPlatformRevenue?.toFixed(2) || '0.00'}</div>
            <div className="text-[11px] text-slate-500">Gross student transactions</div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-xl space-y-1">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Platform 30% Margin</span>
            <div className="text-2xl font-black text-indigo-400">${stats.totalPlatformFees?.toFixed(2) || '0.00'}</div>
            <div className="text-[11px] text-slate-500">Retained academy infrastructure fee</div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-1">
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Instructor Disbursed (70%)</span>
            <div className="text-2xl font-black text-emerald-400">${stats.totalInstructorPayouts?.toFixed(2) || '0.00'}</div>
            <div className="text-[11px] text-slate-500">Allocated to course creators</div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Platform Users</span>
            <div className="text-2xl font-black text-white">{stats.totalUsers || 0}</div>
            <div className="text-[11px] text-slate-500">{stats.totalStudents} Students • {stats.totalInstructors} Instructors</div>
          </div>
        </div>
      )}

      {/* Payout Approval Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Instructor Payout Requests</h3>
            <p className="text-xs text-slate-400">Review pending withdrawals and approve transfer batches</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300 w-fit">
            {payouts.length} Total Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Instructor</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6">Account Details</th>
                <th className="py-3 px-6">Requested At</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {payouts.map((po) => (
                <tr key={po._id} className="hover:bg-slate-800/30">
                  <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                    <img
                      src={po.instructor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div>
                      <div>{po.instructor?.name || 'Instructor'}</div>
                      <div className="text-[10px] text-slate-500">{po.instructor?.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-emerald-400 text-sm">
                    ${po.amount.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 uppercase tracking-wider font-semibold">
                    {po.payoutMethod}
                  </td>
                  <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                    {po.accountDetails}
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    {new Date(po.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        po.status === 'processed' || po.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : po.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {po.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdatePayout(po._id, 'approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 transition-colors"
                          title="Approve payout"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdatePayout(po._id, 'rejected')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 transition-colors"
                          title="Reject payout"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

