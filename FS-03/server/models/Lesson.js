import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  sectionTitle: {
    type: String,
    required: true,
    default: 'General',
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  contentType: {
    type: String,
    enum: ['video', 'quiz', 'article'],
    default: 'video',
  },
  video: {
    rawFileName: { type: String },
    rawFilePath: { type: String },
    hlsMasterPlaylist: { type: String }, // Relative path e.g. "lessonId/master.m3u8"
    streamingUrl: { type: String },       // CloudFront or local delivery URL
    duration: { type: Number, default: 0 }, // in seconds
    thumbnailUrl: { type: String },
    transcodeStatus: {
      type: String,
      enum: ['none', 'pending', 'processing', 'ready', 'failed'],
      default: 'none',
    },
    transcodeProgress: { type: Number, default: 0 },
    renditions: [{
      resolution: String, // 360p, 720p, 1080p
      playlistUrl: String,
      bitrate: String,
    }],
    errorMessage: { type: String },
  },
  articleContent: {
    type: String,
    default: '',
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
  },
  isFreePreview: {
    type: Boolean,
    default: false,
  },
  resources: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
  }],
}, {
  timestamps: true,
});

export const Lesson = mongoose.model('Lesson', lessonSchema);

