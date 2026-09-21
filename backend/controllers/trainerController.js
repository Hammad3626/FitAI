const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TrainerRequest = require('../models/TrainerRequest');
const TrainerClient = require('../models/TrainerClient');
const TrainerWorkoutPlan = require('../models/TrainerWorkoutPlan');
const TrainerNutritionPlan = require('../models/TrainerNutritionPlan');
const TrainerMessage = require('../models/TrainerMessage');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fitai_secret_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new trainer
// @route   POST /api/trainers/signup
// @access  Public
const signupTrainer = async (req, res) => {
  try {
    const {
      name,
      displayName,
      email,
      password,
      confirmPassword,
      phone,
      profileImage,
      specialization,
      experience,
      certifications,
      bio,
      expertise,
      trainingTypes,
      location,
      availability,
      hourlyRate,
    } = req.body;

    const trainerName = (name || displayName || '').trim();

    if (!trainerName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Convert array inputs if provided as string
    const parsedExpertise = Array.isArray(expertise)
      ? expertise
      : typeof expertise === 'string' && expertise.trim()
      ? expertise.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const parsedTrainingTypes = Array.isArray(trainingTypes)
      ? trainingTypes
      : typeof trainingTypes === 'string' && trainingTypes.trim()
      ? trainingTypes.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const trainer = await User.create({
      email: email.toLowerCase(),
      password,
      displayName: trainerName,
      role: 'trainer',
      phone: phone || '',
      profileImage: profileImage || '',
      avatarUrl: profileImage || '',
      specialization: specialization || 'General Fitness',
      experience: experience || '1+ years',
      certifications: certifications || '',
      bio: bio || '',
      expertise: parsedExpertise,
      trainingTypes: parsedTrainingTypes,
      location: location || 'Remote / Online',
      availability: availability || 'Accepting new clients',
      hourlyRate: Number(hourlyRate) || 0,
    });

    res.status(201).json({
      message: 'Trainer account created successfully',
      token: generateToken(trainer._id),
      user: {
        id: trainer._id,
        email: trainer.email,
        displayName: trainer.displayName,
        role: 'trainer',
        phone: trainer.phone,
        profileImage: trainer.profileImage,
        avatarUrl: trainer.avatarUrl,
        specialization: trainer.specialization,
        experience: trainer.experience,
        certifications: trainer.certifications,
        bio: trainer.bio,
        expertise: trainer.expertise,
        trainingTypes: trainer.trainingTypes,
        location: trainer.location,
        availability: trainer.availability,
        hourlyRate: trainer.hourlyRate,
      },
    });
  } catch (error) {
    console.error('Trainer signup error:', error);
    res.status(500).json({ message: error.message || 'Server error creating trainer account' });
  }
};

// @desc    Trainer sign in
// @route   POST /api/trainers/signin
// @access  Public
const signinTrainer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const trainer = await User.findOne({ email: email.toLowerCase() });
    if (!trainer) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await trainer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (trainer.role !== 'trainer') {
      return res.status(403).json({
        message: 'This account is registered as a regular user. Please use standard user sign in.',
      });
    }

    res.json({
      message: 'Trainer logged in successfully',
      token: generateToken(trainer._id),
      user: {
        id: trainer._id,
        email: trainer.email,
        displayName: trainer.displayName,
        role: 'trainer',
        phone: trainer.phone,
        profileImage: trainer.profileImage,
        avatarUrl: trainer.avatarUrl || trainer.profileImage,
        specialization: trainer.specialization,
        experience: trainer.experience,
        certifications: trainer.certifications,
        bio: trainer.bio,
        expertise: trainer.expertise,
        trainingTypes: trainer.trainingTypes,
        location: trainer.location,
        availability: trainer.availability,
        hourlyRate: trainer.hourlyRate,
      },
    });
  } catch (error) {
    console.error('Trainer signin error:', error);
    res.status(500).json({ message: error.message || 'Server error during trainer sign in' });
  }
};

// @desc    Get trainer profile
// @route   GET /api/trainers/profile
// @access  Private (Trainer)
const getTrainerProfile = async (req, res) => {
  try {
    const trainer = await User.findById(req.user._id).select('-password');
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    res.json({ trainer });
  } catch (error) {
    console.error('getTrainerProfile error:', error);
    res.status(500).json({ message: 'Server error retrieving trainer profile' });
  }
};

