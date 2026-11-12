import { Certificate } from '../models/Certificate.js';
import path from 'path';
import fs from 'fs';

export const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title thumbnail category slug')
      .populate('instructor', 'name avatar')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    next(error);
  }
};

export const getCertificateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findById(id)
      .populate('course', 'title thumbnail category')
      .populate('instructor', 'name avatar')
      .populate('student', 'name email avatar');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId })
      .populate('course', 'title category thumbnail')
      .populate('instructor', 'name headline avatar')
      .populate('student', 'name avatar');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'No certificate found with this verification ID. It may be invalid or forged.',
      });
    }

    res.status(200).json({
      success: true,
      verified: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        instructorName: certificate.instructorName,
        issueDate: certificate.issueDate,
        verificationHash: certificate.verificationHash,
        pdfUrl: certificate.pdfUrl,
        course: certificate.course,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadCertificatePdf = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate || !certificate.pdfPath) {
      return res.status(404).json({ success: false, message: 'Certificate file not found' });
    }

    const resolvedPath = path.resolve(certificate.pdfPath);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, message: 'PDF file is missing on storage.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateId}.pdf"`);
    fs.createReadStream(resolvedPath).pipe(res);
  } catch (error) {
    next(error);
  }
};

