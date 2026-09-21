const express = require('express');
const router = express.Router();
const {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  deleteCycle,
} = require('../controllers/routineController');
const { protect } = require('../middleware/auth');

// Custom Routines routes
router.get('/', protect, getRoutines);
router.post('/', protect, createRoutine);
router.put('/:id', protect, updateRoutine);
router.delete('/:id', protect, deleteRoutine);
router.delete('/cycle/:cycleId', protect, deleteCycle);

module.exports = router;
