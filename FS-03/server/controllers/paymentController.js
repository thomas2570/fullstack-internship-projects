import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { Transaction } from '../models/Transaction.js';
import { Lesson } from '../models/Lesson.js';

export const createCheckoutSession = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
    }

    const platformRate = (parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '30', 10)) / 100;
    const amount = course.price;
    const platformFee = Math.round(amount * platformRate * 100) / 100;
    const instructorEarnings = Math.round((amount - platformFee) * 100) / 100;

    const paymentIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    res.status(200).json({
      success: true,
      checkoutSession: {
        paymentIntentId,
        courseId: course._id,
        courseTitle: course.title,
        price: amount,
        currency: course.currency || 'USD',
        platformFee,
        instructorEarnings,
        instructorName: course.instructor?.name,
        clientSecret: `cs_test_${paymentIntentId}`,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { courseId, paymentIntentId, paymentProvider = 'stripe_test' } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already enrolled
    let enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (enrollment) {
      return res.status(200).json({
        success: true,
        message: 'Already enrolled.',
        enrollment,
      });
    }

    const platformRate = (parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '30', 10)) / 100;
    const amount = course.price;
    const platformFee = Math.round(amount * platformRate * 100) / 100;
    const instructorEarnings = Math.round((amount - platformFee) * 100) / 100;

    // 1. Create Transaction Record
    const transaction = await Transaction.create({
      student: req.user._id,
      course: courseId,
      instructor: course.instructor,
      amount,
      currency: course.currency || 'USD',
      platformFee,
      instructorEarnings,
      paymentProvider,
      paymentIntentId: paymentIntentId || `pi_test_${Date.now()}`,
      status: 'completed',
    });

    // 2. Credit Instructor Earnings in User record
    await User.findByIdAndUpdate(course.instructor, {
      $inc: {
        'earnings.totalRevenue': amount,
        'earnings.netEarnings': instructorEarnings,
        'earnings.pendingBalance': instructorEarnings,
      }
    });

    // 3. Create Enrollment
    const firstLesson = await Lesson.findOne({ course: courseId }).sort({ order: 1 });

    enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      transaction: transaction._id,
      lastAccessedLesson: firstLesson?._id,
      progressPercentage: 0,
      isCompleted: false,
    });

    // 4. Update Course enrolled count
    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

    res.status(200).json({
      success: true,
      message: 'Payment confirmed and enrollment activated!',
      transaction,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

