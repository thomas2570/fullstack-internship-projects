import { Quiz } from '../models/Quiz.js';
import { QuizSubmission } from '../models/QuizSubmission.js';
import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';
import { generateCertificate } from '../services/certificateGenerator.js';

export const createQuiz = async (req, res, next) => {
  try {
    const { courseId, lessonId, title, description, passingScore, timeLimitMinutes, questions } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to create quiz for this course' });
    }

    const quiz = await Quiz.create({
      course: courseId,
      lesson: lessonId || undefined,
      title,
      description,
      passingScore: passingScore || 70,
      timeLimitMinutes: timeLimitMinutes || 15,
      questions,
    });

    // If linked to a lesson, update lesson
    if (lessonId) {
      await Lesson.findByIdAndUpdate(lessonId, {
        quiz: quiz._id,
        contentType: 'quiz',
      });
    }

    res.status(201).json({
      success: true,
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('course', 'title instructor');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const isOwnerOrAdmin = req.user && (
      req.user.role === 'admin' ||
      quiz.course.instructor.toString() === req.user._id.toString()
    );

    // If student is taking the quiz, sanitize out correct answers and explanations
    let sanitizedQuestions = quiz.questions;
    if (!isOwnerOrAdmin) {
      sanitizedQuestions = quiz.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        points: q.points,
      }));
    }

    res.status(200).json({
      success: true,
      quiz: {
        _id: quiz._id,
        course: quiz.course,
        lesson: quiz.lesson,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        timeLimitMinutes: quiz.timeLimitMinutes,
        totalPoints: quiz.totalPoints,
        questions: sanitizedQuestions,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const { id } = req.params; // quizId
    const { answers } = req.body; // array: [{ questionIndex, selectedOptions: [] }]

    const quiz = await Quiz.findById(id).populate('course');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    let earnedPoints = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const studentAnswer = answers?.find(a => a.questionIndex === index) || { selectedOptions: [] };
      const selected = (studentAnswer.selectedOptions || []).map(s => String(s).trim()).sort();
      const correct = (question.correctAnswers || []).map(c => String(c).trim()).sort();

      const isCorrect = selected.length === correct.length &&
        selected.every((val, idx) => val === correct[idx]);

      const pointsForQuestion = isCorrect ? (question.points || 1) : 0;
      earnedPoints += pointsForQuestion;

      gradedAnswers.push({
        questionIndex: index,
        questionText: question.questionText,
        selectedOptions: studentAnswer.selectedOptions || [],
        correctAnswers: question.correctAnswers,
        isCorrect,
        pointsEarned: pointsForQuestion,
        explanation: question.explanation,
      });
    });

    const totalPoints = quiz.totalPoints || quiz.questions.length;
    const percentage = Math.round((earnedPoints / Math.max(totalPoints, 1)) * 100);
    const passed = percentage >= quiz.passingScore;

    // Previous attempt count
    const attemptCount = await QuizSubmission.countDocuments({
      quiz: quiz._id,
      student: req.user._id,
    });

    const submission = await QuizSubmission.create({
      quiz: quiz._id,
      student: req.user._id,
      course: quiz.course._id,
      answers: gradedAnswers,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      attemptNumber: attemptCount + 1,
    });

    // If passed and linked to lesson/course, update student progress
    let updatedEnrollment = null;
    let earnedCertificate = null;

    if (passed) {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: quiz.course._id,
      });

      if (enrollment) {
        // If this quiz is linked to a lesson, mark that lesson completed
        if (quiz.lesson) {
          const alreadyCompleted = enrollment.completedLessons.some(
            cl => cl.lesson.toString() === quiz.lesson.toString()
          );

          if (!alreadyCompleted) {
            enrollment.completedLessons.push({
              lesson: quiz.lesson,
              completedAt: new Date(),
            });
          }
        }

        const totalLessonsCount = await Lesson.countDocuments({ course: quiz.course._id });
        const completedCount = enrollment.completedLessons.length;
        const progressPercentage = Math.min(100, Math.round((completedCount / Math.max(totalLessonsCount, 1)) * 100));

        enrollment.progressPercentage = progressPercentage;

        if (progressPercentage === 100 && !enrollment.isCompleted) {
          enrollment.isCompleted = true;
          enrollment.completedAt = new Date();
          await enrollment.save();

          // Generate Certificate
          earnedCertificate = await generateCertificate({
            student: req.user,
            course: quiz.course,
            instructor: quiz.course.instructor,
            enrollmentId: enrollment._id,
          });
        } else {
          await enrollment.save();
        }

        updatedEnrollment = enrollment;
      }
    }

    res.status(200).json({
      success: true,
      result: {
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        passingScore: quiz.passingScore,
        answers: gradedAnswers,
        attemptNumber: attemptCount + 1,
      },
      enrollment: updatedEnrollment,
      earnedCertificate,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submissions = await QuizSubmission.find({
      quiz: id,
      student: req.user._id,
    }).sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    next(error);
  }
};

