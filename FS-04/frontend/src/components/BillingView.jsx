import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Check, Sparkles, Shield, ArrowUpRight, Receipt, AlertCircle } from 'lucide-react';

export default function BillingView() {
  const { currentWorkspace, refreshWorkspaces } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [message, setMessage] = useState(null);
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('billing_currency') || 'USD';
  });

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('billing_currency', newCurrency);
  };

  const formatPrice = (plan) => {
    if (!plan.price_cents || plan.price_cents === 0) return 'Free';
    if (currency === 'INR') {
      if (plan.slug === 'pro') return '₹999';
      if (plan.slug === 'enterprise') return '₹3,999';
      const inrAmount = Math.round((plan.price_cents / 100) * 85);
      return `₹${inrAmount.toLocaleString('en-IN')}`;
    }
    return plan.price_formatted || `$${(plan.price_cents / 100).toFixed(2)}`;
  };

  const formatInvoiceAmount = (inv) => {
    if (!inv.amount_paid_cents || inv.amount_paid_cents === 0) return '$0.00';
    if (currency === 'INR') {
      const inr = Math.round((inv.amount_paid_cents / 100) * 85);
      return `₹${inr.toLocaleString('en-IN')}.00`;
    }
    return inv.amount_formatted || `$${(inv.amount_paid_cents / 100).toFixed(2)}`;
  };

  useEffect(() => {
    if (currentWorkspace) {
      fetchBillingData();
    }
  }, [currentWorkspace]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        client.get('/api/billing/plans/'),
        client.get('/api/billing/subscription/'),
      ]);
      setPlans(plansRes.data.results || plansRes.data || []);
      setSubData(subRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planSlug) => {
    setUpgradingPlan(planSlug);
    setMessage(null);
    try {
      const res = await client.post('/api/billing/checkout/', {
        plan: planSlug,
        simulate: false,
      });

      if (res.data.simulated) {
        setMessage(`Success! Workspace upgraded to ${planSlug.toUpperCase()} tier.`);
        await refreshWorkspaces();
        await fetchBillingData();
      } else if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Upgrade failed.');
    } finally {
      setUpgradingPlan(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span>Subscription Plans & Resource Quotas</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage Stripe test billing, seat allocations, and project limits for {currentWorkspace?.name}.
          </p>
        </div>

        {/* Currency Switcher Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
          <button
            onClick={() => handleCurrencyChange('USD')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currency === 'USD'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>USD ($)</span>
          </button>
          <button
            onClick={() => handleCurrencyChange('INR')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currency === 'INR'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>INR (₹)</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Quota Usage Meters */}
      {subData && subData.quotas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Members Quota */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Team Seats</span>
              <span className="text-xs font-bold text-slate-800">
                {subData.quotas.members.current} / {subData.quotas.members.max}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (subData.quotas.members.current / subData.quotas.members.max) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Projects Quota */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Active Projects</span>
              <span className="text-xs font-bold text-slate-800">
                {subData.quotas.projects.current} / {subData.quotas.projects.max}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (subData.quotas.projects.current / subData.quotas.projects.max) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Issues per Project Limit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Issues Quota</span>
              <span className="text-xs font-bold text-slate-800">
                {subData.quotas.max_issues_per_project} / project
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Upgrade to Pro or Enterprise for up to unlimited capacity.
            </span>
          </div>
        </div>
      )}

      {/* Pricing Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = currentWorkspace?.plan === p.slug;
          return (
            <div
              key={p.slug}
              className={`rounded-2xl p-6 bg-white border flex flex-col justify-between transition-all relative ${
                isCurrent
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                  Current Plan
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>

                <div className="my-5">
                  <span className="text-3xl font-extrabold text-slate-900">{formatPrice(p)}</span>
                  {p.price_cents > 0 && <span className="text-xs text-slate-500"> / month</span>}
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                  {p.features?.map((f, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-400 cursor-default"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(p.slug)}
                    disabled={upgradingPlan === p.slug}
                    className="w-full py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>{upgradingPlan === p.slug ? 'Upgrading...' : `Switch to ${p.name}`}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoices History Table */}
      {subData && subData.invoices && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span>Billing Invoices & Receipts</span>
            </h4>
          </div>

          <div className="divide-y divide-slate-100">
            {subData.invoices.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No invoices generated yet.</div>
            ) : (
              subData.invoices.map((inv) => (
                <div key={inv.id} className="p-4 px-6 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <span className="font-mono font-semibold text-slate-800">{inv.stripe_invoice_id}</span>
                    <span className="text-slate-400 ml-2">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-900">{formatInvoiceAmount(inv)}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
