import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEnrollments } from '../features/courseSlice';
import { CertificateModal } from '../components/CertificateModal';
import api from '../api/axios';
import {
  BookOpen,
  Award,
  Play,
  Download
} from 'lucide-react';

export const StudentDashboardPage = () => {
  const dispatch = useDispatch();
  const { myEnrollments: enrollments } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);

  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [certModalOpen, setCertModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
    api.get('/certificates/my')
      .then((res) => setCertificates(res.data.certificates || []))
      .catch((err) => console.warn(err));
  }, [dispatch]);

  const completedCount = enrollments.filter((e) => e.isCompleted || e.progressPercentage === 100).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Student Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Learner'}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your progress across courses, resume video lessons, and verify earned credentials
          </p>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3">
          <div className="px-3 sm:px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-base sm:text-lg font-black text-indigo-400">{enrollments.length}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Enrolled</div>
          </div>
          <div className="px-3 sm:px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-base sm:text-lg font-black text-emerald-400">{completedCount}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Completed</div>
          </div>
          <div className="px-3 sm:px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-base sm:text-lg font-black text-amber-400">{certificates.length}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Certificates</div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>My Enrolled Courses</span>
        </h2>

        {enrollments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">You haven't enrolled in any courses yet</p>
            <Link
              to="/courses"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Browse Course Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enr) => {
              const course = enr.course;
              if (!course) return null;
              const isDone = enr.isCompleted || enr.progressPercentage === 100;

              return (
                <div
                  key={enr._id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between hover:border-indigo-500/50 transition-all"
                >
                  <div className="aspect-video relative bg-slate-950 overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
                      {course.category}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-base line-clamp-2">
                        {course.title}
                      </h3>
                      <div className="text-xs text-slate-400">
                        Instructor: {course.instructor?.name || 'Lead Instructor'}
                      </div>
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">Progress</span>
                        <span className={isDone ? 'text-emerald-400 font-bold' : 'text-indigo-400'}>
                          {enr.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${enr.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Link
                        to={`/courses/${course.slug || course._id}/learn`}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          isDone
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Review Course' : 'Resume Learning'}</span>
                      </Link>

                      {enr.certificate && (
                        <button
                          onClick={() => {
                            setSelectedCert(enr.certificate);
                            setCertModalOpen(true);
                          }}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                          title="View Certificate"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Earned Certificates Gallery */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Earned Completion Certificates</span>
        </h2>

        {certificates.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            Complete 100% of any course lessons and pass the final assessment to unlock your verified PDF certificate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ID: {cert.certificateId}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Issued: {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base truncate">
                    {cert.courseTitle}
                  </h3>

                  <div className="text-xs text-slate-400">
                    Instructor: {cert.instructorName}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedCert(cert);
                      setCertModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" /> View
                  </button>

                  <a
                    href={`/api/certificates/download/${cert.certificateId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        certificate={selectedCert}
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
      />
    </div>
  );
};

