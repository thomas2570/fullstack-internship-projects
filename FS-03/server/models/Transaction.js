import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
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
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  platformFee: {
    type: Number,
    required: true,
  },
  instructorEarnings: {
    type: Number,
    required: true,
  },
  paymentProvider: {
    type: String,
    enum: ['stripe_test', 'direct_checkout'],
    default: 'stripe_test',
  },
  paymentIntentId: {
    type: String,
    default: () => `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  },
  status: {
    type: String,
    enum: ['completed', 'refunded', 'failed'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

export const Transaction = mongoose.model('Transaction', transactionSchema);

