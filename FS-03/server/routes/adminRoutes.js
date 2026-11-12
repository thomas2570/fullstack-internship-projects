import express from 'express';
import {
  getAdminStats,
  getAllPayoutRequests,
  updatePayoutStatus,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/payouts', getAllPayoutRequests);
router.put('/payouts/:id', updatePayoutStatus);

export default router;

