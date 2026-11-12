import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Globe2,
  CheckCircle,
  Video,
  Send
} from 'lucide-react';

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 4-column balanced grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
                EduFlow Academy
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              A premier online education platform empowering students and professionals worldwide to master in-demand skills through interactive masterclasses and verified credentials.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to="/verify-certificate/EDF-2026-A88090EE"
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 flex items-center gap-1 hover:border-indigo-600 transition-colors"
              >
                <Award className="w-3 h-3 text-indigo-400" /> Verified Credentials
              </Link>
              <Link
                to="/live"
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/40 flex items-center gap-1 hover:border-rose-600 transition-colors"
              >
                <Video className="w-3 h-3 text-rose-400" /> Live Masterclasses
              </Link>
            </div>
          </div>

          {/* Column 2: Learning Tracks */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Learning Tracks</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/courses" className="hover:text-indigo-400 transition-colors">
                  Web & Software Engineering
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-indigo-400 transition-colors">
                  Cloud Architecture & DevOps
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-indigo-400 transition-colors">
                  Data Science & Machine Learning
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-indigo-400 transition-colors">
                  UI/UX & Product Design Systems
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-indigo-400 transition-colors">
                  Cybersecurity & Infrastructure
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Explore & Company</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/about" className="hover:text-indigo-400 transition-colors">
                  About EduFlow Academy
                </Link>
              </li>
              <li>
                <Link to="/teach" className="hover:text-emerald-400 transition-colors font-semibold flex items-center gap-1">
                  <span>Teach on EduFlow (70% Share)</span>
                </Link>
              </li>
              <li>
                <Link to="/register/instructor" className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-slate-400">
                  <span>Instructor Registration</span>
                </Link>
              </li>
              <li>
                <Link to="/register/student" className="hover:text-indigo-400 transition-colors flex items-center gap-1 text-slate-400">
                  <span>Student Registration</span>
                </Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span>Live Interactive Classes</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-indigo-400 transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/verify-certificate/EDF-2026-A88090EE" className="hover:text-indigo-400 transition-colors">
                  Credential Verification
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-indigo-400 transition-colors">
                  Help Center & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Quality Standards */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Stay Connected</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get notified of new masterclass schedules, course launches, and academic insights.
            </p>

            {subscribed ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Subscribed! Check your inbox soon.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    title="Subscribe"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Digital Authenticity</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Global Multi-Device Streaming</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 EduFlow Academy. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacy" className="hover:text-indigo-400 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-indigo-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
