import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { fetchInstructorStats, submitPayoutRequest } from '../features/instructorSlice';
import {
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  Video,
  Upload,
  Radio,
  CheckCircle,
  CreditCard,
  Cloud
} from 'lucide-react';

export const InstructorDashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, coursePerformance, recentTransactions, monthlyChartData } = useSelector(
    (state) => state.instructor
  );
  const { user } = useSelector((state) => state.auth);

  // Modals & form states
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'courses' | 'upload' | 'live'
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  // Course creation state
  const [newCourse, setNewCourse] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Web Development',
    level: 'Intermediate',
    price: 49,
  });
  const [courseCreatedMsg, setCourseCreatedMsg] = useState('');

  // Video upload state (FFmpeg + BullMQ)
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [sectionTitle, setSectionTitle] = useState('Module 1: Foundations');
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transcodingState, setTranscodingState] = useState(null); // { lessonId, progress, status, streamingUrl }

  // Schedule live class state
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDesc, setLiveDesc] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [liveDuration, setLiveDuration] = useState(60);
  const [liveScheduleSuccess, setLiveScheduleSuccess] = useState('');

  useEffect(() => {
    dispatch(fetchInstructorStats());

    // Listen for live video transcoding progress from BullMQ worker via Socket.IO
    const socketEndpoint = import.meta.env.VITE_API_BASE_URL || '/';
    const socket = io(socketEndpoint, { transports: ['websocket', 'polling'] });
    socket.on('transcode-progress', (data) => {
      setTranscodingState((prev) => ({
        ...prev,
        lessonId: data.lessonId,
        progress: data.progress,
        status: data.status,
        streamingUrl: data.streamingUrl || prev?.streamingUrl,
        error: data.error,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  // Set default selected course for upload
  useEffect(() => {
    if (coursePerformance && coursePerformance.length > 0 && !selectedCourseId) {
      setSelectedCourseId(coursePerformance[0]._id);
    }
  }, [coursePerformance, selectedCourseId]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/courses', newCourse);
      setCourseCreatedMsg(`Course "${res.data.course.title}" created successfully!`);
      dispatch(fetchInstructorStats());
      setNewCourse({
        title: '',
        subtitle: '',
        description: '',
        category: 'Web Development',
        level: 'Intermediate',
        price: 49,
      });
      setTimeout(() => setCourseCreatedMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !lessonTitle || !videoFile) return;

    try {
      setUploading(true);
      setTranscodingState({ progress: 0, status: 'uploading' });

      // 1. Create Lesson record
      const lessonRes = await api.post('/lessons', {
        courseId: selectedCourseId,
        title: lessonTitle,
        sectionTitle,
        contentType: 'video',
      });
      const createdLessonId = lessonRes.data.lesson._id;

      // 2. Upload video file to server (triggers BullMQ transcoding worker)
      const formData = new FormData();
      formData.append('video', videoFile);

      const uploadRes = await api.post(`/lessons/${createdLessonId}/upload-video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setTranscodingState({ progress: percent, status: 'uploading' });
        },
      });

      setTranscodingState({
        lessonId: createdLessonId,
        progress: 5,
        status: 'processing',
      });

      setLessonTitle('');
      setVideoFile(null);
    } catch (err) {
      setTranscodingState({
        status: 'failed',
        error: err.response?.data?.message || err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleScheduleLive = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !liveTitle) return;

    try {
      const res = await api.post('/live/schedule', {
        courseId: selectedCourseId,
        title: liveTitle,
        description: liveDesc,
        scheduledStartTime: liveDate || new Date(),
        scheduledDurationMinutes: liveDuration,
      });

      setLiveScheduleSuccess(`Live class scheduled! Room ID: ${res.data.session.roomId}`);
      setLiveTitle('');
      setLiveDesc('');
      setTimeout(() => setLiveScheduleSuccess(''), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);
    if (!amountNum || amountNum < 10) return;

    try {
      await dispatch(
        submitPayoutRequest({
          amount: amountNum,
          payoutMethod,
          accountDetails: payoutAccount || user?.email,
        })
      ).unwrap();

      setPayoutSuccessMsg(`Payout request for $${amountNum} submitted successfully!`);
      setPayoutAmount('');
      setPayoutModalOpen(false);
      dispatch(fetchInstructorStats());
      setTimeout(() => setPayoutSuccessMsg(''), 5000);
    } catch (err) {
      alert(err || 'Payout request failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Instructor Revenue & Studio Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Instructor Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your published courses, video lesson uploads, live masterclasses, and revenue analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPayoutModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <DollarSign className="w-4 h-4" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {payoutSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {/* Financial Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Gross Revenue */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ${stats.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500">100% total student enrollment sales</div>
        </div>

        {/* Card 2: Net Earnings (70%) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-emerald-400">Net Earnings (70%)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${stats.netEarnings?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-emerald-500/80">Credited directly to instructor account</div>
        </div>

        {/* Card 3: Pending Payout Balance */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Available Balance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300">
            ${stats.pendingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500">Ready for instant withdrawal</div>
        </div>

        {/* Card 4: Total Active Students */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Learners</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalStudents || 0}
          </div>
          <div className="text-[11px] text-slate-500">Across {stats.totalCourses || 0} published courses</div>
        </div>
      </div>

      {/* Navigation Tabs (Swipeable on mobile with hidden scrollbar) */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5">
        {[
          { id: 'overview', label: 'Revenue Analytics', icon: TrendingUp },
          { id: 'courses', label: 'Create Course', icon: BookOpen },
          { id: 'upload', label: 'Upload Video Lesson', icon: Upload },
          { id: 'live', label: 'Schedule Live Class', icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REVENUE OVERVIEW & CHART */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Monthly Revenue Chart Graphic */}
          <div className="p-5 sm:p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Monthly Revenue & Earnings</h3>
                <p className="text-xs text-slate-400">Breakdown of gross sales and your 70% share</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-3 h-3 rounded bg-indigo-500" /> Gross Revenue
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded bg-emerald-500" /> Net Earnings (70%)
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-64 flex items-end gap-3 pt-6 border-b border-slate-800">
              {monthlyChartData.map((item, idx) => {
                const maxVal = Math.max(...monthlyChartData.map((m) => m.revenue), 100);
                const revHeight = Math.max(12, Math.round((item.revenue / maxVal) * 200));
                const earnHeight = Math.max(8, Math.round((item.earnings / maxVal) * 200));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      ${item.revenue}
                    </div>
                    <div className="w-full flex justify-center items-end gap-1.5">
                      <div
                        className="w-1/2 bg-indigo-500/80 group-hover:bg-indigo-400 rounded-t-lg transition-all"
                        style={{ height: `${revHeight}px` }}
                        title={`Gross: $${item.revenue}`}
                      />
                      <div
                        className="w-1/2 bg-emerald-500/80 group-hover:bg-emerald-400 rounded-t-lg transition-all"
                        style={{ height: `${earnHeight}px` }}
                        title={`Net: $${item.earnings}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 mt-2">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Course Performance Table */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Course Performance Breakdown</h3>
              <p className="text-xs text-slate-400">Enrollment numbers and earnings by course</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-6">Course</th>
                    <th className="py-3 px-6">Price</th>
                    <th className="py-3 px-6">Students</th>
                    <th className="py-3 px-6">Rating</th>
                    <th className="py-3 px-6">Total Sales</th>
                    <th className="py-3 px-6 text-emerald-400">Your Earnings (70%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {coursePerformance.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/30">
                      <td className="py-4 px-6 font-semibold text-white flex items-center gap-3">
                        <img src={c.thumbnail} alt="" className="w-10 h-6 rounded object-cover" />
                        <span className="truncate max-w-xs">{c.title}</span>
                      </td>
                      <td className="py-4 px-6">${c.price}</td>
                      <td className="py-4 px-6">{c.enrolledCount}</td>
                      <td className="py-4 px-6">★ {c.averageRating}</td>
                      <td className="py-4 px-6 font-semibold">${c.totalRevenue?.toFixed(2) || '0.00'}</td>
                      <td className="py-4 px-6 font-bold text-emerald-400">
                        ${c.instructorRevenue?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Sales Transactions */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Live student purchases credited to your balance</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-6">Student</th>
                    <th className="py-3 px-6">Course</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6 text-emerald-400">Your Share</th>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-6 font-medium text-white flex items-center gap-2">
                        <img
                          src={tx.student?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{tx.student?.name || 'Student'}</span>
                      </td>
                      <td className="py-3 px-6 truncate max-w-xs">{tx.course?.title}</td>
                      <td className="py-3 px-6 font-medium">${tx.amount}</td>
                      <td className="py-3 px-6 font-bold text-emerald-400">+${tx.instructorEarnings}</td>
                      <td className="py-3 px-6 text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE CREATION */}
      {activeTab === 'courses' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-8 shadow-xl space-y-5 sm:space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Create a New Course</h2>
            <p className="text-xs text-slate-400 mt-1">
              Publish on-demand video curriculum with adaptive HLS delivery
            </p>
          </div>

          {courseCreatedMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{courseCreatedMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Course Title</label>
              <input
                type="text"
                required
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder="e.g. Modern Full-Stack Web Architecture & Cloud Systems"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Subtitle / Tagline</label>
              <input
                type="text"
                value={newCourse.subtitle}
                onChange={(e) => setNewCourse({ ...newCourse, subtitle: e.target.value })}
                placeholder="A hands-on engineering guide to building scalable streaming backends"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Full Description</label>
              <textarea
                required
                rows={4}
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="Detailed curriculum overview, architecture highlights, and outcomes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="DevOps & Architecture">DevOps & Architecture</option>
                  <option value="Data Science & AI">Data Science & AI</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Level</label>
                <select
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Price ($ USD)</label>
                <input
                  type="number"
                  min={0}
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Publish Course to Catalog
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: VIDEO UPLOAD & FFMPEG TRANSCODING PIPELINE */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-8 shadow-xl space-y-5 sm:space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-2">
              <Cloud className="w-3.5 h-3.5" />
              <span>Automated Video Processing</span>
            </div>
            <h2 className="text-xl font-bold text-white">Upload Lesson Video</h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload MP4 or WebM videos. Our automated system encodes the video into optimized high-definition streaming formats for seamless playback across all learner devices.
            </p>
          </div>

          <form onSubmit={handleVideoUpload} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Select Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                {coursePerformance.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Lesson Title</label>
              <input
                type="text"
                required
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g. 2.1 Asynchronous Architecture & Queue Scaling"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Section / Module Name</label>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="e.g. Module 2: Background Processing"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Drag & Drop File Upload Area */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Video File (MP4, WebM)</label>
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  required
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="hidden"
                  id="video-file-input"
                />
                <label htmlFor="video-file-input" className="cursor-pointer block">
                  <Video className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-white">
                    {videoFile ? videoFile.name : 'Click to select video file'}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Auto-optimizes into high-definition multi-bitrate streams
                  </div>
                </label>
              </div>
            </div>

            {/* Live Progress Bar */}
            {transcodingState && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    {transcodingState.status === 'uploading' && 'Uploading video file...'}
                    {transcodingState.status === 'processing' && 'Optimizing video for multi-device streaming...'}
                    {transcodingState.status === 'ready' && 'Video Optimization Complete! Stream Ready.'}
                    {transcodingState.status === 'failed' && 'Video processing encountered an issue.'}
                  </span>
                  <span className="font-mono text-indigo-400">{transcodingState.progress}%</span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      transcodingState.status === 'ready'
                        ? 'bg-emerald-500'
                        : transcodingState.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${transcodingState.progress}%` }}
                  />
                </div>

                {transcodingState.streamingUrl && (
                  <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium truncate">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Stream Ready: High-definition adaptive video generated</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading & Processing Video...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Process Video Lesson</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: SCHEDULE LIVE CLASS */}
      {activeTab === 'live' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-8 shadow-xl space-y-5 sm:space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold mb-2">
              <Radio className="w-3.5 h-3.5" />
              <span>Interactive Virtual Classroom</span>
            </div>
            <h2 className="text-xl font-bold text-white">Schedule Live Virtual Class</h2>
            <p className="text-xs text-slate-400 mt-1">
              Host live video sessions with interactive screen share, raised hand indicators, and room chat
            </p>
          </div>

          {liveScheduleSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{liveScheduleSuccess}</span>
            </div>
          )}

          <form onSubmit={handleScheduleLive} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Select Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                {coursePerformance.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Session Title</label>
              <input
                type="text"
                required
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder="e.g. Live Q&A: WebRTC Signaling Mesh & ICE Gathering"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Description & Agenda</label>
              <textarea
                rows={3}
                value={liveDesc}
                onChange={(e) => setLiveDesc(e.target.value)}
                placeholder="Topics covered, student prerequisites, and demo architecture..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={liveDate}
                  onChange={(e) => setLiveDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Duration (Minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={180}
                  value={liveDuration}
                  onChange={(e) => setLiveDuration(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all"
            >
              <Radio className="w-4 h-4" />
              <span>Generate Room ID & Schedule Live Class</span>
            </button>
          </form>
        </div>
      )}

      {/* Payout Request Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-xl font-bold text-white">Request Payout</h3>
              <p className="text-xs text-slate-400 mt-1">
                Available Pending Balance: <span className="font-bold text-emerald-400">${stats.pendingBalance || 0}</span>
              </p>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Amount ($ USD, Min $10)</label>
                <input
                  type="number"
                  min={10}
                  max={stats.pendingBalance || 1000}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="paypal">PayPal MassPay</option>
                  <option value="bank_transfer">ACH / Bank Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  {payoutMethod === 'paypal' ? 'PayPal Email' : 'Bank Account & Routing Number'}
                </label>
                <input
                  type="text"
                  required
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder={payoutMethod === 'paypal' ? 'instructor@example.com' : 'Bank details'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/40"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

