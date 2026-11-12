import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const { category, level, search, minPrice, maxPrice, sort } = req.query;
    const query = { status: 'published' };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (level && level !== 'All Levels') {
      query.level = level;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { enrolledCount: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar headline')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseBySlugOrId = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { slug: identifier };

    const course = await Course.findOne(query).populate('instructor', 'name avatar headline bio');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Retrieve lessons for this course
    const lessons = await Lesson.find({ course: course._id })
      .select('-video.rawFilePath')
      .sort({ order: 1 });

    // Check if current requesting user is enrolled
    let isEnrolled = false;
    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
      if (enrollment) isEnrolled = true;
    }

    res.status(200).json({
      success: true,
      course,
      lessons,
      isEnrolled,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      description,
      category,
      level,
      thumbnail,
      price,
      tags,
      requirements,
      whatYouWillLearn,
      sections,
    } = req.body;

    const course = await Course.create({
      title,
      subtitle,
      description,
      category,
      level,
      thumbnail: thumbnail || undefined,
      price: price || 0,
      tags: tags || [],
      requirements: requirements || [],
      whatYouWillLearn: whatYouWillLearn || [],
      sections: sections || [{ title: 'Module 1: Introduction', order: 0 }],
      instructor: req.user._id,
      isPublished: true,
      status: 'published',
    });

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Ensure instructor owns course or is admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this course.' });
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({
      success: true,
      course: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course.' });
    }

    await Course.findByIdAndDelete(req.params.id);
    await Lesson.deleteMany({ course: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Course and related lessons deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

