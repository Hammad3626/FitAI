const express = require('express');
const router = express.Router();
const { chatWithCoach, generateCustomRoutine } = require('../controllers/chatController');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  attachSubscription,
  requirePlan,
  checkAiCoachLimit,
} = require('../middleware/subscription');

// AI Chat with daily usage rate limiting by subscription tier
router.post('/', optionalAuth, checkAiCoachLimit, chatWithCoach);

// Personalized Routine Generation requires at least Basic plan
router.post(
  '/generate-routine',
  protect,
  attachSubscription,
  requirePlan('basic'),
  generateCustomRoutine
);

module.exports = router;
