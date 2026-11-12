import mongoose from 'mongoose';

const liveSessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  scheduledStartTime: {
    type: Date,
    required: true,
  },
  scheduledDurationMinutes: {
    type: Number,
    default: 60,
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled',
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
  activeParticipants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    socketId: { type: String },
    name: { type: String },
    role: { type: String },
    joinedAt: { type: Date, default: Date.now },
  }],
  recordingUrl: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export const LiveSession = mongoose.model('LiveSession', liveSessionSchema);

