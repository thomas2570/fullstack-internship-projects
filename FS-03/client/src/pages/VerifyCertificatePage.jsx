import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Download,
  Search
} from 'lucide-react';

export const VerifyCertificatePage = () => {
  const { certificateId: routeId } = useParams();
  const [searchId, setSearchId] = useState(routeId || '');
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (routeId) {
      verifyCert(routeId);
    }
  }, [routeId]);

  const verifyCert = async (idToVerify) => {
    if (!idToVerify.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/certificates/verify/${idToVerify.trim()}`);
      setCertData(res.data.certificate);
    } catch (err) {
      setCertData(null);
      setError(err.response?.data?.message || 'Certificate not found or verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    verifyCert(searchId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 sm:space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>EduFlow Academy Credential Verification Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Verify Academic & Professional Credential
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
          Enter any Certificate ID or scan the embedded QR code to instantly validate proof of course completion and digital authenticity.
        </p>

        {/* Verification Form */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto pt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="e.g. EDF-2026-F62058D4"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Verify</span>
          </button>
        </form>
      </div>

      {loading && (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Validating cryptographic signature with academy registry...</p>
        </div>
      )}

      {error && (
        <div className="p-6 rounded-3xl bg-rose-950/30 border border-rose-800/80 text-center max-w-md mx-auto space-y-2">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-1" />
          <h3 className="text-base font-bold text-white">Invalid or Unverified Credential</h3>
          <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
        </div>
      )}

      {certData && (
        <div className="rounded-3xl bg-slate-900 border border-emerald-500/40 p-5 sm:p-8 md:p-10 shadow-2xl space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Verified Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Verified Authentic Certificate
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {certData.studentName}
                </h2>
              </div>
            </div>

            <a
              href={`/api/certificates/download/${certData.certificateId}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </a>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                Course Completed
              </span>
              <div className="font-bold text-slate-100 text-sm">{certData.courseTitle}</div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                Authorized Instructor
              </span>
              <div className="font-bold text-slate-100 text-sm">{certData.instructorName}</div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                Issuance Date
              </span>
              <div className="font-medium text-slate-300">
                {new Date(certData.issueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                Certificate Serial ID
              </span>
              <div className="font-mono text-indigo-400 font-bold">{certData.certificateId}</div>
            </div>
          </div>

          {/* Digital Authenticity Audit */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Digital Authenticity Signature (SHA-256 Verified)
            </span>
            <div className="font-mono text-[11px] text-slate-300 break-all">
              {certData.verificationHash}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

