import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Certificate } from '../models/Certificate.js';
import { Enrollment } from '../models/Enrollment.js';

/**
 * Generates an official verified PDF certificate for a completed course enrollment.
 */
export const generateCertificate = async ({ student, course, instructor, enrollmentId }) => {
  const certsDir = path.resolve('uploads', 'certificates');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // 1. Unique Certificate ID and Verification Hash
  const dateStr = new Date().toISOString().split('T')[0];
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  const certificateId = `EDF-${new Date().getFullYear()}-${randomHex}`;

  const secretSalt = process.env.JWT_SECRET || 'eduflow_cert_secret';
  const verificationHash = crypto
    .createHmac('sha256', secretSalt)
    .update(`${student.name}|${course.title}|${student._id}|${dateStr}`)
    .digest('hex');

  const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationUrl = `${clientBaseUrl}/verify-certificate/${certificateId}`;

  // 2. Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 140,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff'
    }
  });

  const pdfFileName = `${certificateId}.pdf`;
  const pdfPath = path.join(certsDir, pdfFileName);
  const pdfUrl = `/uploads/certificates/${pdfFileName}`;

  // 3. Create PDF with PDFKit (Landscape Letter: 792 x 612 pt)
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [792, 612],
      margins: { top: 30, bottom: 30, left: 30, right: 30 },
    });

    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Background Canvas
    doc.rect(0, 0, 792, 612).fill('#ffffff');

    // Outer Border
    doc.lineWidth(4).strokeColor('#4f46e5');
    doc.rect(20, 20, 752, 572).stroke();

    // Inner Accent Border
    doc.lineWidth(1).strokeColor('#c7d2fe');
    doc.rect(28, 28, 736, 556).stroke();

    // Header Badge / Logo Title
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#4f46e5')
       .text('EDUFLOW ACADEMY', 0, 55, { align: 'center', characterSpacing: 2 });

    doc.moveDown(0.5);
    doc.fontSize(32).font('Helvetica-Bold').fillColor('#1e1b4b')
       .text('CERTIFICATE OF COMPLETION', { align: 'center', characterSpacing: 1.5 });

    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#64748b')
       .text('THIS IS TO OFFICIALLY CERTIFY THAT', { align: 'center', characterSpacing: 3 });

    // Student Name
    doc.moveDown(0.8);
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#0f172a')
       .text(student.name, { align: 'center' });

    // Underline accent
    const textWidth = doc.widthOfString(student.name);
    const startX = (792 - Math.max(textWidth, 280)) / 2;
    doc.moveTo(startX, doc.y + 4).lineTo(startX + Math.max(textWidth, 280), doc.y + 4).lineWidth(2).strokeColor('#6366f1').stroke();

    // Description text
    doc.moveDown(1.2);
    doc.fontSize(13).font('Helvetica').fillColor('#475569')
       .text('has successfully completed all lessons, assignments, hands-on projects, and passing quizzes for', { align: 'center' });

    // Course Title
    doc.moveDown(0.4);
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#312e81')
       .text(course.title, { align: 'center' });

    // Issue Date & Details
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Lower Section: Instructor signature, Seal/QR Code, Verification Code
    const bottomY = 440;

    // Instructor column (Left)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
       .text(instructor?.name || 'Lead Instructor', 80, bottomY);
    doc.moveTo(80, bottomY - 5).lineTo(260, bottomY - 5).lineWidth(1).strokeColor('#94a3b8').stroke();
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
       .text('Authorized Instructor & Academic Lead', 80, bottomY + 16);

    // Date & ID column (Center)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b')
       .text(`Issued On: ${formattedDate}`, 320, bottomY, { width: 180, align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
       .text(`Certificate ID: ${certificateId}`, 320, bottomY + 16, { width: 180, align: 'center' });

    // QR Code column (Right)
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, 610, bottomY - 30, { width: 85, height: 85 });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b')
       .text('Scan to Verify Online', 600, bottomY + 60, { width: 105, align: 'center' });

    // Cryptographic hash footer
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
       .text(`Verification Hash: ${verificationHash}`, 40, 560, { width: 712, align: 'center' });

    doc.end();

    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  // 4. Persist Certificate record in database
  const certRecord = await Certificate.create({
    certificateId,
    verificationHash,
    student: student._id,
    studentName: student.name,
    course: course._id,
    courseTitle: course.title,
    instructor: instructor?._id || course.instructor,
    instructorName: instructor?.name || 'EduFlow Instructor',
    issueDate: new Date(),
    pdfPath,
    pdfUrl,
    qrCodeDataUrl,
    verificationUrl,
  });

  // Link certificate back to enrollment
  if (enrollmentId) {
    await Enrollment.findByIdAndUpdate(enrollmentId, {
      certificate: certRecord._id,
      isCompleted: true,
      progressPercentage: 100,
      completedAt: new Date(),
    });
  }

  return certRecord;
};

