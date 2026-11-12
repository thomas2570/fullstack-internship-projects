import express from 'express';
import {
  createLesson,
  uploadLessonVideo,
  getLessonById,
  getTranscodeStatus,
  updateLesson,
  deleteLesson,
} from '../controllers/lessonController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadVideo } from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, authorize('instructor', 'admin'), createLesson);
router.post('/:id/upload-video', protect, authorize('instructor', 'admin'), uploadVideo.single('video'), uploadLessonVideo);
router.get('/:id/transcode-status', getTranscodeStatus);

router.get('/:id', (req, res, next) => {
  // If authorization header is present, run protect
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, () => getLessonById(req, res, next));
  }
  return getLessonById(req, res, next);
});

router.put('/:id', protect, authorize('instructor', 'admin'), updateLesson);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteLesson);

export default router;

