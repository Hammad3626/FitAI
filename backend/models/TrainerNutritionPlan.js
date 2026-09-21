const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema(
  {
    mealName: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: String,
      default: '',
      trim: true,
    },
    calories: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const trainerNutritionPlanSchema = new mongoose.Schema(
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
      required: [true, 'Please provide a nutrition plan title'],
      trim: true,
    },
    dailyCalories: {
      type: Number,
      default: 2000,
    },
    proteinGrams: {
      type: Number,
      default: 150,
    },
    carbsGrams: {
      type: Number,
      default: 200,
    },
    fatsGrams: {
      type: Number,
      default: 65,
    },
    meals: {
      type: [mealItemSchema],
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

trainerNutritionPlanSchema.index({ trainer: 1, client: 1 });

module.exports = mongoose.model('TrainerNutritionPlan', trainerNutritionPlanSchema);