// @desc    Update trainer profile
// @route   PUT /api/trainers/profile
// @access  Private (Trainer)
const updateTrainerProfile = async (req, res) => {
  try {
    const trainer = await User.findById(req.user._id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    const {
      displayName,
      phone,
      profileImage,
      bio,
      specialization,
      experience,
      certifications,
      expertise,
      trainingTypes,
      location,
      availability,
      hourlyRate,
    } = req.body;

    if (displayName) trainer.displayName = displayName.trim();
    if (phone !== undefined) trainer.phone = phone;
    if (profileImage !== undefined) {
      trainer.profileImage = profileImage;
      trainer.avatarUrl = profileImage;
    }
    if (bio !== undefined) trainer.bio = bio;
    if (specialization !== undefined) trainer.specialization = specialization;
    if (experience !== undefined) trainer.experience = experience;
    if (certifications !== undefined) trainer.certifications = certifications;
    if (location !== undefined) trainer.location = location;
    if (availability !== undefined) trainer.availability = availability;
    if (hourlyRate !== undefined) trainer.hourlyRate = Number(hourlyRate);

    if (expertise !== undefined) {
      trainer.expertise = Array.isArray(expertise)
        ? expertise
        : typeof expertise === 'string'
        ? expertise.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    if (trainingTypes !== undefined) {
      trainer.trainingTypes = Array.isArray(trainingTypes)
        ? trainingTypes
        : typeof trainingTypes === 'string'
        ? trainingTypes.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    await trainer.save();

    res.json({
      message: 'Profile updated successfully',
      trainer: {
        id: trainer._id,
        email: trainer.email,
        displayName: trainer.displayName,
        role: 'trainer',
        phone: trainer.phone,
        profileImage: trainer.profileImage,
        avatarUrl: trainer.avatarUrl,
        specialization: trainer.specialization,
        experience: trainer.experience,
        certifications: trainer.certifications,
        bio: trainer.bio,
        expertise: trainer.expertise,
        trainingTypes: trainer.trainingTypes,
        location: trainer.location,
        availability: trainer.availability,
        hourlyRate: trainer.hourlyRate,
      },
    });
  } catch (error) {
    console.error('updateTrainerProfile error:', error);
    res.status(500).json({ message: 'Server error updating trainer profile' });
  }
};

// @desc    Get dashboard metrics for trainer
// @route   GET /api/trainers/dashboard/stats
// @access  Private (Trainer)
const getTrainerDashboardStats = async (req, res) => {
  try {
    const trainerId = req.user._id;

    // Real DB queries
    const [
      totalClients,
      activeClients,
      pendingRequests,
      workoutPlansCount,
      nutritionPlansCount,
      recentMessagesCount,
    ] = await Promise.all([
      TrainerClient.countDocuments({ trainer: trainerId }),
      TrainerClient.countDocuments({ trainer: trainerId, status: 'active' }),
      TrainerRequest.countDocuments({ trainer: trainerId, status: 'pending' }),
      TrainerWorkoutPlan.countDocuments({ trainer: trainerId }),
      TrainerNutritionPlan.countDocuments({ trainer: trainerId }),
      TrainerMessage.countDocuments({ receiver: trainerId, read: false }),
    ]);

    // Calculate profile completion percentage based on real fields
    const trainer = req.user;
    const checks = [
      Boolean(trainer.displayName),
      Boolean(trainer.profileImage),
      Boolean(trainer.bio),
      Boolean(trainer.specialization),
      Boolean(trainer.experience),
      Boolean(trainer.certifications),
      Boolean(trainer.expertise && trainer.expertise.length > 0),
      Boolean(trainer.trainingTypes && trainer.trainingTypes.length > 0),
      Boolean(trainer.location),
      Boolean(trainer.phone),
    ];
    const completedChecks = checks.filter(Boolean).length;
    const profileCompletion = Math.round((completedChecks / checks.length) * 100);

    res.json({
      totalClients,
      activeClients,
      pendingRequests,
      workoutPlansCount,
      nutritionPlansCount,
      unreadMessages: recentMessagesCount,
      profileCompletion,
    });
  } catch (error) {
    console.error('getTrainerDashboardStats error:', error);
    res.status(500).json({ message: 'Server error retrieving dashboard statistics' });
  }
};

// @desc    Get trainer clients
// @route   GET /api/trainers/clients
// @access  Private (Trainer)
const getTrainerClients = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const clients = await TrainerClient.find({ trainer: trainerId })
      .populate('client', 'displayName email avatarUrl profileImage')
      .sort({ createdAt: -1 });

    res.json(clients);
  } catch (error) {
    console.error('getTrainerClients error:', error);
    res.status(500).json({ message: 'Server error fetching clients' });
  }
};

// @desc    Get trainer requests
// @route   GET /api/trainers/requests
// @access  Private (Trainer)
const getTrainerRequests = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const requests = await TrainerRequest.find({ trainer: trainerId })
      .populate('user', 'displayName email avatarUrl profileImage')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('getTrainerRequests error:', error);
    res.status(500).json({ message: 'Server error fetching training requests' });
  }
};

