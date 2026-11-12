import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'multi_select', 'true_false'],
    default: 'multiple_choice',
  },
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
  }],
  correctAnswers: [{
    type: String,
    required: true,
  }],
  explanation: {
    type: String,
    default: '',
  },
  points: {
    type: Number,
    default: 1,
  },
});

const quizSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  passingScore: {
    type: Number,
    default: 70, // percentage e.g. 70%
    min: 0,
    max: 100,
  },
  timeLimitMinutes: {
    type: Number,
    default: 15, // 0 for unlimited
  },
  questions: [questionSchema],
  totalPoints: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  next();
});

export const Quiz = mongoose.model('Quiz', quizSchema);

