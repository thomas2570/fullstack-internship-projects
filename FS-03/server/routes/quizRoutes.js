import express from 'express';
import {
  createQuiz,
  getQuiz,
  submitQuiz,
  getQuizSubmissions,
} from '../controllers/quizController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('instructor', 'admin'), createQuiz);
router.get('/:id', (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, () => getQuiz(req, res, next));
  }
  return getQuiz(req, res, next);
});
router.post('/:id/submit', protect, submitQuiz);
router.get('/:id/submissions', protect, getQuizSubmissions);

export default router;

