const User = require('../models/User');
const TrainerClient = require('../models/TrainerClient');
const TrainerRequest = require('../models/TrainerRequest');
const TrainerMessage = require('../models/TrainerMessage');
const TrainerWorkoutPlan = require('../models/TrainerWorkoutPlan');
const TrainerNutritionPlan = require('../models/TrainerNutritionPlan');
const FitnessData = require('../models/FitnessData');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

// @desc    Get system-wide platform statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTrainers,
      activeClients,
      pendingRequests,
      totalMessages,
      totalWorkoutPlans,
      totalNutritionPlans,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'trainer' }),
      TrainerClient.countDocuments({ status: 'active' }),
      TrainerRequest.countDocuments({ status: 'pending' }),
      TrainerMessage.countDocuments({}),
      TrainerWorkoutPlan.countDocuments({}),
      TrainerNutritionPlan.countDocuments({}),
    ]);

    res.json({
      totalUsers,
      totalTrainers,
      activeClients,
      pendingRequests,
      totalMessages,
      totalWorkoutPlans,
      totalNutritionPlans,
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ message: 'Server error retrieving admin statistics' });
  }
};

// @desc    Get all registered clients / users with assigned trainers
// @route   GET /api/admin/users
// @access  Private/Admin
const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Fetch active trainer connections for all clients
    const activeConnections = await TrainerClient.find({ status: 'active' })
      .populate('trainer', 'displayName email specialization');

    // Create a map for quick lookup: clientId -> trainer object
    const trainerMap = {};
    activeConnections.forEach((conn) => {
      if (conn.client) {
        trainerMap[conn.client.toString()] = conn.trainer;
      }
    });

    const enrichedUsers = users.map((u) => {
      const assignedTrainer = trainerMap[u._id.toString()] || null;
      return {
        _id: u._id,
        displayName: u.displayName || 'User',
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        assignedTrainer: assignedTrainer
          ? {
              _id: assignedTrainer._id,
              displayName: assignedTrainer.displayName,
              email: assignedTrainer.email,
              specialization: assignedTrainer.specialization,
            }
          : null,
      };
    });

    res.json(enrichedUsers);
  } catch (error) {
    console.error('getAdminUsers error:', error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
};

// @desc    Get all registered trainers with client count
// @route   GET /api/admin/trainers
// @access  Private/Admin
const getAdminTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Count active clients per trainer
    const clientCounts = await TrainerClient.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$trainer', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    clientCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const enrichedTrainers = trainers.map((t) => ({
      _id: t._id,
      displayName: t.displayName,
      email: t.email,
      phone: t.phone,
      specialization: t.specialization || 'General Fitness',
      experience: t.experience || 'Not specified',
      location: t.location || 'Online',
      availability: t.availability || 'Accepting Clients',
      hourlyRate: t.hourlyRate || 0,
      profileImage: t.profileImage,
      role: t.role,
      createdAt: t.createdAt,
      activeClientsCount: countMap[t._id.toString()] || 0,
    }));

    res.json(enrichedTrainers);
  } catch (error) {
    console.error('getAdminTrainers error:', error);
    res.status(500).json({ message: 'Server error retrieving trainers' });
  }
};

// @desc    Get all platform messages across trainers & clients
// @route   GET /api/admin/messages
// @access  Private/Admin
const getAdminMessages = async (req, res) => {
  try {
    const messages = await TrainerMessage.find({})
      .populate('sender', 'displayName email role')
      .populate('receiver', 'displayName email role')
      .populate('trainer', 'displayName email')
      .populate('client', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('getAdminMessages error:', error);
    res.status(500).json({ message: 'Server error retrieving platform messages' });
  }
};

// @desc    Delete a user and cleanup associated data
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete the SuperAdmin account' });
    }

    // Clean up related user records
    await Promise.all([
      User.findByIdAndDelete(id),
      FitnessData.deleteMany({ user: id }),
      TrainerClient.deleteMany({ client: id }),
      TrainerRequest.deleteMany({ user: id }),
      TrainerWorkoutPlan.deleteMany({ client: id }),
      TrainerNutritionPlan.deleteMany({ client: id }),
      TrainerMessage.deleteMany({ $or: [{ sender: id }, { receiver: id }, { client: id }] }),
    ]);

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// @desc    Delete a trainer and cleanup associated data
// @route   DELETE /api/admin/trainers/:id
// @access  Private/Admin
const deleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;

    const trainer = await User.findById(id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    if (trainer.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete the SuperAdmin account' });
    }

    // Clean up related trainer records
    await Promise.all([
      User.findByIdAndDelete(id),
      TrainerClient.deleteMany({ trainer: id }),
      TrainerRequest.deleteMany({ trainer: id }),
      TrainerWorkoutPlan.deleteMany({ trainer: id }),
      TrainerNutritionPlan.deleteMany({ trainer: id }),
      TrainerMessage.deleteMany({ $or: [{ sender: id }, { receiver: id }, { trainer: id }] }),
    ]);

    res.json({ message: 'Trainer and associated records deleted successfully' });
  } catch (error) {
    console.error('deleteTrainer error:', error);
    res.status(500).json({ message: 'Server error deleting trainer' });
  }
};

