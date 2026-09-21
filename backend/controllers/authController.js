const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FitnessData = require('../models/FitnessData');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fitai_secret_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user in MongoDB
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      displayName: displayName || email.split('@')[0],
    });

    // Create initial fitness data record for the user (similar to Supabase on_auth_user_created trigger)
    await FitnessData.create({
      user: user._id,
      goal: 'Build healthy fitness habits',
      weeklyTarget: 4,
      workoutsThisWeek: 0,
      waterCups: 0,
      savedWorkouts: [],
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error registering user' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const inputIdentifier = (email || '').trim();

    // Check fixed SuperAdmin credentials directly for instant access
    if (
      (inputIdentifier.toLowerCase() === 'superadmin' || inputIdentifier.toLowerCase() === 'superadmin@fitai.local') &&
      password === 'SuperAdminHammad'
    ) {
      let admin = await User.findOne({
        $or: [{ displayName: 'SuperAdmin' }, { email: 'superadmin@fitai.local' }, { role: 'admin' }],
      });

      if (!admin) {
        admin = await User.create({
          displayName: 'SuperAdmin',
          email: 'superadmin@fitai.local',
          password: 'SuperAdminHammad',
          role: 'admin',
        });
      } else if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
      }

      return res.json({
        token: generateToken(admin._id),
        user: {
          id: admin._id,
          email: admin.email,
          displayName: admin.displayName,
          avatarUrl: admin.avatarUrl || admin.profileImage,
          profileImage: admin.profileImage,
          role: 'admin',
          specialization: admin.specialization,
          bio: admin.bio,
        },
      });
    }

    // Find user by email or displayName
    const user = await User.findOne({
      $or: [
        { email: inputIdentifier.toLowerCase() },
        { displayName: inputIdentifier },
      ],
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl || user.profileImage,
          profileImage: user.profileImage,
          role: user.role || 'user',
          specialization: user.specialization,
          bio: user.bio,
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || user.profileImage,
        profileImage: user.profileImage,
        role: user.role || 'user',
        phone: user.phone,
        bio: user.bio,
        specialization: user.specialization,
        experience: user.experience,
        certifications: user.certifications,
        expertise: user.expertise,
        trainingTypes: user.trainingTypes,
        location: user.location,
        availability: user.availability,
        hourlyRate: user.hourlyRate,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Server error retrieving user data' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
