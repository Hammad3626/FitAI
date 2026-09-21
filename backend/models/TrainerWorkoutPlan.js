const mongoose = require('mongoose');

const exerciseItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sets: {
      type: String,
      default: '3',
      trim: true,
    },
    reps: {
      type: String,
      default: '10-12',
      trim: true,
    },
    restTime: {
      type: String,
      default: '60s',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const trainerWorkoutPlanSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a workout plan title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    goal: {
      type: String,
      default: 'Strength & Fitness',
      trim: true,
    },
    duration: {
      type: String,
      default: '4 weeks',
      trim: true,
    },
    schedule: {
      type: String,
      default: '3 days / week',
      trim: true,
    },
    exercises: {
      type: [exerciseItemSchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

trainerWorkoutPlanSchema.index({ trainer: 1, client: 1 });

module.exports = mongoose.model('TrainerWorkoutPlan', trainerWorkoutPlanSchema);
