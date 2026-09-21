const mongoose = require('mongoose');

// CustomRoutine Model — stores AI-generated routines, multi-day cycles, and exercise completion
// (replaces Supabase public.custom_routines)
const customRoutineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      default: '',
      trim: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    equipment: {
      type: String,
      default: '',
      trim: true,
    },
    daysPerWeek: {
      type: Number,
      default: 3,
    },
    timeMin: {
      type: Number,
      default: 30,
    },
    focus: {
      type: String,
      default: '',
      trim: true,
    },
    injuries: {
      type: String,
      default: '',
      trim: true,
    },
    intensity: {
      type: String,
      enum: ['Easy', 'Moderate', 'Hard'],
      default: 'Moderate',
    },
    content: {
      type: String,
      required: true,
    },
    dayNumber: {
      type: Number,
      default: 1,
    },
    cycleId: {
      type: String,
      required: true,
      index: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedExercises: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

customRoutineSchema.index({ user: 1, cycleId: 1, dayNumber: 1 });
customRoutineSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CustomRoutine', customRoutineSchema);
