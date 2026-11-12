import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  verificationHash: {
    type: String,
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  courseTitle: {
    type: String,
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  instructorName: {
    type: String,
    required: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  pdfPath: {
    type: String, // local file path
  },
  pdfUrl: {
    type: String, // public URL to download
  },
  qrCodeDataUrl: {
    type: String,
  },
  verificationUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

export const Certificate = mongoose.model('Certificate', certificateSchema);

