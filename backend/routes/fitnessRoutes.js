const express = require('express');
const router = express.Router();
const { getFitnessData, updateFitnessData } = require('../controllers/fitnessController');
const { protect } = require('../middleware/auth');

// Fitness Data routes
router.get('/', protect, getFitnessData);
router.put('/', protect, updateFitnessData);

module.exports = router;
