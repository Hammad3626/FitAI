const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    planId: {
      type: String,
      enum: ['free', 'basic', 'pro'],
      default: 'free',
      required: true,
    },
    planName: {
      type: String,
      enum: ['Free', 'Basic', 'Pro'],
      default: 'Free',
      required: true,
    },
    price: {
      type: Number,
      default: 0,
      required: true,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    billingInterval: {
      type: String,
      default: 'month',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'paid', 'failed', 'refunded'],
      default: 'not_required',
    },
    paymentId: {
      type: String,
      default: null,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // null means indefinite for Free plan
    },
    dailyAiQueriesUsed: {
      type: Number,
      default: 0,
    },
    lastQueryDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify if subscription is currently active and not expired
subscriptionSchema.methods.isValid = function () {
  if (this.status !== 'active') return false;
  if (this.endDate && new Date(this.endDate) < new Date()) {
    return false;
  }
  return true;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
