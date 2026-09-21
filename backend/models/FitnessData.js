const mongoose = require('mongoose');

// FitnessData Model — stores goal, weekly target, workouts, water intake, saved workouts
// (replaces Supabase public.user_fitness_data)
const fitnessDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    goal: {
      type: String,
      default: 'Build healthy fitness habits',
      trim: true,
    },
    weeklyTarget: {
      type: Number,
      default: 4,
      min: 1,
      max: 14,
    },
    workoutsThisWeek: {
      type: Number,
      default: 0,
      min: 0,
    },
    waterCups: {
      type: Number,
      default: 0,
      min: 0,
      max: 30,
    },
    savedWorkouts: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FitnessData', fitnessDataSchema);
