import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { PayoutRequest } from '../models/PayoutRequest.js';
import { Enrollment } from '../models/Enrollment.js';

export const getInstructorDashboardStats = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const instructor = await User.findById(instructorId);

    // Get all courses owned by instructor
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map(c => c._id);

    // Total students across all instructor courses
    const totalEnrollments = await Enrollment.countDocuments({ course: { $in: courseIds } });

    // Recent transactions for this instructor's courses
    const recentTransactions = await Transaction.find({ instructor: instructorId })
      .populate('student', 'name email avatar')
      .populate('course', 'title price')
      .sort({ createdAt: -1 })
      .limit(10);

    // Total transactions count and computed earnings
    const transactions = await Transaction.find({ instructor: instructorId, status: 'completed' });
    const computedTotalRevenue = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const computedNetEarnings = transactions.reduce((acc, t) => acc + (t.instructorEarnings || 0), 0);

    // Course breakdown
    const coursePerformance = courses.map(course => {
      const courseTx = transactions.filter(t => t.course.toString() === course._id.toString());
      const revenue = courseTx.reduce((acc, t) => acc + (t.amount || 0), 0);
      const instructorRevenue = courseTx.reduce((acc, t) => acc + (t.instructorEarnings || 0), 0);
      return {
        _id: course._id,
        title: course.title,
        price: course.price,
        enrolledCount: course.enrolledCount,
        averageRating: course.averageRating,
        totalRevenue: revenue,
        instructorRevenue,
        thumbnail: course.thumbnail,
      };
    });

    // Monthly revenue aggregation for chart
    const monthlyRevenueMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyRevenueMap[key] = { month: key, revenue: 0, earnings: 0, sales: 0 };
    }

    transactions.forEach(t => {
      const d = new Date(t.createdAt);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyRevenueMap[key]) {
        monthlyRevenueMap[key].revenue += t.amount || 0;
        monthlyRevenueMap[key].earnings += t.instructorEarnings || 0;
        monthlyRevenueMap[key].sales += 1;
      }
    });

    const monthlyChartData = Object.values(monthlyRevenueMap);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue: Math.max(instructor.earnings?.totalRevenue || 0, computedTotalRevenue),
        netEarnings: Math.max(instructor.earnings?.netEarnings || 0, computedNetEarnings),
        pendingBalance: instructor.earnings?.pendingBalance || 0,
        withdrawnAmount: instructor.earnings?.withdrawnAmount || 0,
        totalStudents: totalEnrollments,
        totalCourses: courses.length,
      },
      coursePerformance,
      recentTransactions,
      monthlyChartData,
      payoutInfo: instructor.payoutInfo,
    });
  } catch (error) {
    next(error);
  }
};

export const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

export const requestPayout = async (req, res, next) => {
  try {
    const { amount, payoutMethod, accountDetails } = req.body;
    const instructor = await User.findById(req.user._id);

    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum payout amount is $10.' });
    }

    if (amount > (instructor.earnings?.pendingBalance || 0)) {
      return res.status(400).json({
        success: false,
        message: `Requested amount ($${amount}) exceeds available pending balance ($${instructor.earnings?.pendingBalance || 0}).`
      });
    }

    const payout = await PayoutRequest.create({
      instructor: instructor._id,
      amount,
      payoutMethod: payoutMethod || 'paypal',
      accountDetails: accountDetails || instructor.payoutInfo?.paypalEmail || 'Default Account',
      status: 'pending',
    });

    // Deduct from pending balance
    instructor.earnings.pendingBalance -= amount;
    await instructor.save();

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully. Processing typically takes 24-48 hours.',
      payout,
      remainingBalance: instructor.earnings.pendingBalance,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayoutHistory = async (req, res, next) => {
  try {
    const payouts = await PayoutRequest.find({ instructor: req.user._id }).sort({ requestedAt: -1 });
    res.status(200).json({
      success: true,
      payouts,
    });
  } catch (error) {
    next(error);
  }
};

