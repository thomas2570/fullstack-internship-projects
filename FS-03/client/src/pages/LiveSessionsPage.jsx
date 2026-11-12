import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import {
  Radio,
  Video,
  Clock,
  Calendar,
  Plus
} from 'lucide-react';

export const LiveSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/live');
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Real-Time Interactive Learning</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Live Interactive Masterclasses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Join scheduled instructor masterclasses with real-time audio/video, interactive screen sharing, and collaborative discussions
          </p>
        </div>

        {/* Action: Instructor can schedule new live class */}
        {(user?.role === 'instructor' || user?.role === 'admin') && (
          <Link
            to="/instructor/dashboard"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Live Class</span>
          </Link>
        )}
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Fetching live schedule...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Radio className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No live sessions scheduled</h3>
          <p className="text-xs text-slate-500 mt-1">Check back later or explore our on-demand course catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session) => {
            const isLiveNow = session.status === 'live';
            const startTime = new Date(session.scheduledStartTime);

            return (
              <div
                key={session._id}
                className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 sm:p-6 md:p-8 flex flex-col justify-between shadow-xl transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isLiveNow
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      }`}
                    >
                      {isLiveNow ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>LIVE NOW</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>SCHEDULED</span>
                        </>
                      )}
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      Room: {session.roomId}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white leading-snug">
                    {session.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {session.description || 'Hands-on live engineering session with Q&A and code reviews.'}
                  </p>

                  {/* Metadata */}
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <img
                        src={session.instructor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={session.instructor?.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-200">{session.instructor?.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{session.scheduledDurationMinutes} mins</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Course: <span className="text-indigo-400 font-semibold">{session.course?.title || 'Advanced Systems'}</span>
                  </div>

                  <Link
                    to={`/live/${session.roomId}`}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isLiveNow
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 hover:scale-105'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>{isLiveNow ? 'Enter Live Room' : 'Join Early / Test Media'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

