import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 10,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending',
  },
  payoutMethod: {
    type: String,
    enum: ['paypal', 'bank_transfer'],
    required: true,
  },
  accountDetails: {
    type: String,
    required: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
  },
  adminNotes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema);

