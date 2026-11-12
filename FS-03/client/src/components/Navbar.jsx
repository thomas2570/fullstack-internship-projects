import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUserData } from '../features/authSlice';
import api from '../api/axios';
import {
  GraduationCap,
  BookOpen,
  DollarSign,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Info,
  Radio,
  Settings,
  Sparkles,
  HelpCircle,
  Bell,
  CheckCircle2,
  User as UserIcon
} from 'lucide-react';

export const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false);

  // Settings form state
  const [settingsName, setSettingsName] = useState('');
  const [settingsHeadline, setSettingsHeadline] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [settingsRole, setSettingsRole] = useState('student');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const profileDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync settings form with user
  useEffect(() => {
    if (user) {
      setSettingsName(user.name || '');
      setSettingsHeadline(user.headline || '');
      setSettingsBio(user.bio || '');
      setSettingsRole(user.role || 'student');
    }
  }, [user, settingsModalOpen]);

  // Close on ESC and lock body scroll when drawer is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileDropdownOpen(false);
        setSettingsModalOpen(false);
        setUpdatesModalOpen(false);
      }
    };

    if (mobileMenuOpen || settingsModalOpen || updatesModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen, settingsModalOpen, updatesModalOpen]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      setSettingsMsg('');
      const res = await api.put('/auth/profile', {
        name: settingsName.trim(),
        headline: settingsHeadline.trim(),
        bio: settingsBio.trim(),
        role: settingsRole,
      });
      if (res.data?.user) {
        dispatch(updateUserData(res.data.user));
      }
      setSettingsMsg('Profile updated successfully!');
      setTimeout(() => {
        setSettingsModalOpen(false);
        setSettingsMsg('');
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header
        style={{ backgroundColor: '#0b0f19' }}
        className="sticky top-0 z-40 border-b border-slate-800/80 shadow-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 group shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:bg-indigo-500 transition-colors">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                EduFlow Academy
              </span>
            </Link>

            {/* Desktop Nav Links (visible on lg: 1024px+) */}
            <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
              <Link
                to="/about"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
              >
                About
              </Link>

              <Link
                to="/live"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors flex items-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>Live Classes</span>
              </Link>

              <Link
                to="/courses"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Explore Courses</span>
              </Link>

              <Link
                to="/teach"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 transition-colors flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Teach</span>
              </Link>
            </nav>

            {/* Desktop Right Action Area (visible on lg: 1024px+) */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                  {/* Profile Avatar Button (matches screenshot circle avatar) */}
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/60 transition-all focus:outline-none"
                    aria-label="User profile menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#071a36] border border-blue-500/40 flex items-center justify-center text-white font-extrabold text-sm shadow-md hover:border-blue-400 transition-colors">
                      {userInitial}
                    </div>
                  </button>

                  {/* Profile Dropdown Menu (Clean white card matching screenshot) */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-white border border-slate-100 shadow-2xl p-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Header */}
                      <div className="px-3.5 py-2.5 mb-1 border-b border-slate-100 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 text-sm truncate">{user.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          user.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : user.role === 'instructor'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        }`}>
                          {user.role}
                        </span>
                      </div>

                      {/* Menu Items */}
                      <div className="space-y-0.5">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-between"
                        >
                          <span>My Learning</span>
                        </Link>

                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-between"
                        >
                          <span>My Purchases</span>
                        </Link>

                        {(user?.role === 'instructor' || user?.role === 'admin') && (
                          <Link
                            to="/instructor/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center justify-between"
                          >
                            <span>Instructor Studio</span>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Studio
                            </span>
                          </Link>
                        )}

                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center justify-between"
                          >
                            <span>Platform Admin</span>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Admin
                            </span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setSettingsModalOpen(true);
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-between"
                        >
                          <span>Settings</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setUpdatesModalOpen(true);
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-between"
                        >
                          <span>Updates</span>
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        </button>

                        <Link
                          to="/support"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-between"
                        >
                          <span>Help Center</span>
                        </Link>
                      </div>

                      <div className="my-1.5 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-between"
                      >
                        <span>Log Out</span>
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 xl:gap-4">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register/student"
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-[1.02]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile & Tablet Right-Side Menu Toggle (visible below lg) */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSettingsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>Account Settings</span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage your personal profile and account details
              </p>
            </div>

            {settingsMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{settingsMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={settingsHeadline}
                  onChange={(e) => setSettingsHeadline(e.target.value)}
                  placeholder="e.g. Full-Stack Developer & Educator"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={settingsBio}
                  onChange={(e) => setSettingsBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Registered Email</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-950/50 border border-slate-800/60 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>

              {user?.role !== 'admin' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Account Role / Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettingsRole('student')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        settingsRole === 'student'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>🎓 Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsRole('instructor')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        settingsRole === 'instructor'
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>👨‍🏫 Instructor</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    You can switch between Student and Instructor at any time.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {settingsSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Updates Modal */}
      {updatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setUpdatesModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>EduFlow 2.0 Release</span>
              </div>
              <h3 className="text-lg font-bold text-white">Latest Updates & Announcements</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Real-time Interactive Live Classes</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Join low-latency video sessions with interactive screensharing and live student-instructor chat.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  <span>Adaptive HLS Multi-Bitrate Video</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Stream lessons smoothly in 1080p, 720p, and 480p with zero buffering on any connection.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Verified Digital Certifications</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Earn verifiable PDF credentials with secure QR verification upon course completion.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setUpdatesModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Got it, continue learning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop Overlay (YouTube style dark dimmer) */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Right-Side Slide-Over Drawer Panel */}
      <aside
        style={{ backgroundColor: '#0b0f19' }}
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-[300px] sm:max-w-xs border-l border-slate-800 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile navigation drawer"
      >
        {/* Top Header of Drawer */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-500/30">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base text-white tracking-tight">
              EduFlow Academy
            </span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          {/* User Profile Bar if Logged In */}
          {user && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-indigo-500/40 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate max-w-[130px]">{user.name}</div>
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">{user.role}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Nav Links in Requested Order: About, Live Classes, Explore Courses */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
              Navigation
            </div>

            {/* 1. About */}
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <Info className="w-4 h-4" />
                </div>
                <span>About</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* 2. Live Classes */}
            <Link
              to="/live"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                  <Radio className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span>Live Classes</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* 3. Explore Courses */}
            <Link
              to="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Explore Courses</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Authenticated Links */}
            {user && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span>My Learning</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span>My Purchases</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                {(user?.role === 'instructor' || user?.role === 'admin') && (
                  <Link
                    to="/instructor/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span>Instructor Studio</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-500/60 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-300 hover:bg-amber-500/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span>Admin Panel</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-500/60 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSettingsModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 group-hover:bg-slate-500/20 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span>Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setUpdatesModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span>Updates</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <Link
                  to="/support"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span>Help Center</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 bg-[#080b13] shrink-0">
          {!user ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-xl text-center text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register/student"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-xl text-center text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1"
              >
                <span>🎓</span>
                <span>Sign Up</span>
              </Link>
            </div>
          ) : (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-slate-900 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}

          <div className="text-[11px] text-center text-slate-500">
            © 2026 EduFlow Academy
          </div>
        </div>
      </aside>
    </>
  );
};
