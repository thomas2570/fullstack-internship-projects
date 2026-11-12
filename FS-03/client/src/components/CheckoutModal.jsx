import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  X
} from 'lucide-react';

export const CheckoutModal = ({ course, isOpen, onClose, onSuccess }) => {
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!isOpen || !course) return null;

  const price = course.price || 0;
  const platformFee = Math.round(price * 0.3 * 100) / 100;
  const instructorShare = Math.round((price - platformFee) * 100) / 100;

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      setError(null);

      const res = await api.post('/payments/confirm', {
        courseId: course._id,
        paymentProvider: 'stripe_test',
        paymentIntentId: `pi_test_${Date.now()}`,
      });

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
      navigate(`/courses/${course.slug || course._id}/learn`);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Test Checkout</span>
          </div>
          <h3 className="text-xl font-bold text-white">Enroll in Course</h3>
          <p className="text-xs text-slate-400 mt-1 truncate">{course.title}</p>
        </div>

        {/* Summary Details */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Course Tuition</span>
              <span className="font-semibold text-white">${price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Instructor Share (70%)</span>
              <span className="text-emerald-400 font-medium">+${instructorShare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Platform Fee (30%)</span>
              <span>+${platformFee.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Total Due</span>
              <span className="text-indigo-400">${price.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Card Number (Test Mode)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-10"
                />
                <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expiry</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">CVC</label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment & Allocating Split...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay ${price.toFixed(2)} & Activate Enrollment</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-600" />
            <span>Encrypted 256-bit Stripe test transaction. Zero actual charge.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

