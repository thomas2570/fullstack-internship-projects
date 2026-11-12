import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  CheckCircle,
  X,
  ShieldCheck,
  Copy,
  ExternalLink,
  Award
} from 'lucide-react';

export const CertificateModal = ({ certificate, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen || !certificate) return null;

  const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.certificateId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    window.open(`/api/certificates/download/${certificate.certificateId}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Display Area */}
        <div className="p-4 sm:p-8 md:p-10 border-b border-slate-800 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900">
          <div className="text-center mb-5 sm:mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 mb-2 sm:mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Verifiable Credential</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Certificate of Completion
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Issued by EduFlow Academy
            </p>
          </div>

          {/* Certificate Frame Preview */}
          <div className="relative rounded-2xl bg-white text-slate-900 p-4 sm:p-6 md:p-8 shadow-2xl border-4 border-indigo-600">
            <div className="border border-indigo-200 p-3 sm:p-5 rounded-xl text-center space-y-3">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-indigo-700 flex items-center justify-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>EduFlow Academy Certificate of Completion</span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-widest">
                This is proudly presented to
              </div>

              <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight underline decoration-indigo-500 decoration-2 underline-offset-4">
                {certificate.studentName || 'Student Name'}
              </div>

              <div className="text-[11px] sm:text-xs text-slate-600 max-w-md mx-auto">
                for successfully mastering all modules, video lessons, and passing assessment standards for
              </div>

              <div className="text-base sm:text-lg md:text-xl font-bold text-indigo-900 pt-1">
                {certificate.courseTitle || 'Advanced Course'}
              </div>

              {/* Bottom Row */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800">{certificate.instructorName || 'Lead Instructor'}</div>
                  <div className="text-[10px] text-slate-500">Academic Instructor</div>
                </div>

                <div className="text-center">
                  <div className="text-[10px] font-mono font-bold text-indigo-600">ID: {certificate.certificateId}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(certificate.issueDate || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                {certificate.qrCodeDataUrl ? (
                  <img
                    src={certificate.qrCodeDataUrl}
                    alt="QR Verification"
                    className="w-12 h-12 sm:w-14 sm:h-14 border border-slate-300 rounded p-0.5"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                    SEAL
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="p-4 sm:p-6 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono truncate max-w-xs">
            Verification Hash: <span className="text-indigo-400">{certificate.verificationHash?.slice(0, 20)}...</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              to={`/verify-certificate/${certificate.certificateId}`}
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Verify Online</span>
            </Link>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
