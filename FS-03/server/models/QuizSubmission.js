import mongoose from 'mongoose';

const quizSubmissionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  answers: [{
    questionIndex: { type: Number, required: true },
    selectedOptions: [{ type: String }],
    isCorrect: { type: Boolean },
    pointsEarned: { type: Number, default: 0 },
  }],
  score: {
    type: Number,
    required: true,
  },
  totalPoints: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  attemptNumber: {
    type: Number,
    default: 1,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);

