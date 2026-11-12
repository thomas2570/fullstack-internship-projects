import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { Certificate } from '../models/Certificate.js';
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
        message: 'Already enrolled in this course',
        enrollment: existingEnrollment,
      });
    }

    // Determine initial first lesson
    const firstLesson = await Lesson.findOne({ course: courseId }).sort({ order: 1 });

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      lastAccessedLesson: firstLesson?._id,
      progressPercentage: 0,
      completedLessons: [],
    });

    // Increment course enrolled count
    course.totalEnrolled = (course.totalEnrolled || 0) + 1;
    await course.save();

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
    let enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        select: 'title slug thumbnail category level totalDuration totalLessons instructor',
        populate: { path: 'instructor', select: 'name avatar' }
      })
      .populate('certificate')
      .sort({ updatedAt: -1 });

    // Auto-generate/link certificate for any completed enrollment missing it
    for (let enr of enrollments) {
      if ((enr.progressPercentage === 100 || enr.isCompleted) && !enr.certificate && enr.course) {
        try {
          let existingCert = await Certificate.findOne({
            student: req.user._id,
            course: enr.course._id,
          });

          if (!existingCert) {
            const fullCourse = await Course.findById(enr.course._id).populate('instructor');
            existingCert = await generateCertificate({
              student: req.user,
              course: fullCourse,
              instructor: fullCourse.instructor,
              enrollmentId: enr._id,
            });
          } else {
            enr.certificate = existingCert._id;
            await enr.save();
          }
          enr.certificate = existingCert;
        } catch (e) {
          console.error('[Cert Gen Warning]', e.message);
        }
      }
    }

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
    let enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    }).populate('completedLessons.lesson', 'title order sectionTitle contentType')
      .populate('certificate');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found for this course.' });
    }

    // If completed but certificate unlinked, generate or link it
    if ((enrollment.progressPercentage === 100 || enrollment.isCompleted) && !enrollment.certificate) {
      try {
        let existingCert = await Certificate.findOne({
          student: req.user._id,
          course: courseId,
        });

        if (!existingCert) {
          const fullCourse = await Course.findById(courseId).populate('instructor');
          existingCert = await generateCertificate({
            student: req.user,
            course: fullCourse,
            instructor: fullCourse.instructor,
            enrollmentId: enrollment._id,
          });
        }
        enrollment.certificate = existingCert;
      } catch (e) {
        console.error('[Cert Progress Gen Warning]', e.message);
      }
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
    if (progressPercentage === 100) {
      enrollment.isCompleted = true;
      if (!enrollment.completedAt) enrollment.completedAt = new Date();

      let existingCert = await Certificate.findOne({
        student: req.user._id,
        course: courseId,
      });

      if (!existingCert) {
        const course = await Course.findById(courseId).populate('instructor');
        certificateGenerated = await generateCertificate({
          student: req.user,
          course,
          instructor: course.instructor,
          enrollmentId: enrollment._id,
        });
      } else {
        certificateGenerated = existingCert;
        enrollment.certificate = existingCert._id;
      }
      await enrollment.save();
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

/**
 * Complete Entire Course in One Click
 * Marks all lessons complete, sets progress to 100%, and generates/returns the Certificate for THIS course.
 */
export const completeEntireCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId).populate('instructor');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      enrollment = await Enrollment.create({
        student: req.user._id,
        course: courseId,
      });
      course.totalEnrolled = (course.totalEnrolled || 0) + 1;
      await course.save();
    }

    // Mark all lessons completed
    const lessons = await Lesson.find({ course: courseId });
    enrollment.completedLessons = lessons.map((l) => ({
      lesson: l._id,
      completedAt: new Date(),
    }));
    enrollment.progressPercentage = 100;
    enrollment.isCompleted = true;
    enrollment.completedAt = new Date();
    if (lessons.length > 0) {
      enrollment.lastAccessedLesson = lessons[lessons.length - 1]._id;
    }
    await enrollment.save();

    // Check or generate certificate for THIS course
    let certificate = await Certificate.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!certificate) {
      certificate = await generateCertificate({
        student: req.user,
        course,
        instructor: course.instructor,
        enrollmentId: enrollment._id,
      });
    } else {
      enrollment.certificate = certificate._id;
      await enrollment.save();
    }

    const updatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('certificate')
      .populate('completedLessons.lesson');

    res.status(200).json({
      success: true,
      message: `Course '${course.title}' completed successfully! Certificate generated.`,
      enrollment: updatedEnrollment,
      certificate,
    });
  } catch (error) {
    next(error);
  }
};
