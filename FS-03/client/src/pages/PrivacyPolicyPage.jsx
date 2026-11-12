import React from 'react';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

export const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-semibold text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Data Protection & Trust</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400">
          Last updated: October 2026 • Effective across all EduFlow services worldwide
        </p>
      </div>

      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            1. Information We Collect
          </h2>
          <p>
            When you register an account, enroll in courses, or participate in live masterclasses, we collect essential account details including your name, email address, chosen password (securely hashed with industry-standard bcrypt algorithms), and selected academic profile preferences.
          </p>
          <p>
            For instructors, we collect public instructor profiles, bios, and payment payout preferences to process course revenue distributions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            2. How We Use Your Data
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-400">
            <li>To provide personalized course progress tracking and resume points across devices.</li>
            <li>To generate and cryptographically authenticate your verifiable completion certificates.</li>
            <li>To facilitate real-time WebRTC audio/video signaling and chat in live masterclasses.</li>
            <li>To process course purchases and compute transparent 70/30 instructor revenue payouts.</li>
            <li>We do not sell, rent, or monetize your personal information to third-party advertisers.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            3. Security & Cryptographic Integrity
          </h2>
          <p>
            All network communication with EduFlow is encrypted using TLS/HTTPS. Certificates issued upon course completion are backed by SHA-256 HMAC digital signatures to guarantee that credentials cannot be altered or forged.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            4. Your Rights & Data Ownership
          </h2>
          <p>
            You have full ownership of your learning data. You may request account deletion, data export, or update your academic profile at any time directly through your dashboard settings or by contacting our data protection desk at privacy@eduflow.com.
          </p>
        </section>
      </div>
    </div>
  );
};

