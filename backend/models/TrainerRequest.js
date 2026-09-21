const mongoose = require('mongoose');

// TrainerRequest Model — represents user request for training sent to a trainer
const trainerRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    goal: {
      type: String,
      default: '',
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

trainerRequestSchema.index({ trainer: 1, status: 1 });
trainerRequestSchema.index({ user: 1, trainer: 1 });

module.exports = mongoose.model('TrainerRequest', trainerRequestSchema);
