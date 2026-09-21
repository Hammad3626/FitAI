const CustomRoutine = require('../models/CustomRoutine');

// @desc    Get all custom routines for logged in user
// @route   GET /api/routines
// @access  Private
const getRoutines = async (req, res) => {
  try {
    const routines = await CustomRoutine.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(routines);
  } catch (error) {
    console.error('getRoutines error:', error);
    res.status(500).json({ message: 'Server error retrieving routines' });
  }
};

// @desc    Create a new custom routine
// @route   POST /api/routines
// @access  Private
const createRoutine = async (req, res) => {
  try {
    const {
      title,
      goal,
      level,
      equipment,
      daysPerWeek,
      timeMin,
      focus,
      injuries,
      intensity,
      content,
      dayNumber,
      cycleId,
      completed,
      completedExercises,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and routine content are required' });
    }

    const routine = await CustomRoutine.create({
      user: req.user._id,
      title,
      goal,
      level,
      equipment,
      daysPerWeek,
      timeMin,
      focus,
      injuries,
      intensity,
      content,
      dayNumber: dayNumber || 1,
      cycleId: cycleId || undefined,
      completed: completed || false,
      completedExercises: completedExercises || [],
    });

    res.status(201).json(routine);
  } catch (error) {
    console.error('createRoutine error:', error);
    res.status(500).json({ message: error.message || 'Server error creating routine' });
  }
};

// @desc    Update a custom routine (e.g. mark completed, update exercise checklist)
// @route   PUT /api/routines/:id
// @access  Private
const updateRoutine = async (req, res) => {
  try {
    const routine = await CustomRoutine.findOne({ _id: req.params.id, user: req.user._id });

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found or unauthorized' });
    }

    const { completed, completedAt, completedExercises, title, content } = req.body;

    if (completed !== undefined) routine.completed = completed;
    if (completedAt !== undefined) routine.completedAt = completedAt;
    if (completedExercises !== undefined) routine.completedExercises = completedExercises;
    if (title !== undefined) routine.title = title;
    if (content !== undefined) routine.content = content;

    const updated = await routine.save();
    res.json(updated);
  } catch (error) {
    console.error('updateRoutine error:', error);
    res.status(500).json({ message: error.message || 'Server error updating routine' });
  }
};

// @desc    Delete a custom routine
// @route   DELETE /api/routines/:id
// @access  Private
const deleteRoutine = async (req, res) => {
  try {
    const routine = await CustomRoutine.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found or unauthorized' });
    }

    res.json({ message: 'Routine removed successfully', id: req.params.id });
  } catch (error) {
    console.error('deleteRoutine error:', error);
    res.status(500).json({ message: 'Server error deleting routine' });
  }
};

// @desc    Delete all routines in a cycle
// @route   DELETE /api/routines/cycle/:cycleId
// @access  Private
const deleteCycle = async (req, res) => {
  try {
    const result = await CustomRoutine.deleteMany({
      user: req.user._id,
      cycleId: req.params.cycleId,
    });

    res.json({ message: 'Cycle routines removed successfully', count: result.deletedCount });
  } catch (error) {
    console.error('deleteCycle error:', error);
    res.status(500).json({ message: 'Server error deleting cycle routines' });
  }
};

module.exports = {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  deleteCycle,
};
