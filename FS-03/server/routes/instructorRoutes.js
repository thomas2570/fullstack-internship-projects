import express from 'express';
import {
  getInstructorDashboardStats,
  getInstructorCourses,
  requestPayout,
  getPayoutHistory,
} from '../controllers/instructorController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('instructor', 'admin'));

router.get('/dashboard-stats', getInstructorDashboardStats);
router.get('/courses', getInstructorCourses);
router.post('/payout-request', requestPayout);
router.get('/payout-history', getPayoutHistory);

export default router;

