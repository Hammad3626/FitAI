const express = require('express');
const router = express.Router();
const {
  signupTrainer,
  signinTrainer,
  getTrainerProfile,
  updateTrainerProfile,
  getTrainerDashboardStats,
  getTrainerClients,
  getTrainerRequests,
  acceptTrainerRequest,
  rejectTrainerRequest,
  getTrainerWorkoutPlans,
  createTrainerWorkoutPlan,
  updateTrainerWorkoutPlan,
  deleteTrainerWorkoutPlan,
  getTrainerNutritionPlans,
  createTrainerNutritionPlan,
  updateTrainerNutritionPlan,
  deleteTrainerNutritionPlan,
  getTrainerMessages,
  sendTrainerMessage,
  getPublicTrainers,
  getPublicTrainerById,
  requestTraining,
} = require('../controllers/trainerController');
const { protect, protectTrainer } = require('../middleware/auth');

// Public authentication routes
router.post('/signup', signupTrainer);
router.post('/signin', signinTrainer);

// Public trainer discovery routes
router.get('/', getPublicTrainers);

// Trainer protected profile routes (must precede /:id)
router.get('/profile', protectTrainer, getTrainerProfile);
router.put('/profile', protectTrainer, updateTrainerProfile);
router.get('/dashboard/stats', protectTrainer, getTrainerDashboardStats);

// Trainer protected clients & requests
router.get('/clients', protectTrainer, getTrainerClients);
router.get('/requests', protectTrainer, getTrainerRequests);
router.post('/requests/:id/accept', protectTrainer, acceptTrainerRequest);
router.post('/requests/:id/reject', protectTrainer, rejectTrainerRequest);

// Trainer protected workout plans
router.get('/workouts', protectTrainer, getTrainerWorkoutPlans);
router.post('/workouts', protectTrainer, createTrainerWorkoutPlan);
router.put('/workouts/:id', protectTrainer, updateTrainerWorkoutPlan);
router.delete('/workouts/:id', protectTrainer, deleteTrainerWorkoutPlan);

// Trainer protected nutrition plans
router.get('/nutrition', protectTrainer, getTrainerNutritionPlans);
router.post('/nutrition', protectTrainer, createTrainerNutritionPlan);
router.put('/nutrition/:id', protectTrainer, updateTrainerNutritionPlan);
router.delete('/nutrition/:id', protectTrainer, deleteTrainerNutritionPlan);

// Trainer protected messaging
router.get('/messages/:clientId', protectTrainer, getTrainerMessages);
router.post('/messages/:clientId', protectTrainer, sendTrainerMessage);

// User-facing trainer actions
router.post('/:id/request', protect, requestTraining);
router.get('/:id', getPublicTrainerById);

module.exports = router;