// @desc    Accept training request
// @route   POST /api/trainers/requests/:id/accept
// @access  Private (Trainer)
const acceptTrainerRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await TrainerRequest.findOne({ _id: requestId, trainer: req.user._id });

    if (!request) {
      return res.status(404).json({ message: 'Training request not found' });
    }

    request.status = 'accepted';
    await request.save();

    // Create or update TrainerClient
    let clientDoc = await TrainerClient.findOne({
      trainer: req.user._id,
      client: request.user,
    });

    if (!clientDoc) {
      clientDoc = await TrainerClient.create({
        trainer: req.user._id,
        client: request.user,
        status: 'active',
        primaryGoal: request.goal,
        notes: `Accepted request on ${new Date().toLocaleDateString()}`,
      });
    } else {
      clientDoc.status = 'active';
      if (request.goal) clientDoc.primaryGoal = request.goal;
      await clientDoc.save();
    }

    res.json({
      message: 'Request accepted successfully. User is now connected as your client.',
      request,
      client: clientDoc,
    });
  } catch (error) {
    console.error('acceptTrainerRequest error:', error);
    res.status(500).json({ message: 'Server error accepting request' });
  }
};

// @desc    Reject training request
// @route   POST /api/trainers/requests/:id/reject
// @access  Private (Trainer)
const rejectTrainerRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await TrainerRequest.findOne({ _id: requestId, trainer: req.user._id });

    if (!request) {
      return res.status(404).json({ message: 'Training request not found' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Training request marked as rejected', request });
  } catch (error) {
    console.error('rejectTrainerRequest error:', error);
    res.status(500).json({ message: 'Server error rejecting request' });
  }
};

// ================= WORKOUT PLANS =================

// @desc    Get workout plans created by trainer
// @route   GET /api/trainers/workouts
// @access  Private (Trainer)
const getTrainerWorkoutPlans = async (req, res) => {
  try {
    const plans = await TrainerWorkoutPlan.find({ trainer: req.user._id })
      .populate('client', 'displayName email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    console.error('getTrainerWorkoutPlans error:', error);
    res.status(500).json({ message: 'Server error fetching workout plans' });
  }
};

// @desc    Create workout plan
// @route   POST /api/trainers/workouts
// @access  Private (Trainer)
const createTrainerWorkoutPlan = async (req, res) => {
  try {
    const { title, description, clientId, goal, duration, schedule, exercises, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Workout plan title is required' });
    }

    const plan = await TrainerWorkoutPlan.create({
      trainer: req.user._id,
      client: clientId || null,
      title: title.trim(),
      description: description || '',
      goal: goal || 'Strength & Fitness',
      duration: duration || '4 weeks',
      schedule: schedule || '3 days / week',
      exercises: Array.isArray(exercises) ? exercises : [],
      notes: notes || '',
    });

    const populated = await TrainerWorkoutPlan.findById(plan._id).populate('client', 'displayName email avatarUrl');

    res.status(201).json({ message: 'Workout plan created successfully', plan: populated });
  } catch (error) {
    console.error('createTrainerWorkoutPlan error:', error);
    res.status(500).json({ message: error.message || 'Server error creating workout plan' });
  }
};

// @desc    Update workout plan
// @route   PUT /api/trainers/workouts/:id
// @access  Private (Trainer)
const updateTrainerWorkoutPlan = async (req, res) => {
  try {
    const plan = await TrainerWorkoutPlan.findOne({ _id: req.params.id, trainer: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }

    const { title, description, clientId, goal, duration, schedule, exercises, notes } = req.body;

    if (title) plan.title = title.trim();
    if (description !== undefined) plan.description = description;
    if (clientId !== undefined) plan.client = clientId || null;
    if (goal !== undefined) plan.goal = goal;
    if (duration !== undefined) plan.duration = duration;
    if (schedule !== undefined) plan.schedule = schedule;
    if (exercises !== undefined && Array.isArray(exercises)) plan.exercises = exercises;
    if (notes !== undefined) plan.notes = notes;

    await plan.save();
    const populated = await TrainerWorkoutPlan.findById(plan._id).populate('client', 'displayName email avatarUrl');

    res.json({ message: 'Workout plan updated successfully', plan: populated });
  } catch (error) {
    console.error('updateTrainerWorkoutPlan error:', error);
    res.status(500).json({ message: 'Server error updating workout plan' });
  }
};

// @desc    Delete workout plan
// @route   DELETE /api/trainers/workouts/:id
// @access  Private (Trainer)
const deleteTrainerWorkoutPlan = async (req, res) => {
  try {
    const plan = await TrainerWorkoutPlan.findOneAndDelete({ _id: req.params.id, trainer: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }
    res.json({ message: 'Workout plan deleted successfully' });
  } catch (error) {
    console.error('deleteTrainerWorkoutPlan error:', error);
    res.status(500).json({ message: 'Server error deleting workout plan' });
  }
};

// ================= NUTRITION PLANS =================

// @desc    Get nutrition plans created by trainer
// @route   GET /api/trainers/nutrition
// @access  Private (Trainer)
const getTrainerNutritionPlans = async (req, res) => {
  try {
    const plans = await TrainerNutritionPlan.find({ trainer: req.user._id })
      .populate('client', 'displayName email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    console.error('getTrainerNutritionPlans error:', error);
    res.status(500).json({ message: 'Server error fetching nutrition plans' });
  }
};

// @desc    Create nutrition plan
// @route   POST /api/trainers/nutrition
// @access  Private (Trainer)
const createTrainerNutritionPlan = async (req, res) => {
  try {
    const { title, clientId, dailyCalories, proteinGrams, carbsGrams, fatsGrams, meals, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Nutrition plan title is required' });
    }

    const plan = await TrainerNutritionPlan.create({
      trainer: req.user._id,
      client: clientId || null,
      title: title.trim(),
      dailyCalories: Number(dailyCalories) || 2000,
      proteinGrams: Number(proteinGrams) || 150,
      carbsGrams: Number(carbsGrams) || 200,
      fatsGrams: Number(fatsGrams) || 65,
      meals: Array.isArray(meals) ? meals : [],
      notes: notes || '',
    });

    const populated = await TrainerNutritionPlan.findById(plan._id).populate('client', 'displayName email avatarUrl');

    res.status(201).json({ message: 'Nutrition plan created successfully', plan: populated });
  } catch (error) {
    console.error('createTrainerNutritionPlan error:', error);
    res.status(500).json({ message: error.message || 'Server error creating nutrition plan' });
  }
};

// @desc    Update nutrition plan
// @route   PUT /api/trainers/nutrition/:id
// @access  Private (Trainer)
const updateTrainerNutritionPlan = async (req, res) => {
  try {
    const plan = await TrainerNutritionPlan.findOne({ _id: req.params.id, trainer: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }

    const { title, clientId, dailyCalories, proteinGrams, carbsGrams, fatsGrams, meals, notes } = req.body;

    if (title) plan.title = title.trim();
    if (clientId !== undefined) plan.client = clientId || null;
    if (dailyCalories !== undefined) plan.dailyCalories = Number(dailyCalories);
    if (proteinGrams !== undefined) plan.proteinGrams = Number(proteinGrams);
    if (carbsGrams !== undefined) plan.carbsGrams = Number(carbsGrams);
    if (fatsGrams !== undefined) plan.fatsGrams = Number(fatsGrams);
    if (meals !== undefined && Array.isArray(meals)) plan.meals = meals;
    if (notes !== undefined) plan.notes = notes;

    await plan.save();
    const populated = await TrainerNutritionPlan.findById(plan._id).populate('client', 'displayName email avatarUrl');

    res.json({ message: 'Nutrition plan updated successfully', plan: populated });
  } catch (error) {
    console.error('updateTrainerNutritionPlan error:', error);
    res.status(500).json({ message: 'Server error updating nutrition plan' });
  }
};

// @desc    Delete nutrition plan
// @route   DELETE /api/trainers/nutrition/:id
// @access  Private (Trainer)
const deleteTrainerNutritionPlan = async (req, res) => {
  try {
    const plan = await TrainerNutritionPlan.findOneAndDelete({ _id: req.params.id, trainer: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }
    res.json({ message: 'Nutrition plan deleted successfully' });
  } catch (error) {
    console.error('deleteTrainerNutritionPlan error:', error);
    res.status(500).json({ message: 'Server error deleting nutrition plan' });
  }
};

// ================= MESSAGING =================

// @desc    Get messages for a client
// @route   GET /api/trainers/messages/:clientId
// @access  Private (Trainer)
const getTrainerMessages = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const clientId = req.params.clientId;

    const messages = await TrainerMessage.find({
      trainer: trainerId,
      client: clientId,
    })
      .populate('sender', 'displayName avatarUrl role')
      .sort({ createdAt: 1 });

    // Mark messages sent to trainer as read
    await TrainerMessage.updateMany(
      { trainer: trainerId, client: clientId, receiver: trainerId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    console.error('getTrainerMessages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

// @desc    Send message from trainer to client
// @route   POST /api/trainers/messages/:clientId
// @access  Private (Trainer)
const sendTrainerMessage = async (req, res) => {
  try {
    const trainerId = req.user._id;
    const clientId = req.params.clientId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    const message = await TrainerMessage.create({
      sender: trainerId,
      receiver: clientId,
      trainer: trainerId,
      client: clientId,
      content: content.trim(),
      read: false,
    });

    const populated = await TrainerMessage.findById(message._id).populate('sender', 'displayName avatarUrl role');

    res.status(201).json(populated);
  } catch (error) {
    console.error('sendTrainerMessage error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// ================= PUBLIC DISCOVERY ENDPOINTS =================

// @desc    Get all registered trainers (Public)
// @route   GET /api/trainers
// @access  Public
const getPublicTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(trainers);
  } catch (error) {
    console.error('getPublicTrainers error:', error);
    res.status(500).json({ message: 'Server error fetching trainers' });
  }
};

// @desc    Get single trainer profile (Public)
// @route   GET /api/trainers/:id
// @access  Public
const getPublicTrainerById = async (req, res) => {
  try {
    const trainer = await User.findOne({ _id: req.params.id, role: 'trainer' }).select('-password');
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    res.json(trainer);
  } catch (error) {
    console.error('getPublicTrainerById error:', error);
    res.status(500).json({ message: 'Server error fetching trainer profile' });
  }
};

// @desc    Request training from a trainer (Authenticated User)
// @route   POST /api/trainers/:id/request
// @access  Private (User)
const requestTraining = async (req, res) => {
  try {
    const trainerId = req.params.id;
    const userId = req.user._id;

    if (userId.toString() === trainerId.toString()) {
      return res.status(400).json({ message: 'You cannot request training from yourself' });
    }

    const trainer = await User.findOne({ _id: trainerId, role: 'trainer' });
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    // Check if pending request exists
    const existing = await TrainerRequest.findOne({
      user: userId,
      trainer: trainerId,
      status: 'pending',
    });

    if (existing) {
      return res.status(400).json({ message: 'You already have a pending request with this trainer' });
    }

    const { goal, experienceLevel, message } = req.body;

    const request = await TrainerRequest.create({
      user: userId,
      trainer: trainerId,
      status: 'pending',
      goal: goal || 'Improve overall fitness',
      experienceLevel: experienceLevel || 'Beginner',
      message: message || '',
    });

    res.status(201).json({
      message: `Training request successfully sent to ${trainer.displayName}!`,
      request,
    });
  } catch (error) {
    console.error('requestTraining error:', error);
    res.status(500).json({ message: error.message || 'Server error sending training request' });
  }
};

module.exports = {
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
};
