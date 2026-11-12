import React from 'react';
import { FileText, ShieldCheck, CheckCircle2, Award, DollarSign } from 'lucide-react';

export const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-semibold text-indigo-300">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Academic Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-400">
          Last revised: October 2026 • Governing student enrollments, instructor studio, and certifications
        </p>
      </div>

      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            1. Student Enrollment & Lifetime Access
          </h2>
          <p>
            When you enroll in an EduFlow course (free or paid), you receive a revocable, non-exclusive, non-transferable lifetime license to view and access the course curriculum, video lessons, and learning resources across supported devices for personal, non-commercial education.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            2. Academic Integrity & Certificates
          </h2>
          <p>
            Certificates of Completion are granted only to students who have legitimately completed 100% of the course curriculum and achieved a score of 70% or greater on required assessments. Attempting to bypass quizzes or tamper with cryptographic verification URLs will result in immediate certificate invalidation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-400" />
            3. Instructor Terms & 70/30 Revenue Split
          </h2>
          <p>
            Instructors retain all intellectual property rights to their uploaded course materials and videos. For every course sold, instructors receive 70% of the net transaction revenue, while EduFlow retains 30% to support video transcoding compute, global CDN bandwidth, and platform infrastructure. Payout requests are processed transparently via the instructor studio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            4. 30-Day Satisfaction Guarantee
          </h2>
          <p>
            Paid courses come with a 30-day refund policy if you are not fully satisfied with the course material, provided less than 50% of the curriculum has been consumed and no certificate has been generated.
          </p>
        </section>
      </div>
    </div>
  );
};

