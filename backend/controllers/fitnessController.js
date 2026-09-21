const FitnessData = require('../models/FitnessData');

// @desc    Get fitness data for logged in user
// @route   GET /api/fitness-data
// @access  Private
const getFitnessData = async (req, res) => {
  try {
    let data = await FitnessData.findOne({ user: req.user._id });

    // Auto-create initial data record if not found
    if (!data) {
      data = await FitnessData.create({
        user: req.user._id,
        goal: 'Build healthy fitness habits',
        weeklyTarget: 4,
        workoutsThisWeek: 0,
        waterCups: 0,
        savedWorkouts: [],
      });
    }

    res.json(data);
  } catch (error) {
    console.error('getFitnessData error:', error);
    res.status(500).json({ message: 'Server error retrieving fitness data' });
  }
};

// @desc    Update or upsert fitness data for logged in user
// @route   PUT /api/fitness-data
// @access  Private
const updateFitnessData = async (req, res) => {
  try {
    const { goal, weeklyTarget, workoutsThisWeek, waterCups, savedWorkouts } = req.body;

    const updateFields = {};
    if (goal !== undefined) updateFields.goal = goal;
    if (weeklyTarget !== undefined) updateFields.weeklyTarget = weeklyTarget;
    if (workoutsThisWeek !== undefined) updateFields.workoutsThisWeek = workoutsThisWeek;
    if (waterCups !== undefined) updateFields.waterCups = waterCups;
    if (savedWorkouts !== undefined) updateFields.savedWorkouts = savedWorkouts;

    const data = await FitnessData.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(data);
  } catch (error) {
    console.error('updateFitnessData error:', error);
    res.status(500).json({ message: error.message || 'Server error updating fitness data' });
  }
};

module.exports = {
  getFitnessData,
  updateFitnessData,
};
