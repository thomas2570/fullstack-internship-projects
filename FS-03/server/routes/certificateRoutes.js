import express from 'express';
import {
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
  downloadCertificatePdf,
} from '../controllers/certificateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public verification endpoints
router.get('/verify/:certificateId', verifyCertificate);
router.get('/download/:certificateId', downloadCertificatePdf);

// Authenticated student endpoints
router.get('/my', protect, getMyCertificates);
router.get('/:id', protect, getCertificateById);

export default router;

