import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Award,
  Calendar,
  User,
  BookOpen,
  QrCode,
  Sparkles,
  ExternalLink,
  GraduationCap
} from 'lucide-react';

const SAMPLE_CERT_ID = 'EDF-2026-A88090EE';
const UIUX_SAMPLE_ID = 'EDF-2026-245FB440';
const ALTERNATE_SAMPLE_ID = 'EDF-2026-F5B6FA69';

export const VerifyCertificatePage = () => {
  const { certificateId: routeId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [myCertificates, setMyCertificates] = useState([]);
  const [searchId, setSearchId] = useState(routeId || SAMPLE_CERT_ID);
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verifyCert = async (idToVerify) => {
    const cleanId = (idToVerify || '').trim().toUpperCase();
    if (!cleanId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/certificates/verify/${cleanId}`);
      if (res.data?.success && res.data?.certificate) {
        setCertData(res.data.certificate);
      } else {
        setCertData(null);
        setError('No certificate found with this verification ID.');
      }
    } catch (err) {
      setCertData(null);
      setError(err.response?.data?.message || 'Certificate not found or verification signature failed.');
    } finally {
      setLoading(false);
    }
  };

  // Sync verification with route or load user's completed certificate / sample
  useEffect(() => {
    if (routeId) {
      setSearchId(routeId);
      verifyCert(routeId);
    } else if (user) {
      api
        .get('/certificates/my')
        .then((res) => {
          const certs = res.data?.certificates || [];
          setMyCertificates(certs);
          if (certs.length > 0) {
            setSearchId(certs[0].certificateId);
            verifyCert(certs[0].certificateId);
          } else {
            setSearchId(SAMPLE_CERT_ID);
            verifyCert(SAMPLE_CERT_ID);
          }
        })
        .catch(() => {
          setSearchId(SAMPLE_CERT_ID);
          verifyCert(SAMPLE_CERT_ID);
        });
    } else {
      setSearchId(SAMPLE_CERT_ID);
      verifyCert(SAMPLE_CERT_ID);
    }
  }, [routeId, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    const cleanId = searchId.trim().toUpperCase();
    navigate(`/verify-certificate/${cleanId}`);
    verifyCert(cleanId);
  };

  const handleSelectCert = (targetCertId) => {
    setSearchId(targetCertId);
    navigate(`/verify-certificate/${targetCertId}`);
    verifyCert(targetCertId);
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 sm:space-y-10">
      {/* Header section */}
      <div className="text-center space-y-3.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Official EduFlow Academy Verification Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          Verify Academic Credential
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Each EduFlow certificate is digitally stamped with a cryptographic SHA-256 signature and tamper-proof academy seal. Enter any certificate ID below or select from your completed courses.
        </p>

        {/* Verification Search Form */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto pt-2 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              placeholder="e.g. EDF-2026-A88090EE"
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>Verify Credential</span>
          </button>
        </form>

        {/* User's Earned Course Certificates (If any) */}
        {myCertificates.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-indigo-500/20 max-w-2xl mx-auto space-y-2 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Your Completed Course Certificates (Click to view):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {myCertificates.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => handleSelectCert(c.certificateId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                    searchId === c.certificateId
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{c.courseTitle}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                    ({c.certificateId})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Sample Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-400">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Demo Sample Certificates:
          </span>
          <button
            type="button"
            onClick={() => handleSelectCert(SAMPLE_CERT_ID)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-[11px] font-mono text-indigo-300 transition-colors cursor-pointer"
          >
            {SAMPLE_CERT_ID} (Web Eng)
          </button>
          <button
            type="button"
            onClick={() => handleSelectCert(UIUX_SAMPLE_ID)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-[11px] font-mono text-amber-300 transition-colors cursor-pointer"
          >
            {UIUX_SAMPLE_ID} (UI/UX)
          </button>
          <button
            type="button"
            onClick={() => handleSelectCert(ALTERNATE_SAMPLE_ID)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-mono text-emerald-300 transition-colors cursor-pointer"
          >
            {ALTERNATE_SAMPLE_ID} (Cloud)
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Validating cryptographic signature with academy registry...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/30 border border-rose-800/80 text-center max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Invalid or Unverified Credential</h3>
          <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectCert(SAMPLE_CERT_ID)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-800/60 text-xs font-semibold text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Load Verified Sample Certificate</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* Verified Certificate Display */}
      {!loading && certData && (
        <div className="space-y-6">
          {/* Certificate Card with Elegant Styling */}
          <div className="relative rounded-3xl bg-slate-900/90 border border-emerald-500/40 p-6 sm:p-10 md:p-12 shadow-2xl space-y-8 overflow-hidden backdrop-blur-xl">
            {/* Background watermark seal */}
            <div className="absolute right-6 top-6 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Top Verified Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest">
                      Authentic Certificate Verified
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                      ACTIVE & VALID
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                    {certData.studentName}
                  </h2>
                </div>
              </div>

              <a
                href={`/api/certificates/download/${certData.certificateId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </a>
            </div>

            {/* Certificate Visual Presentation Frame */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 space-y-6 text-center relative shadow-inner">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-amber-400 font-extrabold">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>EduFlow Academy Certificate of Completion</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  This certifies that the recipient has satisfactorily completed all curriculum standards and assessments for:
                </div>
              </div>

              <div className="text-lg sm:text-2xl md:text-3xl font-black text-white max-w-2xl mx-auto leading-snug">
                {certData.courseTitle}
              </div>

              {/* Grid of Credentials Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-left">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Recipient
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm truncate">
                    {certData.studentName}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Instructor
                  </div>
                  <div className="font-bold text-slate-200 text-xs sm:text-sm truncate">
                    {certData.instructorName}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Issuance Date
                  </div>
                  <div className="font-medium text-slate-300 text-xs sm:text-sm">
                    {new Date(certData.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    Serial ID
                  </div>
                  <div className="font-mono text-indigo-400 font-extrabold text-xs sm:text-sm truncate">
                    {certData.certificateId}
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic SHA-256 Audit Bar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Cryptographic Verification Fingerprint (SHA-256)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  Valid Registry Match
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 break-all bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                {certData.verificationHash}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <span className="text-slate-500">
                Issued by EduFlow Academy Certification Authority.
              </span>
              {certData.course && certData.course._id && (
                <Link
                  to={`/courses/${certData.course.slug || certData.course._id}`}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>View Course Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
