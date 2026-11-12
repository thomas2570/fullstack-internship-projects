import path from 'path';
import fs from 'fs';
import { Lesson } from '../models/Lesson.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { videoTranscodeQueue } from '../config/queue.js';
import { getStreamingUrl } from '../config/aws.js';

export const createLesson = async (req, res, next) => {
  try {
    const { courseId, title, description, sectionTitle, order, contentType, isFreePreview } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add lessons to this course.' });
    }

    const lessonCount = await Lesson.countDocuments({ course: courseId });

    const lesson = await Lesson.create({
      course: courseId,
      title,
      description,
      sectionTitle: sectionTitle || 'Module 1: Introduction',
      order: order !== undefined ? order : lessonCount,
      contentType: contentType || 'video',
      isFreePreview: isFreePreview || false,
    });

    await Course.findByIdAndUpdate(courseId, { $inc: { totalLessons: 1 } });

    res.status(201).json({
      success: true,
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadLessonVideo = async (req, res, next) => {
  try {
    const { id } = req.params; // lesson id
    const lesson = await Lesson.findById(id).populate('course');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (lesson.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to upload video for this lesson.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided.' });
    }

    const inputFilePath = req.file.path;
    const lessonIdStr = lesson._id.toString();
    const relativeHlsDir = lessonIdStr;
    const outputDir = path.resolve('uploads', 'hls', relativeHlsDir);

    // Update lesson video initial status
    lesson.video.rawFileName = req.file.originalname;
    lesson.video.rawFilePath = inputFilePath;
    lesson.video.transcodeStatus = 'pending';
    lesson.video.transcodeProgress = 0;
    await lesson.save();

    // Enqueue transcoding job into BullMQ / Bull queue
    const job = await videoTranscodeQueue.add({
      lessonId: lessonIdStr,
      courseId: lesson.course._id.toString(),
      inputFilePath,
      outputDir,
      relativeHlsDir,
    });

    res.status(202).json({
      success: true,
      message: 'Video uploaded successfully. Transcoding job queued.',
      jobId: job.id,
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        videoStatus: 'pending',
        transcodeProgress: 0,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id).populate('course', 'title instructor price');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Authorization check: Free preview, Instructor owner, Admin, or Enrolled Student
    const isOwnerOrAdmin = req.user && (
      req.user.role === 'admin' ||
      lesson.course.instructor.toString() === req.user._id.toString()
    );

    if (!lesson.isFreePreview && !isOwnerOrAdmin) {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Please log in to view this lesson.' });
      }

      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: lesson.course._id,
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must enroll in this course to access this lesson.',
          requiresEnrollment: true,
        });
      }
    }

    // Refresh streaming URL to ensure it points to correct host / CloudFront
    if (lesson.video?.hlsMasterPlaylist) {
      lesson.video.streamingUrl = getStreamingUrl(lesson.video.hlsMasterPlaylist);
    }

    res.status(200).json({
      success: true,
      lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const getTranscodeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id).select('video title');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    res.status(200).json({
      success: true,
      status: lesson.video?.transcodeStatus || 'none',
      progress: lesson.video?.transcodeProgress || 0,
      streamingUrl: lesson.video?.streamingUrl || '',
      thumbnailUrl: lesson.video?.thumbnailUrl || '',
      errorMessage: lesson.video?.errorMessage || null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (lesson.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this lesson.' });
    }

    const updated = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({
      success: true,
      lesson: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (lesson.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this lesson.' });
    }

    await Lesson.findByIdAndDelete(req.params.id);
    await Course.findByIdAndUpdate(lesson.course._id, { $inc: { totalLessons: -1 } });

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

