import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../features/authSlice';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Briefcase,
  Sparkles
} from 'lucide-react';

export const RegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const queryRole = new URLSearchParams(location.search).get('role');
  const redirectUrl = new URLSearchParams(location.search).get('redirect') || location.state?.from?.pathname;

  // Determine initial role from pathname or query param
  const getInitialRole = () => {
    if (location.pathname.includes('/instructor') || queryRole === 'instructor') {
      return 'instructor';
    }
    return 'student';
  };

  const [role, setRole] = useState(getInitialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [headline, setHeadline] = useState('');
  const [formError, setFormError] = useState('');

  // Sync role with URL changes
  useEffect(() => {
    if (location.pathname.includes('/instructor') || queryRole === 'instructor') {
      setRole('instructor');
    } else if (location.pathname.includes('/student') || queryRole === 'student') {
      setRole('student');
    }
  }, [location.pathname, queryRole]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setFormError('');
    dispatch(clearAuthError());
    navigate(`/register/${newRole}`, { replace: true });
  };

  const cleanEmailInput = (val) => {
    if (!val) return '';
    return val.trim().toLowerCase().replace(/@(gmai|gamil|gmial)\.com$/i, '@gmail.com');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    dispatch(clearAuthError());

    const cleanEmail = cleanEmailInput(email);

    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!cleanEmail) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    const res = await dispatch(
      registerUser({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: role === 'instructor' ? 'instructor' : 'student',
        headline: headline.trim(),
      })
    );

    if (!res.error) {
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (role === 'instructor') {
        navigate('/instructor/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const activeError = formError || error;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          role === 'instructor' ? 'bg-emerald-600/15' : 'bg-indigo-600/15'
        }`}
      />

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-5 sm:p-8 space-y-5">
        {/* Top Segmented Tab Switcher */}
        <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === 'student'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-indigo-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="text-sm">🎓</span>
            <span>Student Registration</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('instructor')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === 'instructor'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="text-sm">👨‍🏫</span>
            <span>Instructor Registration</span>
          </button>
        </div>

        {/* Dynamic Header based on Role */}
        <div className="text-center space-y-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg transition-all ${
              role === 'instructor'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/20'
            }`}
          >
            {role === 'instructor' ? (
              <Briefcase className="w-7 h-7 text-white" />
            ) : (
              <GraduationCap className="w-8 h-8 text-white" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {role === 'instructor' ? 'Create Instructor Account' : 'Create Student Account'}
          </h1>

          <p className="text-xs text-slate-400">
            {role === 'instructor'
              ? 'Teach online courses and conduct live masterclasses'
              : 'Enroll in verified masterclasses, interact live, and earn certificates'}
          </p>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{activeError}</div>
            <button
              onClick={() => {
                setFormError('');
                dispatch(clearAuthError());
              }}
              className="text-rose-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder={role === 'instructor' ? 'e.g. Dr. Alex Mercer' : 'e.g. Rahul Sharma'}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pl-11 transition-all"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                onBlur={() => setEmail((prev) => cleanEmailInput(prev))}
                placeholder="you@example.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pl-11 transition-all"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Password (min 6 characters) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pl-11 pr-11 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Confirm Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pl-11 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Headline / Specialization (Role specific) */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              {role === 'instructor' ? 'Professional Title / Subject Expertise' : 'Bio / Learning Interest (Optional)'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={
                  role === 'instructor'
                    ? 'e.g. Senior Full-Stack Engineer & Cloud Architect'
                    : 'e.g. Computer Science Student & Aspiring Developer'
                }
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pl-11 transition-all"
              />
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              role === 'instructor'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating {role === 'instructor' ? 'Instructor' : 'Student'} account...</span>
              </div>
            ) : (
              <>
                <span>
                  {role === 'instructor' ? '👨‍🏫 Create Instructor Account' : '🎓 Create Student Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Existing login link */}
        <div className="pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
            className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
