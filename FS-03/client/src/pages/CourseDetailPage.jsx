import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseDetails } from '../features/courseSlice';
import { CheckoutModal } from '../components/CheckoutModal';
import { VideoPlayer } from '../components/VideoPlayer';
import api from '../api/axios';
import {
  BookOpen,
  Clock,
  Star,
  CheckCircle2,
  Play,
  Lock,
  Award,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const CourseDetailPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeCourse: course, activeLessons: lessons, activeReviews, isEnrolled, activeEnrollment, loading } = useSelector(
    (state) => state.courses
  );
  const { user } = useSelector((state) => state.auth);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Reviews & Rating state
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    dispatch(fetchCourseDetails(slug));
  }, [dispatch, slug]);

  // Sync reviews when course or activeReviews loads
  useEffect(() => {
    if (activeReviews && activeReviews.length > 0) {
      setReviews(activeReviews);
    } else if (course?._id) {
      api.get(`/courses/${course._id}/reviews`)
        .then((res) => {
          if (res.data?.reviews) setReviews(res.data.reviews);
        })
        .catch(() => {});
    }
  }, [activeReviews, course?._id]);

  // Set default preview lesson if available
  useEffect(() => {
    if (lessons && lessons.length > 0) {
      const freePreview = lessons.find((l) => l.isFreePreview && l.video?.streamingUrl);
      if (freePreview) {
        setPreviewVideoUrl(freePreview.video.streamingUrl);
      } else if (lessons[0].video?.streamingUrl) {
        setPreviewVideoUrl(lessons[0].video.streamingUrl);
      }
    }
  }, [lessons]);

  const toggleSection = (idx) => {
    setExpandedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleEnrollFree = async () => {
    const token = localStorage.getItem('eduflow_token');
    if (!user && !token) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      await api.post('/enrollments/enroll', { courseId: course._id });
      dispatch(fetchCourseDetails(slug));
      navigate(`/courses/${course.slug || course._id}/learn`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!comment.trim()) {
      setReviewError('Please write your review comment.');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError('');
      const res = await api.post(`/courses/${course._id}/reviews`, {
        rating,
        comment: comment.trim(),
      });
      if (res.data?.success) {
        setReviewSuccess('Thank you! Your review has been published.');
        setReviews((prev) => {
          const filtered = prev.filter((r) => r.student?._id !== user._id && r._id !== res.data.review?._id);
          return [res.data.review, ...filtered];
        });
        setComment('');
        dispatch(fetchCourseDetails(slug));
        setTimeout(() => setReviewSuccess(''), 4000);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !course) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading course details...</p>
      </div>
    );
  }

  // Group lessons by sectionTitle
  const sectionsMap = {};
  lessons.forEach((lesson) => {
    const sec = lesson.sectionTitle || 'General';
    if (!sectionsMap[sec]) sectionsMap[sec] = [];
    sectionsMap[sec].push(lesson);
  });

  return (
    <div className="pb-20 space-y-12">
      {/* Course Hero Banner */}
      <section className="bg-slate-900/80 border-b border-slate-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left Content (2 cols) */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                  {course.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-300 font-semibold">{course.level}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{course.averageRating ? Number(course.averageRating).toFixed(1) : '5.0'}</span>
                  <span className="text-slate-400 font-normal">
                    ({course.reviewCount !== undefined ? course.reviewCount : reviews.length} reviews)
                  </span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {course.subtitle || course.description}
              </p>

              {/* Instructor Info */}
              <div className="flex items-center gap-3 pt-2">
                <img
                  src={course.instructor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={course.instructor?.name}
                  className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
                />
                <div className="text-xs">
                  <div className="text-slate-400">Created by</div>
                  <div className="text-white font-bold">{course.instructor?.name}</div>
                  <div className="text-[11px] text-slate-400">{course.instructor?.headline}</div>
                </div>
              </div>

              {/* Quick Specs */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>{course.totalDuration || 120} mins total duration</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>{lessons.length} lessons & quizzes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>Verified Completion Certificate</span>
                </div>
              </div>
            </div>

            {/* Right Card / CTA (1 col) */}
            <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-6">
              {/* Video Preview Player */}
              <div className="rounded-2xl overflow-hidden aspect-video bg-black relative border border-slate-800">
                {previewVideoUrl ? (
                  <VideoPlayer
                    src={previewVideoUrl}
                    poster={course.thumbnail}
                    title="Course Preview"
                  />
                ) : (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Pricing & CTA */}
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-white">
                      {course.price === 0 ? 'FREE' : `$${course.price}`}
                    </span>
                    {course.price > 0 && <span className="text-xs text-slate-400 ml-1">USD</span>}
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Full Lifetime Access
                  </span>
                </div>

                {isEnrolled ? (
                  <Link
                    to={`/courses/${course.slug || course._id}/learn`}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume Course ({activeEnrollment?.progressPercentage || 0}%)</span>
                  </Link>
                ) : course.price === 0 ? (
                  <button
                    onClick={handleEnrollFree}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Enroll for Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('eduflow_token');
                      if (!user && !token) {
                        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                      } else {
                        setCheckoutModalOpen(true);
                      }
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Enroll Now (${course.price})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <div className="text-[11px] text-slate-500 text-center">
                  Instant access • 30-day money-back guarantee • Full lifetime access on all devices
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Curriculum & Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* What You Will Learn */}
        {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-4">What You Will Learn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              {course.whatYouWillLearn.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Curriculum Sections Accordion */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Course Curriculum</h2>
            <span className="text-xs text-slate-400">
              {Object.keys(sectionsMap).length} Modules • {lessons.length} Total Lessons
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(sectionsMap).map(([sectionTitle, secLessons], idx) => {
              const isOpen = expandedSections[idx] !== false; // open by default
              return (
                <div
                  key={sectionTitle}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(idx)}
                    className="w-full p-4 text-left flex items-center justify-between bg-slate-950/60 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="font-semibold text-sm text-slate-200">
                      {sectionTitle}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{secLessons.length} lessons</span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-slate-800/60">
                      {secLessons.map((l) => (
                        <div
                          key={l._id}
                          className="p-3.5 px-4 flex items-center justify-between text-xs text-slate-300 hover:bg-slate-800/20 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {l.contentType === 'quiz' ? (
                              <Award className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Play className="w-4 h-4 text-indigo-400 shrink-0" />
                            )}
                            <span className="font-medium text-slate-200 truncate">{l.title}</span>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {l.isFreePreview ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                Free Preview
                              </span>
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            {l.video?.duration > 0 && (
                              <span className="text-slate-500 font-mono text-[11px]">
                                {Math.round(l.video.duration / 60)}m
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Requirements */}
        {course.requirements && course.requirements.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Requirements</h2>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
              {course.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructor Profile Card */}
        {course.instructor && (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Meet Your Lead Instructor</h2>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <img
                src={
                  course.instructor.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                }
                alt={course.instructor.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg shadow-indigo-950/40 shrink-0"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-white">{course.instructor.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Instructor
                  </span>
                </div>
                <div className="text-xs font-semibold text-indigo-400">
                  {course.instructor.headline || 'Principal Systems Architect & Technical Author'}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {course.instructor.bio ||
                    'Senior engineering leader with over a decade of hands-on experience designing cloud infrastructure, real-time multimedia streaming, and scalable enterprise architectures.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Guarantee Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Official Verifiable Certificate of Completion
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Earn an official verifiable Certificate of Completion with secure digital authentication and a dedicated verification link ready to share on LinkedIn and resume profiles.
              </p>
            </div>
          </div>
          <Link
            to="/verify-certificate/EDF-2026-A88090EE"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
          >
            <span>Sample Verification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Course Reviews & Student Feedback Section */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 space-y-8 shadow-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Student Feedback & Ratings</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Course Reviews ({course.reviewCount !== undefined ? course.reviewCount : reviews.length})
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Genuine ratings and feedback for <span className="text-indigo-400 font-semibold">{course.title}</span>
              </p>
            </div>

            {/* Average Rating Card */}
            <div className="flex items-center gap-3.5 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 shrink-0">
              <div className="text-3xl font-black text-amber-400">
                {course.averageRating ? Number(course.averageRating).toFixed(1) : '5.0'}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(course.averageRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {course.reviewCount !== undefined ? course.reviewCount : reviews.length} verified reviews
                </div>
              </div>
            </div>
          </div>

          {/* Write a Review Card */}
          <div className="rounded-2xl bg-slate-950/80 border border-indigo-500/30 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>✍️ Write a Review for this Course</span>
              </h4>
              {user && (
                <span className="text-xs text-slate-400">
                  Posting as <strong className="text-indigo-400 font-semibold">{user.name}</strong>
                </span>
              )}
            </div>

            {!user ? (
              <div className="py-4 text-center space-y-3">
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Sign in or create an account to share your personal review and rating for this specific course.
                </p>
                <Link
                  to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                >
                  <span>Sign In to Leave a Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                {/* Interactive Star Rating */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Your Rating <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-slate-600 hover:scale-125 transition-transform cursor-pointer"
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-2">
                      {rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Your Review Feedback <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share what you learned, instructor quality, course structure, and highlights..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {reviewError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                    {reviewError}
                  </div>
                )}

                {reviewSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingReview || !comment.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  {submittingReview ? 'Submitting Review...' : 'Submit Course Review'}
                </button>
              </form>
            )}
          </div>

          {/* List of Reviews for this Course */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-200">
              Verified Student Reviews for this Course ({reviews.length})
            </h4>

            {reviews.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <Star className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p className="text-xs font-semibold text-slate-400">No reviews yet for this course.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Be the first to share your learning experience above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => {
                  const reviewDate = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recently';

                  return (
                    <div
                      key={rev._id}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors shadow-lg"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                              {rev.student?.avatar ? (
                                <img
                                  src={rev.student.avatar}
                                  alt={rev.student?.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                rev.student?.name?.charAt(0) || 'S'
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">
                                {rev.student?.name || 'Verified Student'}
                              </div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                {rev.student?.role === 'instructor' ? 'Instructor' : 'Verified Learner'}
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-500 font-medium">
                            {reviewDate}
                          </span>
                        </div>

                        {/* Star Rating Display */}
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed break-words">
                          {rev.comment}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        course={course}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={() => dispatch(fetchCourseDetails(slug))}
      />
    </div>
  );
};

