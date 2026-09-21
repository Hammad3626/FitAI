const TrainerRequest = require('../models/TrainerRequest');
const TrainerClient = require('../models/TrainerClient');
const TrainerWorkoutPlan = require('../models/TrainerWorkoutPlan');
const TrainerNutritionPlan = require('../models/TrainerNutritionPlan');
const TrainerMessage = require('../models/TrainerMessage');

// @desc    Get user's active trainer and pending requests
// @route   GET /api/user-trainer/status
// @access  Private
// @desc    Get user's active trainer and pending requests
// @route   GET /api/user-trainer/status
// @access  Private
const getMyTrainerStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check active connection
    const activeConnection = await TrainerClient.findOne({
      client: userId,
      status: 'active',
    }).populate('trainer', 'displayName email phone profileImage specialization experience bio location availability rating');

    // Check pending requests
    const pendingRequest = await TrainerRequest.findOne({
      user: userId,
      status: 'pending',
    }).populate('trainer', 'displayName email profileImage specialization');

    // Count unread messages & get last message
    let unreadMessagesCount = 0;
    let lastMessage = null;

    if (activeConnection) {
      unreadMessagesCount = await TrainerMessage.countDocuments({
        client: userId,
        trainer: activeConnection.trainer._id,
        receiver: userId,
        read: false,
      });

      lastMessage = await TrainerMessage.findOne({
        client: userId,
        trainer: activeConnection.trainer._id,
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'displayName avatarUrl profileImage role');
    }

    res.json({
      connectedTrainer: activeConnection ? activeConnection.trainer : null,
      clientConnection: activeConnection,
      pendingRequest,
      unreadMessagesCount,
      lastMessage,
    });
  } catch (error) {
    console.error('getMyTrainerStatus error:', error);
    res.status(500).json({ message: 'Server error retrieving trainer status' });
  }
};

// @desc    Get workout plans assigned to the user by their trainer
// @route   GET /api/user-trainer/workouts
// @access  Private
const getMyAssignedWorkouts = async (req, res) => {
  try {
    const userId = req.user._id;
    const plans = await TrainerWorkoutPlan.find({ client: userId })
      .populate('trainer', 'displayName specialization profileImage')
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    console.error('getMyAssignedWorkouts error:', error);
    res.status(500).json({ message: 'Server error retrieving assigned workouts' });
  }
};

// @desc    Get nutrition plans assigned to the user by their trainer
// @route   GET /api/user-trainer/nutrition
// @access  Private
const getMyAssignedNutrition = async (req, res) => {
  try {
    const userId = req.user._id;
    const plans = await TrainerNutritionPlan.find({ client: userId })
      .populate('trainer', 'displayName specialization profileImage')
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    console.error('getMyAssignedNutrition error:', error);
    res.status(500).json({ message: 'Server error retrieving assigned nutrition plans' });
  }
};

// @desc    Get messages between user and their trainer
// @route   GET /api/user-trainer/messages or /api/user-trainer/messages/:trainerId
// @access  Private
const getMyTrainerMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetTrainerId = req.params.trainerId;

    let trainerId = targetTrainerId;

    if (!trainerId) {
      // Find active trainer
      const connection = await TrainerClient.findOne({ client: userId, status: 'active' });
      if (!connection) {
        return res.json([]);
      }
      trainerId = connection.trainer;
    } else {
      // Security check: verify this user is actually a client of this trainer
      const validConnection = await TrainerClient.findOne({
        client: userId,
        trainer: trainerId,
      });
      if (!validConnection) {
        return res.status(403).json({ message: 'Access denied: You are not connected with this trainer' });
      }
    }

    const messages = await TrainerMessage.find({
      client: userId,
      trainer: trainerId,
    })
      .populate('sender', 'displayName avatarUrl profileImage role')
      .sort({ createdAt: 1 });

    // Mark messages sent to user as read
    await TrainerMessage.updateMany(
      { client: userId, trainer: trainerId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    console.error('getMyTrainerMessages error:', error);
    res.status(500).json({ message: 'Server error retrieving messages' });
  }
};

// @desc    Send message from user to trainer
// @route   POST /api/user-trainer/messages or /api/user-trainer/messages/:trainerId
// @access  Private
const sendMyTrainerMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetTrainerId = req.params.trainerId || req.body.trainerId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    let trainerId = targetTrainerId;

    if (!trainerId) {
      // Find active trainer
      const connection = await TrainerClient.findOne({ client: userId, status: 'active' });
      if (!connection) {
        return res.status(400).json({ message: 'You do not have an active trainer connection' });
      }
      trainerId = connection.trainer;
    } else {
      // Security check: verify connection
      const validConnection = await TrainerClient.findOne({
        client: userId,
        trainer: trainerId,
        status: 'active',
      });
      if (!validConnection) {
        return res.status(403).json({ message: 'Access denied: You do not have an active connection with this trainer' });
      }
    }

    const message = await TrainerMessage.create({
      sender: userId,
      receiver: trainerId,
      trainer: trainerId,
      client: userId,
      content: content.trim(),
      read: false,
    });

    const populated = await TrainerMessage.findById(message._id).populate('sender', 'displayName avatarUrl profileImage role');

    res.status(201).json(populated);
  } catch (error) {
    console.error('sendMyTrainerMessage error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// @desc    Mark conversation messages as read
// @route   PUT /api/user-trainer/messages/read or /api/user-trainer/messages/:trainerId/read
// @access  Private
const markMessagesRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const trainerId = req.params.trainerId;

    const query = { client: userId, receiver: userId, read: false };
    if (trainerId) {
      query.trainer = trainerId;
    }

    await TrainerMessage.updateMany(query, { $set: { read: true } });
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('markMessagesRead error:', error);
    res.status(500).json({ message: 'Server error marking messages as read' });
  }
};

module.exports = {
  getMyTrainerStatus,
  getMyAssignedWorkouts,
  getMyAssignedNutrition,
  getMyTrainerMessages,
  sendMyTrainerMessage,
  markMessagesRead,
};
