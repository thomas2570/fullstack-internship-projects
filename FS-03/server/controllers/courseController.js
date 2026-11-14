import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';
import { Review } from '../models/Review.js';

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

    // Retrieve reviews for this course
    const reviews = await Review.find({ course: course._id })
      .populate('student', 'name avatar role')
      .sort({ createdAt: -1 });

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
      reviews,
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

export const getCourseReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const isObjectId = courseId.match(/^[0-9a-fA-F]{24}$/);
    const course = isObjectId ? await Course.findById(courseId) : await Course.findOne({ slug: courseId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const reviews = await Review.find({ course: course._id })
      .populate('student', 'name avatar role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const addCourseReview = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a star rating between 1 and 5.' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Please write a review comment.' });
    }

    const isObjectId = courseId.match(/^[0-9a-fA-F]{24}$/);
    const course = isObjectId ? await Course.findById(courseId) : await Course.findOne({ slug: courseId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Upsert review (one review per user per course)
    const review = await Review.findOneAndUpdate(
      { course: course._id, student: req.user._id },
      { rating: numRating, comment: comment.trim() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('student', 'name avatar role');

    // Recalculate average rating & review count for this specific course
    const allReviews = await Review.find({ course: course._id });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10;

    course.averageRating = avgRating;
    course.reviewCount = allReviews.length;
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Review saved successfully!',
      review,
      averageRating: avgRating,
      reviewCount: allReviews.length,
    });
  } catch (error) {
    next(error);
  }
};

