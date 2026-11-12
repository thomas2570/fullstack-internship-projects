import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses, setFilters } from '../features/courseSlice';
import api from '../api/axios';
import {
  Play,
  Radio,
  Award,
  Cpu,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Users,
  Video,
  Clock,
  Star,
  ShieldCheck,
  ChevronRight,
  Code2,
  Layers,
  ChevronDown,
  Briefcase,
  TrendingUp
} from 'lucide-react';

const TRUSTED_COMPANIES = [
  { name: 'Google' },
  { name: 'Amazon' },
  { name: 'Microsoft' },
  { name: 'Meta' },
  { name: 'Netflix' },
  { name: 'Stripe' },
];

const CATEGORIES_SHOWCASE = [
  {
    title: 'Software & Web Development',
    count: '18 Courses',
    desc: 'Modern Full-Stack Engineering, Scalable Architectures, APIs & Reactive Applications',
    icon: Code2,
    gradient: 'from-blue-600/20 to-indigo-600/20',
    border: 'border-blue-500/30',
    tag: 'Web Development',
  },
  {
    title: 'Cloud Computing & DevOps',
    count: '12 Courses',
    desc: 'Enterprise Cloud Architectures, Container Orchestration, CI/CD & Reliability',
    icon: Cloud,
    gradient: 'from-cyan-600/20 to-blue-600/20',
    border: 'border-cyan-500/30',
    tag: 'Cloud Computing',
  },
  {
    title: 'Artificial Intelligence & Data',
    count: '15 Courses',
    desc: 'Machine Learning Models, Generative AI Systems, Neural Networks & Data Pipelines',
    icon: Cpu,
    gradient: 'from-violet-600/20 to-purple-600/20',
    border: 'border-violet-500/30',
    tag: 'Data Science & AI',
  },
  {
    title: 'UI/UX & Product Design',
    count: '10 Courses',
    desc: 'Design Systems, Interactive Prototyping, User Research & Design Tokens',
    icon: Layers,
    gradient: 'from-pink-600/20 to-rose-600/20',
    border: 'border-pink-500/30',
    tag: 'Design & UI/UX',
  },
  {
    title: 'Cybersecurity & Infrastructure',
    count: '8 Courses',
    desc: 'Application Security, Identity & Access Management, Cryptography & Network Defense',
    icon: ShieldCheck,
    gradient: 'from-emerald-600/20 to-teal-600/20',
    border: 'border-emerald-500/30',
    tag: 'DevOps & Architecture',
  },
  {
    title: 'Leadership & Engineering Management',
    count: '9 Courses',
    desc: 'Technical Strategy, Team Leadership, Agile Delivery & Modern System Design',
    icon: Briefcase,
    gradient: 'from-amber-600/20 to-orange-600/20',
    border: 'border-amber-500/30',
    tag: 'Web Development',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The live interactive masterclasses and structured hands-on projects gave me practical skills I could apply immediately. I transitioned into a Senior Systems Engineer role within 6 weeks of completing my certification.',
    author: 'Aarav Mehta',
    title: 'Senior Systems Engineer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    course: 'Full-Stack Architecture & Cloud Systems Specialization',
    rating: 5,
  },
  {
    quote:
      'The verifiable certificates gave my resume serious credibility. Recruiters verified my credentials directly on LinkedIn, and the hands-on assessments proved my practical capabilities beyond traditional theory.',
    author: 'Priya Sharma',
    title: 'Cloud Solutions Architect',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    course: 'Enterprise Cloud Architecture Masterclass',
    rating: 5,
  },
  {
    quote:
      'Teaching on EduFlow has been an incredible experience. The instructor studio gives me complete visibility into student progress and earnings, while the platform handles automated video optimization effortlessly.',
    author: 'David Chen',
    title: 'Principal Software Consultant & Lead Instructor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    course: 'Distributed Systems & Enterprise Microservices',
    rating: 5,
  },
];

