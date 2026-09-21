const express = require('express');
const router = express.Router();
const {
  getMyTrainerStatus,
  getMyAssignedWorkouts,
  getMyAssignedNutrition,
  getMyTrainerMessages,
  sendMyTrainerMessage,
  markMessagesRead,
} = require('../controllers/userTrainerController');
const { protect } = require('../middleware/auth');
const { attachSubscription, requirePlan } = require('../middleware/subscription');

router.get('/status', protect, getMyTrainerStatus);
router.get('/workouts', protect, getMyAssignedWorkouts);
router.get('/nutrition', protect, getMyAssignedNutrition);

// Trainer ↔ Client messaging is an exclusive Pro plan feature
router.get('/messages', protect, attachSubscription, requirePlan('pro'), getMyTrainerMessages);
router.post('/messages', protect, attachSubscription, requirePlan('pro'), sendMyTrainerMessage);
router.put('/messages/read', protect, attachSubscription, requirePlan('pro'), markMessagesRead);

module.exports = router;
