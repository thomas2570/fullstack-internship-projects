import express from 'express';
import {
  getAllCourses,
  getCourseBySlugOrId,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseReviews,
  addCourseReview
} from '../controllers/courseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllCourses);
router.get('/:courseId/reviews', getCourseReviews);
router.post('/:courseId/reviews', protect, addCourseReview);

router.get('/:identifier', (req, res, next) => {
  // Optional auth to detect user enrollment
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, () => getCourseBySlugOrId(req, res, next));
  }
  return getCourseBySlugOrId(req, res, next);
});

router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

export default router;

