import express from 'express';
import { createCheckoutSession, confirmPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/checkout', createCheckoutSession);
router.post('/confirm', confirmPayment);

export default router;

