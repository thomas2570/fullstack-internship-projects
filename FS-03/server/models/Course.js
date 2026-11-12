import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  slug: {
    type: String,
    lowercase: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile Development', 'Data Science & AI', 'Cloud Computing', 'Cybersecurity', 'DevOps & Architecture', 'Design & UI/UX'],
    default: 'Web Development',
  },
  level: {
    type: String,
    enum: ['All Levels', 'Beginner', 'Intermediate', 'Advanced'],
    default: 'All Levels',
  },
  thumbnail: {
    type: String,
    default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  },
  previewVideoUrl: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  },
  tags: [{ type: String }],
  requirements: [{ type: String }],
  whatYouWillLearn: [{ type: String }],
  sections: [{
    title: { type: String, required: true },
    order: { type: Number, default: 0 }
  }],
  totalDuration: {
    type: Number, // in minutes
    default: 0,
  },
  totalLessons: {
    type: Number,
    default: 0,
  },
  enrolledCount: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 4.8,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

courseSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  next();
});

export const Course = mongoose.model('Course', courseSchema);