// @desc    Update trainer details / availability status
// @route   PUT /api/admin/trainers/:id
// @access  Private/Admin
const updateTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialization, availability, hourlyRate } = req.body;

    const trainer = await User.findById(id);
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    if (specialization !== undefined) trainer.specialization = specialization;
    if (availability !== undefined) trainer.availability = availability;
    if (hourlyRate !== undefined) trainer.hourlyRate = Number(hourlyRate) || 0;

    await trainer.save();

    res.json({ message: 'Trainer updated successfully', trainer });
  } catch (error) {
    console.error('updateTrainer error:', error);
    res.status(500).json({ message: 'Server error updating trainer' });
  }
};

// @desc    Get all subscriptions with user details
// @route   GET /api/admin/subscriptions
// @access  Private/Admin
const getAdminSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({})
      .populate('user', 'displayName email createdAt')
      .sort({ updatedAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('getAdminSubscriptions error:', error);
    res.status(500).json({ message: 'Server error retrieving subscriptions' });
  }
};

// @desc    Get all transactions/payments
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAdminPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('user', 'displayName email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('getAdminPayments error:', error);
    res.status(500).json({ message: 'Server error retrieving payments' });
  }
};

// @desc    Get comprehensive subscription & revenue analytics
// @route   GET /api/admin/revenue
// @access  Private/Admin
const getAdminRevenueStats = async (req, res) => {
  try {
    const [
      totalSubscribers,
      activeSubscriptions,
      freeUsers,
      basicUsers,
      proUsers,
      expiredSubscriptions,
      paidPayments,
    ] = await Promise.all([
      Subscription.countDocuments({}),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ planId: 'free', status: 'active' }),
      Subscription.countDocuments({ planId: 'basic', status: 'active' }),
      Subscription.countDocuments({ planId: 'pro', status: 'active' }),
      Subscription.countDocuments({ status: 'expired' }),
      Payment.find({ status: 'paid' }),
    ]);

    // Calculate real revenue metrics from verified paid payments
    let totalRevenue = 0;
    let basicRevenue = 0;
    let proRevenue = 0;
    let monthlyRevenue = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    paidPayments.forEach((p) => {
      const amount = Number(p.amount) || 0;
      totalRevenue += amount;

      if (p.planId === 'basic') {
        basicRevenue += amount;
      } else if (p.planId === 'pro') {
        proRevenue += amount;
      }

      if (p.verifiedAt) {
        const pDate = new Date(p.verifiedAt);
        if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
          monthlyRevenue += amount;
        }
      }
    });

    res.json({
      subscribers: {
        total: totalSubscribers,
        active: activeSubscriptions,
        free: freeUsers,
        basic: basicUsers,
        pro: proUsers,
        expired: expiredSubscriptions,
      },
      revenue: {
        totalRevenue,
        monthlyRevenue,
        basicRevenue,
        proRevenue,
        paidTransactionsCount: paidPayments.length,
      },
    });
  } catch (error) {
    console.error('getAdminRevenueStats error:', error);
    res.status(500).json({ message: 'Server error calculating revenue analytics' });
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  getAdminTrainers,
  getAdminMessages,
  deleteUser,
  deleteTrainer,
  updateTrainer,
  getAdminSubscriptions,
  getAdminPayments,
  getAdminRevenueStats,
};
