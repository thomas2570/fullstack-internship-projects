import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Target,
  Compass
} from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Banner */}
      <section className="relative pt-12 sm:pt-16 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-5 sm:space-y-6">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Empowering the Next Generation of{' '}
          <span className="text-indigo-400">
            Global Tech Leaders
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          EduFlow Academy is a premier learning institution dedicated to closing the global engineering skills gap through immersive video curricula, interactive live masterclasses, and verified digital certifications.
        </p>

        {/* Key Academy Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-8 sm:pt-10 max-w-4xl mx-auto border-t border-slate-800">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white">45,000+</div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Students Enrolled</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-indigo-400">190+</div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Countries Represented</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">12,400+</div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Certificates Awarded</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">94%</div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Career Growth Rate</div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            What Drives Us
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Our Core Principles
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Practical Over Theoretical</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every course is built around production-ready projects, real-world case studies, and live architectural problem-solving instead of passive memorization.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-violet-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-violet-950/80 border border-violet-700/50 flex items-center justify-center text-violet-400">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Industry-Led Mentorship</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our instructors are senior engineers, principal architects, and engineering leaders who have built scalable systems at leading global technology companies.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Verified Credibility</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Certificates awarded by EduFlow are verifiable through dedicated public verification URLs and QR codes, ensuring hiring managers can authenticate your credentials.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-600 to-violet-700 p-6 sm:p-10 md:p-14 text-center text-white space-y-5 sm:space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto">
            Explore our catalog of hands-on courses, join live interactive masterclasses, and earn recognized certifications.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              to="/courses"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-indigo-900 font-extrabold text-sm shadow-xl hover:bg-indigo-50 transition-all hover:scale-105 inline-block"
            >
              Browse Course Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

