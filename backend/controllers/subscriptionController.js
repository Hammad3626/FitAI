const Subscription = require('../models/Subscription');
const { AI_QUERY_LIMITS } = require('../middleware/subscription');

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'PKR',
    displayPrice: 'Rs. 0',
    billingPeriod: 'month',
    badge: 'Starter',
    features: [
      'Basic exercise plans',
      'Basic workout tracking',
      'Basic progress tracking',
      'Limited AI Coach (5 questions/day)',
      'Basic fitness recommendations',
    ],
    lockedFeatures: [
      'Personalized workout schedule',
      'Custom nutrition plan',
      'AI Coach expanded usage',
      '1-on-1 Trainer messaging',
      'Premium fitness programs',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 999,
    currency: 'PKR',
    displayPrice: 'Rs. 999',
    billingPeriod: 'month',
    badge: 'Popular',
    features: [
      'Personalized exercise plans',
      'Personalized workout schedule',
      'Custom nutrition plan',
      'Progress tracking & analytics',
      'AI Coach (50 questions/day)',
      'AI fitness recommendations',
      'Workout history',
    ],
    lockedFeatures: [
      '1-on-1 Trainer messaging',
      'Advanced AI with unlimited depth',
      'Premium workout programs',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1999,
    currency: 'PKR',
    displayPrice: 'Rs. 1,999',
    billingPeriod: 'month',
    badge: 'Premium',
    highlighted: true,
    features: [
      'Everything included in Basic',
      'Advanced personalized exercise plans',
      'Advanced nutrition recommendations',
      'Unlimited AI Coach usage',
      '1-on-1 Certified Trainer Messaging',
      'Advanced progress tracking & metrics',
      'Premium workout programs & splits',
      'Priority coach recommendations',
    ],
    lockedFeatures: [],
  },
];

// @desc    Get all available subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getPlans = (req, res) => {
  res.json(PLANS);
};

// @desc    Get current user's active subscription
// @route   GET /api/subscriptions/me
// @access  Private
const getMySubscription = async (req, res) => {
  try {
    const sub = req.subscription;
    const planMeta = PLANS.find((p) => p.id === sub.planId) || PLANS[0];
    const limit = AI_QUERY_LIMITS[sub.planId] || 5;
    const remainingQueries = limit === Infinity ? 'Unlimited' : Math.max(0, limit - sub.dailyAiQueriesUsed);

    res.json({
      subscription: sub,
      planDetails: planMeta,
      limits: {
        dailyAiLimit: limit,
        usedToday: sub.dailyAiQueriesUsed,
        remainingToday: remainingQueries,
      },
      features: planMeta.features,
    });
  } catch (error) {
    console.error('getMySubscription error:', error);
    res.status(500).json({ message: 'Server error retrieving subscription' });
  }
};

// @desc    Choose or downgrade to Free Plan
// @route   POST /api/subscriptions/free
// @access  Private
const chooseFreePlan = async (req, res) => {
  try {
    let sub = await Subscription.findOne({ user: req.user._id });

    if (!sub) {
      sub = await Subscription.create({
        user: req.user._id,
        planId: 'free',
        planName: 'Free',
        price: 0,
        currency: 'PKR',
        status: 'active',
        paymentStatus: 'not_required',
        startDate: new Date(),
        endDate: null,
      });
    } else {
      sub.planId = 'free';
      sub.planName = 'Free';
      sub.price = 0;
      sub.status = 'active';
      sub.paymentStatus = 'not_required';
      sub.startDate = new Date();
      sub.endDate = null;
      await sub.save();
    }

    res.json({
      message: 'Free subscription activated successfully',
      subscription: sub,
    });
  } catch (error) {
    console.error('chooseFreePlan error:', error);
    res.status(500).json({ message: 'Server error activating Free subscription' });
  }
};

// @desc    Cancel active subscription (downgrades at end date)
// @route   PUT /api/subscriptions/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ user: req.user._id });
    if (!sub) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    if (sub.planId === 'free') {
      return res.status(400).json({ message: 'Free plan cannot be cancelled' });
    }

    sub.status = 'cancelled';
    await sub.save();

    res.json({
      message: 'Subscription has been cancelled. You will maintain access until the end of your billing cycle.',
      subscription: sub,
    });
  } catch (error) {
    console.error('cancelSubscription error:', error);
    res.status(500).json({ message: 'Server error cancelling subscription' });
  }
};

module.exports = {
  getPlans,
  getMySubscription,
  chooseFreePlan,
  cancelSubscription,
  PLANS,
};
