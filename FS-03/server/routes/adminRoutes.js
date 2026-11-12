import express from 'express';
import {
  getAdminStats,
  getAllPayoutRequests,
  updatePayoutStatus,
  deletePayoutRequest,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/payouts', getAllPayoutRequests);
router.put('/payouts/:id', updatePayoutStatus);
router.delete('/payouts/:id', deletePayoutRequest);

export default router;

