import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Transaction } from '../models/Transaction.js';
import { PayoutRequest } from '../models/PayoutRequest.js';
import { LiveSession } from '../models/LiveSession.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalCourses = await Course.countDocuments();
    const liveSessions = await LiveSession.countDocuments();

    const transactions = await Transaction.find({ status: 'completed' });
    const totalPlatformRevenue = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalPlatformFees = transactions.reduce((acc, t) => acc + (t.platformFee || 0), 0);
    const totalInstructorPayouts = transactions.reduce((acc, t) => acc + (t.instructorEarnings || 0), 0);

    const pendingPayoutsCount = await PayoutRequest.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        liveSessions,
        totalPlatformRevenue,
        totalPlatformFees,
        totalInstructorPayouts,
        pendingPayoutsCount,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPayoutRequests = async (req, res, next) => {
  try {
    const payouts = await PayoutRequest.find()
      .populate('instructor', 'name email earnings payoutInfo avatar')
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      payouts,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayoutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body; // 'approved' | 'rejected' | 'processed' | 'pending'

    if (!['pending', 'approved', 'rejected', 'processed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid payout status requested.' });
    }

    const payout = await PayoutRequest.findById(id).populate('instructor');
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout request not found.' });
    }

    const previousStatus = payout.status;
    payout.status = status;
    payout.adminNotes = adminNotes || payout.adminNotes;

    const instructorId = payout.instructor?._id || payout.instructor;

    if (status === 'processed' || status === 'approved') {
      payout.processedAt = new Date();
      if (instructorId && previousStatus === 'pending') {
        // Increase withdrawnAmount on instructor
        await User.findByIdAndUpdate(instructorId, {
          $inc: { 'earnings.withdrawnAmount': payout.amount }
        });
      }
    } else if (status === 'rejected') {
      if (instructorId && previousStatus === 'pending') {
        // Refund back to pendingBalance
        await User.findByIdAndUpdate(instructorId, {
          $inc: { 'earnings.pendingBalance': payout.amount }
        });
      }
    } else if (status === 'pending') {
      // Reverting back to pending
      payout.processedAt = null;
    }

    await payout.save();

    res.status(200).json({
      success: true,
      message: `Payout request marked as ${status}.`,
      payout,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePayoutRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payout = await PayoutRequest.findByIdAndDelete(id);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout request not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Payout request deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

