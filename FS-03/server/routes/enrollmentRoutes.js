import express from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  getEnrollmentProgress,
  markLessonComplete,
  completeEntireCourse,
} from '../controllers/enrollmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/enroll', enrollInCourse);
router.get('/my', getMyEnrollments);
router.get('/progress/:courseId', getEnrollmentProgress);
router.post('/complete-lesson', markLessonComplete);
router.post('/complete-course', completeEntireCourse);

export default router;
