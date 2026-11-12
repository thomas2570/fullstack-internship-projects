import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseDetails, updateEnrollmentProgress } from '../features/courseSlice';
import { VideoPlayer } from '../components/VideoPlayer';
import { QuizRunner } from '../components/QuizRunner';
import { CertificateModal } from '../components/CertificateModal';
import api from '../api/axios';
import confetti from 'canvas-confetti';
import {
  Play,
  CheckCircle,
  Circle,
  Award,
  ChevronLeft,
  FileText,
  Download,
  ShieldCheck
} from 'lucide-react';

export const LearnPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const { activeCourse: course, activeLessons: lessons, activeEnrollment, loading } = useSelector(
    (state) => state.courses
  );

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [earnedCertificate, setEarnedCertificate] = useState(null);

  useEffect(() => {
    dispatch(fetchCourseDetails(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    if (activeEnrollment && activeEnrollment.completedLessons) {
      const completedSet = new Set(
        activeEnrollment.completedLessons.map((cl) => cl.lesson?._id || cl.lesson || cl)
      );
      setCompletedLessonIds(completedSet);

      if (activeEnrollment.certificate) {
        setEarnedCertificate(activeEnrollment.certificate);
      }
    }
  }, [activeEnrollment]);

  const currentLesson = lessons && lessons.length > 0 ? lessons[currentLessonIndex] : null;

  const handleMarkComplete = async () => {
    if (!currentLesson || !course) return;

    try {
      const res = await api.post('/enrollments/complete-lesson', {
        courseId: course._id,
        lessonId: currentLesson._id,
      });

      const updated = res.data.enrollment;
      dispatch(updateEnrollmentProgress(updated));

      const newCompleted = new Set(completedLessonIds);
      newCompleted.add(currentLesson._id);
      setCompletedLessonIds(newCompleted);

      if (res.data.justCompleted || updated.isCompleted) {
        setEarnedCertificate(res.data.certificate);
        setCertificateModalOpen(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      } else if (currentLessonIndex < lessons.length - 1) {
        // Move to next lesson
        setCurrentLessonIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
    }
  };

  const handleQuizDone = ({ passed, enrollment, certificate }) => {
    if (passed && currentLesson) {
      const newCompleted = new Set(completedLessonIds);
      newCompleted.add(currentLesson._id);
      setCompletedLessonIds(newCompleted);

      if (enrollment) {
        dispatch(updateEnrollmentProgress(enrollment));
      }
      if (certificate) {
        setEarnedCertificate(certificate);
        setCertificateModalOpen(true);
      }
    }
  };

  if (loading || !course) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading classroom environment...</p>
      </div>
    );
  }

  const progressPct = activeEnrollment?.progressPercentage || 0;
  const isCurrentCompleted = currentLesson && completedLessonIds.has(currentLesson._id);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-950">
      {/* Main Content Area (Video or Quiz) */}
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              to={`/courses/${course.slug || course._id}`}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Back to course overview"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-indigo-400 font-semibold truncate">{course.title}</div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {currentLesson?.title || 'Lesson Title'}
              </h1>
            </div>
          </div>

          {/* Certificate Trigger Button if earned */}
          {(earnedCertificate || progressPct === 100) && (
            <button
              onClick={() => setCertificateModalOpen(true)}
              className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg shadow-emerald-950/40 animate-pulse shrink-0"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">View Certificate</span>
              <span className="sm:hidden">Certificate</span>
            </button>
          )}
        </div>

        {/* Player or Quiz Viewport */}
        <div className="mb-6">
          {currentLesson?.contentType === 'quiz' ? (
            <QuizRunner
              quizId={currentLesson.quiz?._id || currentLesson.quiz}
              onQuizCompleted={handleQuizDone}
            />
          ) : (
            <div className="space-y-4">
              <VideoPlayer
                src={currentLesson?.video?.streamingUrl || '/uploads/hls/sample-lesson/master.m3u8'}
                poster={currentLesson?.video?.thumbnailUrl || course.thumbnail}
                title={currentLesson?.title}
                isCompleted={isCurrentCompleted}
                onMarkComplete={handleMarkComplete}
              />

              {/* Lesson Description & Actions */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    {currentLesson?.sectionTitle}
                  </div>
                  <h2 className="text-base font-bold text-white">{currentLesson?.title}</h2>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    {currentLesson?.description || 'Follow along with the hands-on code examples in this lesson.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleMarkComplete}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      isCurrentCompleted
                        ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isCurrentCompleted ? 'Completed ✓' : 'Mark Lesson Complete'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resources Attached */}
        {currentLesson?.resources && currentLesson.resources.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Lesson Attachments & Resources</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentLesson.resources.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 text-xs text-slate-300 flex items-center justify-between group transition-colors"
                >
                  <span className="font-medium group-hover:text-indigo-400">{res.title}</span>
                  <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Curriculum Navigation */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/60 flex flex-col max-h-[460px] lg:max-h-none">
        {/* Progress Card */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Course Progress</span>
            <span className="text-indigo-400 font-bold">{progressPct}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{completedLessonIds.size} of {lessons.length} Completed</span>
            {progressPct === 100 && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Certified
              </span>
            )}
          </div>
        </div>

        {/* Lesson List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {lessons.map((lesson, idx) => {
            const isCompleted = completedLessonIds.has(lesson._id);
            const isCurrent = currentLessonIndex === idx;

            return (
              <button
                key={lesson._id}
                onClick={() => setCurrentLessonIndex(idx)}
                className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                  isCurrent
                    ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                    : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 text-xs">
                  <div
                    className={`font-semibold line-clamp-1 ${
                      isCurrent ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {lesson.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    {lesson.contentType === 'quiz' ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Award className="w-3 h-3" /> Quiz
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3 text-indigo-400" /> Video
                      </span>
                    )}
                    {lesson.video?.duration > 0 && (
                      <span>• {Math.round(lesson.video.duration / 60)} min</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified Certificate Modal */}
      <CertificateModal
        certificate={earnedCertificate}
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
      />
    </div>
  );
};

