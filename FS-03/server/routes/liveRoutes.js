import express from 'express';
import {
  scheduleLiveSession,
  getCourseLiveSessions,
  getAllLiveSessions,
  getLiveSessionByRoomId,
  endLiveSession,
} from '../controllers/liveController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllLiveSessions);
router.get('/course/:courseId', getCourseLiveSessions);
router.get('/room/:roomId', getLiveSessionByRoomId);

router.post('/schedule', protect, authorize('instructor', 'admin'), scheduleLiveSession);
router.put('/room/:roomId/end', protect, authorize('instructor', 'admin'), endLiveSession);

export default router;