const FAQS = [
  {
    q: 'How do EduFlow live classes work?',
    a: 'EduFlow live classes allow you to participate in real-time interactive masterclasses directly within your browser. You can engage with instructors through high-definition audio, video, desktop screen sharing, interactive live chat, and a raise-hand feature for live questions.',
  },
  {
    q: 'Can I learn on my own schedule?',
    a: 'Yes, absolutely. All video lessons, reading materials, quizzes, and course resources are available on-demand with lifetime access. Videos automatically adapt to your internet connection speed so you can learn smoothly on any desktop, tablet, or smartphone.',
  },
  {
    q: 'How do the verifiable completion certificates work?',
    a: 'Once you complete 100% of your course lessons and pass the final assessment with a score of 70% or higher, an official Certificate of Completion is generated for you. It includes a unique verification ID and QR code that employers and recruiters can verify in real-time.',
  },
  {
    q: 'How does teaching on EduFlow work for instructors?',
    a: 'Instructors can easily create courses, upload video lessons, schedule live masterclasses, and design quizzes. Our platform provides a comprehensive instructor dashboard with real-time revenue analytics, student enrollment metrics, and seamless payout requests.',
  },
];

export const HomePage = () => {
  const dispatch = useDispatch();
  const { items: courses } = useSelector((state) => state.courses);
  const [liveSessions, setLiveSessions] = useState([]);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    dispatch(fetchCourses());
    api
      .get('/live')
      .then((res) => setLiveSessions(res.data.sessions || []))
      .catch(() => {});
  }, [dispatch]);

  const activeLiveRoom = liveSessions.find((s) => s.status === 'live') || liveSessions[0];

  const handleCategoryClick = (categoryTag) => {
    dispatch(setFilters({ category: categoryTag }));
  };

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 sm:pb-24">
      {/* Hero Section */}
      <section className="relative pt-10 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Glow backdrop circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 to-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Advance Your Career with{' '}
            <span className="text-indigo-400">
              Expert-Led Courses
            </span>{' '}
            & Live Masterclasses
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of ambitious learners mastering in-demand skills in software engineering, cloud computing, AI, and design with industry-recognized certifications and interactive live workshops.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 pt-4 max-w-xs sm:max-w-none mx-auto">
            <Link
              to="/courses"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Explore All Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {activeLiveRoom ? (
              <Link
                to={`/live/${activeLiveRoom.roomId}`}
                className="px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all hover:scale-105 flex items-center justify-center gap-2.5 backdrop-blur-md"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span>Join Live Classroom</span>
              </Link>
            ) : (
              <Link
                to="/live"
                className="px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 text-rose-400" />
                <span>View Live Schedule</span>
              </Link>
            )}
          </div>

          {/* Social Proof Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 sm:pt-12 max-w-4xl mx-auto border-t border-slate-800/80">
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white">45,000+</div>
              <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Active Global Learners</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-400">100%</div>
              <div className="text-[11px] sm:text-xs text-slate-400 font-medium">On-Demand Course Access</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400">12,400+</div>
              <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Verified Certificates Issued</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400">4.9 / 5.0</div>
              <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Learner Satisfaction Score</div>
            </div>
          </div>
        </div>

        {/* Core Pillars Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-12 sm:mt-16">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">High-Definition Video</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Learn smoothly on any device with buffer-free, adaptive quality video playback optimized dynamically for your connection.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-700/50 flex items-center justify-center mb-4 text-rose-400 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Live Interactive Workshops</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect directly with mentors in scheduled live sessions featuring real-time audio, video, screen sharing, and collaborative chat.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Recognized Certifications</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Earn authenticated, shareable completion certificates with unique verification links ready for LinkedIn and resume profiles.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Teach & Earn Globally</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Share your skills with a worldwide audience, access deep learner engagement analytics, and earn competitive revenue.
            </p>
          </div>
        </div>
      </section>

      {/* Trusted By Leading Tech Teams */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-6">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
            Trusted by professionals and engineering teams from top organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70">
            {TRUSTED_COMPANIES.map((company) => (
              <span
                key={company.name}
                className="text-base sm:text-lg font-black tracking-tight text-slate-300 hover:text-white transition-colors"
              >
                {company.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Category Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              Specialization Tracks
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Explore Learning Disciplines
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Comprehensive curriculums designed to help you master fundamental concepts and build production-ready projects.
            </p>
          </div>

          <Link
            to="/courses"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
          >
            <span>Explore all categories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES_SHOWCASE.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                to="/courses"
                onClick={() => handleCategoryClick(cat.tag)}
                className={`p-6 rounded-3xl bg-gradient-to-br ${cat.gradient} bg-slate-900/90 border ${cat.border} hover:scale-[1.02] transition-all shadow-xl flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-center text-white group-hover:rotate-6 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-950/60 border border-white/10 text-[11px] font-bold text-slate-300">
                      {cat.count}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-white">
                  <span>Explore syllabus</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Courses Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              Top Rated
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Featured Specialization Courses
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Industry-standard courses built by top practitioners and senior engineering leaders
            </p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
          >
            <span>View all ({courses.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course.slug || course._id}`}
              className="group rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 overflow-hidden shadow-xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-indigo-300 border border-indigo-500/30">
                    {course.category}
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md text-xs font-black text-white">
                    {course.price === 0 ? 'FREE' : `$${course.price}`}
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2.5">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {course.averageRating}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {course.enrolledCount} learners
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 font-medium">{course.level}</span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {course.subtitle || course.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        course.instructor?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={course.instructor?.name}
                      className="w-7 h-7 rounded-full object-cover border border-indigo-500/30"
                    />
                    <span className="text-slate-300 font-medium truncate max-w-[130px]">
                      {course.instructor?.name || 'Lead Instructor'}
                    </span>
                  </div>

                  <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Enroll <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Classroom Spotlight */}
      {activeLiveRoom && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-700/50 p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span>Active Live Masterclass Session</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {activeLiveRoom.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeLiveRoom.description}
                </p>

                <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Duration: {activeLiveRoom.scheduledDurationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Instructor: {activeLiveRoom.instructor?.name || 'Dr. Alex Mercer'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Live Two-Way Audio/Video</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/live/${activeLiveRoom.roomId}`}
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-rose-950/50 transition-all hover:scale-105"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Live Room Now</span>
                  </Link>
                </div>
              </div>

              {/* Graphic Mockup */}
              <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl p-6 flex flex-col justify-between aspect-video">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                  <span className="font-mono text-indigo-400 font-bold">Classroom ID: {activeLiveRoom.roomId}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Interactive Room Online
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-indigo-950/80 border border-indigo-600/40 flex items-center justify-center text-indigo-400 animate-pulse">
                    <Video className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">Interactive Masterclass Session</span>
                  <span className="text-[11px] text-slate-500">Camera, microphone, screen sharing & raise hand enabled</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Wall of Love: Student Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Learner Success
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Trusted by Professionals Worldwide
          </h2>
          <p className="text-xs text-slate-400">
            Real feedback from learners who completed specialization tracks and achieved career advancement
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-xl space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">{t.author}</div>
                  <div className="text-slate-400 text-[11px]">{t.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Got Questions?
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400">
            Find answers to common questions about courses, certifications, and live masterclasses
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-slate-200 hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-600 to-violet-700 p-10 md:p-14 text-center text-white space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-3 relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Ready to Advance Your Professional Skills?
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
              Join thousands of professionals gaining practical expertise, earning certifications, and elevating their careers.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 relative">
            <Link
              to="/register/student"
              className="px-8 py-3.5 rounded-xl bg-white text-indigo-900 font-extrabold text-sm shadow-xl hover:bg-indigo-50 transition-all hover:scale-105"
            >
              Get Started as Student
            </Link>
            <Link
              to="/teach"
              className="px-8 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-extrabold text-sm transition-all"
            >
              Teach on EduFlow
            </Link>
            <Link
              to="/courses"
              className="px-8 py-3.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-950/80 border border-white/20 text-white font-extrabold text-sm transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
