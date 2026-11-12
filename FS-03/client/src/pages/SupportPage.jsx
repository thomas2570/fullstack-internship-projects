import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Send
} from 'lucide-react';

export const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Course Enrollment & Access',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: 'Course Enrollment & Access', message: '' });
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div className="space-y-16 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          How Can We Help You Today?
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Have questions about your enrollment, certificates, live masterclasses, or teaching on EduFlow Academy? Our academic support team is here to help.
        </p>
      </div>

      {/* Quick Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 flex items-center justify-center text-indigo-400 mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Email Support</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Send us your inquiry and our support team will respond within 12 hours.
          </p>
          <div className="text-xs font-mono font-semibold text-indigo-400 pt-1">
            support@eduflowacademy.com
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 flex items-center justify-center text-emerald-400 mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Live Masterclass Assistance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Troubleshooting for active live masterclasses, audio/video settings, and room access.
          </p>
          <div className="text-xs font-semibold text-emerald-400 pt-1">
            Active 24/7 during scheduled sessions
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-950 flex items-center justify-center text-amber-400 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Certificate Verification</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Recruiter and employer verification requests for student completion credentials.
          </p>
          <div className="text-xs font-semibold text-amber-400 pt-1">
            Instant via /verify-certificate/:id
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-8 md:p-10 shadow-2xl space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Send Us a Direct Message</h2>
          <p className="text-xs text-slate-400 mt-1">
            Fill out the form below and an academic support specialist will get back to you shortly.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Thank you! Your inquiry has been dispatched to our student support desk. We will respond via email shortly.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Inquiry Topic</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Course Enrollment & Access">Course Enrollment & Video Playback</option>
                <option value="Certificate Verification & Downloads">Certificate Verification & Downloads</option>
                <option value="Live Masterclass Assistance">Live Masterclass Audio/Video Room</option>
                <option value="Teaching & Instructor Partnerships">Teaching on EduFlow Academy & Payouts</option>
                <option value="Billing & Refunds">Billing, Receipts & Refunds</option>
                <option value="General Inquiry">General Question</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Your Message</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your question or issue in detail..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Submit Support Request</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

