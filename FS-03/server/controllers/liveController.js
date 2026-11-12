import { LiveSession } from '../models/LiveSession.js';
import { Course } from '../models/Course.js';
import crypto from 'crypto';

export const scheduleLiveSession = async (req, res, next) => {
  try {
    const { courseId, title, description, scheduledStartTime, scheduledDurationMinutes } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to schedule live sessions for this course' });
    }

    const roomId = `room-${crypto.randomBytes(4).toString('hex')}-${Date.now().toString(36)}`;

    const session = await LiveSession.create({
      course: courseId,
      instructor: req.user._id,
      title,
      description,
      roomId,
      scheduledStartTime: scheduledStartTime || new Date(),
      scheduledDurationMinutes: scheduledDurationMinutes || 60,
      status: 'scheduled',
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseLiveSessions = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const sessions = await LiveSession.find({ course: courseId })
      .populate('instructor', 'name avatar headline')
      .sort({ scheduledStartTime: -1 });

    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLiveSessions = async (req, res, next) => {
  try {
    const sessions = await LiveSession.find({ status: { $in: ['scheduled', 'live'] } })
      .populate('course', 'title thumbnail category')
      .populate('instructor', 'name avatar headline')
      .sort({ scheduledStartTime: 1 });

    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

export const getLiveSessionByRoomId = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const session = await LiveSession.findOne({ roomId })
      .populate('course', 'title instructor price thumbnail')
      .populate('instructor', 'name avatar headline');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Live session room not found.' });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const endLiveSession = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const session = await LiveSession.findOne({ roomId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }

    if (session.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to end this session' });
    }

    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Live session ended successfully.',
      session,
    });
  } catch (error) {
    next(error);
  }
};

