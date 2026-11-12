import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  Video,
  ArrowRight
} from 'lucide-react';

export const TeachPage = () => {
  const [coursePrice, setCoursePrice] = useState(49);
  const [studentEstimate, setStudentEstimate] = useState(500);

  // 70% share for instructor
  const grossRevenue = coursePrice * studentEstimate;
  const instructorEarnings = Math.round(grossRevenue * 0.7);

  return (
    <div className="space-y-20 pb-24">
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-5 sm:space-y-6">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Share Your Expertise and{' '}
          <span className="text-emerald-400">
            Earn 70% of Every Sale
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Join leading software engineers, cloud architects, and designers teaching global learners. We provide the automated video streaming engine, live interactive classrooms, and payment infrastructure so you can focus on teaching.
        </p>

        <div className="pt-2 sm:pt-4 flex justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-900/40 transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>Start Teaching Today</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Interactive Revenue Calculator */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-5 sm:p-8 md:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Estimate Your Potential Earnings
            </h2>
            <p className="text-xs text-slate-400">
              Calculate how much you could earn with our transparent 70% instructor revenue model
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>Course Price</span>
                  <span className="font-bold text-emerald-400 text-sm">${coursePrice} USD</span>
                </div>
                <input
                  type="range"
                  min="19"
                  max="199"
                  step="5"
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>Estimated Students</span>
                  <span className="font-bold text-indigo-400 text-sm">{studentEstimate} learners</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2500"
                  step="50"
                  value={studentEstimate}
                  onChange={(e) => setStudentEstimate(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center space-y-3">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Your Estimated Net Payout
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-400">
                ${instructorEarnings.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">
                Based on ${grossRevenue.toLocaleString()} gross sales (70% instructor / 30% platform fee)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Teach on EduFlow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Instructor Advantages
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Everything You Need to Succeed
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 flex items-center justify-center text-indigo-400">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Automated Video Optimization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your video lessons once. Our automated cloud processing system converts them into optimized high-definition streaming formats for all devices.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 flex items-center justify-center text-rose-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Live Virtual Classrooms</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Host scheduled live workshops with zero setup. Screen share code, answer live audio/video questions, and engage students directly.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Fast & Transparent Payouts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track revenue in real time on your instructor studio dashboard. Submit one-click payout requests via PayPal or direct bank transfer.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

