import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { generateCertificate } from '../services/certificateGenerator.js';

export const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(200).json({
        success: true,
        message: 'Already enrolled in this course.',
        enrollment: existingEnrollment,
      });
    }

    // For paid courses without a transaction, route to checkout
    if (course.price > 0) {
      return res.status(402).json({
        success: false,
        message: 'This is a paid course. Please complete checkout to enroll.',
        requiresPayment: true,
      });
    }

    const firstLesson = await Lesson.findOne({ course: courseId }).sort({ order: 1 });

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      lastAccessedLesson: firstLesson?._id,
      progressPercentage: 0,
      isCompleted: false,
    });

    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course!',
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        select: 'title slug thumbnail category level totalDuration totalLessons instructor',
        populate: { path: 'instructor', select: 'name avatar' }
      })
      .populate('certificate')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    }).populate('completedLessons.lesson', 'title order sectionTitle contentType')
      .populate('certificate');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found for this course.' });
    }

    res.status(200).json({
      success: true,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

export const markLessonComplete = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'You are not enrolled in this course.' });
    }

    const alreadyDone = enrollment.completedLessons.some(
      (cl) => cl.lesson.toString() === lessonId
    );

    if (!alreadyDone) {
      enrollment.completedLessons.push({
        lesson: lessonId,
        completedAt: new Date(),
      });
    }

    enrollment.lastAccessedLesson = lessonId;

    const totalLessons = await Lesson.countDocuments({ course: courseId });
    const completedCount = enrollment.completedLessons.length;
    const progressPercentage = Math.min(100, Math.round((completedCount / Math.max(totalLessons, 1)) * 100));

    enrollment.progressPercentage = progressPercentage;

    let certificateGenerated = null;
    if (progressPercentage === 100 && !enrollment.isCompleted) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();
      await enrollment.save();

      const course = await Course.findById(courseId).populate('instructor');
      certificateGenerated = await generateCertificate({
        student: req.user,
        course,
        instructor: course.instructor,
        enrollmentId: enrollment._id,
      });
    } else {
      await enrollment.save();
    }

    res.status(200).json({
      success: true,
      enrollment,
      certificate: certificateGenerated || enrollment.certificate,
      justCompleted: progressPercentage === 100,
    });
  } catch (error) {
    next(error);
  }
};

