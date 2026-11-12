import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import api from '../api/axios';
import {
  HelpCircle,
  CheckCircle,
  XCircle,
  Award,
  ArrowRight,
  RotateCcw,
  Clock
} from 'lucide-react';

export const QuizRunner = ({ quizId, onQuizCompleted }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIndex: [optionId] }
  const [quizResult, setQuizResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/quizzes/${quizId}`);
      setQuiz(res.data.quiz);
      setQuizResult(null);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionIndex, optionId) => {
    if (quizResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: [optionId],
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const formattedAnswers = Object.entries(selectedAnswers).map(([idx, opts]) => ({
        questionIndex: parseInt(idx, 10),
        selectedOptions: opts,
      }));

      const res = await api.post(`/quizzes/${quizId}/submit`, {
        answers: formattedAnswers,
      });

      setQuizResult(res.data.result);

      if (res.data.result.passed) {
        // Trigger celebratory confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
        });

        if (onQuizCompleted) {
          onQuizCompleted({
            passed: true,
            enrollment: res.data.enrollment,
            certificate: res.data.earnedCertificate,
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading Assessment Questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-950/20 border border-rose-800/60 rounded-2xl">
        <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-rose-300 font-medium">{error}</p>
        <button
          onClick={fetchQuiz}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">No questions available for this assessment yet.</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Quiz Top Banner */}
      <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Interactive Assessment
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Passing Score: {quiz.passingScore}%
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">{quiz.title}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{quiz.description}</p>
        </div>

        {/* Progress Pill */}
        <div className="sm:text-right shrink-0">
          <div className="text-xs text-slate-400 mb-1 font-mono">
            {answeredCount}/{totalQuestions} Answered
          </div>
          <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quiz Body */}
      {!quizResult ? (
        <div className="p-5 sm:p-6 md:p-8">
          {/* Question Index Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {quiz.questions.map((q, idx) => {
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isCurrent = currentQuestionIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50'
                      : isAnswered
                      ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question */}
          <div className="mb-8">
            <div className="text-xs font-semibold uppercase text-indigo-400 tracking-wider mb-2">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-100 leading-snug">
              {currentQuestion.questionText}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedAnswers[currentQuestionIndex]?.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQuestionIndex, opt.id)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opt.id.slice(-1).toUpperCase()}
                    </span>
                    <span>{opt.text}</span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors flex items-center gap-1.5"
              >
                Next Question <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2"
              >
                {submitting ? 'Evaluating Assessment...' : 'Submit Assessment'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Graded Results View */
        <div className="p-6 md:p-8 space-y-6">
          {/* Result Card */}
          <div
            className={`p-6 rounded-2xl border text-center ${
              quizResult.passed
                ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/30 border-rose-700/60 text-rose-200'
            }`}
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center">
              {quizResult.passed ? (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-10 h-10" />
                </div>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              {quizResult.passed ? 'Assessment Passed! Congratulations!' : 'Passing Threshold Not Reached'}
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto mb-4">
              {quizResult.passed
                ? `You scored ${quizResult.percentage}% (${quizResult.score}/${quizResult.totalPoints} points). Your progress has been updated, and your verifiable certificate is unlocked!`
                : `You scored ${quizResult.percentage}%. The passing threshold is ${quizResult.passingScore}%. Review the answer explanations below and retake the quiz.`}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={fetchQuiz}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake Assessment
              </button>
            </div>
          </div>

          {/* Answer Breakdown with Explanations */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Detailed Question Breakdown & Explanations
            </h4>
            {quizResult.answers.map((ans, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  ans.isCorrect
                    ? 'bg-slate-950/70 border-emerald-800/60'
                    : 'bg-slate-950/70 border-rose-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {ans.isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-300">Question {idx + 1}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      ans.isCorrect
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {ans.isCorrect ? `+${ans.pointsEarned} pt` : '0 pt'}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-200 mb-2">{ans.questionText}</p>

                {ans.explanation && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <span className="font-semibold text-indigo-400">Explanation: </span>
                    {ans.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

