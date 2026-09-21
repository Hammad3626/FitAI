const Subscription = require('../models/Subscription');

// Tier hierarchy weight
const PLAN_WEIGHTS = {
  free: 1,
  basic: 2,
  pro: 3,
};

// Daily AI query limits
const AI_QUERY_LIMITS = {
  free: 5,
  basic: 50,
  pro: Infinity,
};

// Attach or resolve user's current subscription, handling auto-expiration
const attachSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    let sub = await Subscription.findOne({ user: req.user._id });

    // If user has no subscription in DB yet, create a default Free subscription
    if (!sub) {
      sub = await Subscription.create({
        user: req.user._id,
        planId: 'free',
        planName: 'Free',
        price: 0,
        status: 'active',
        paymentStatus: 'not_required',
        startDate: new Date(),
        endDate: null,
      });
    }

    // Check expiration on paid plans
    if (sub.status === 'active' && sub.endDate && new Date(sub.endDate) < new Date()) {
      sub.status = 'expired';
      await sub.save();
    }

    // Check daily query counter reset (new calendar day)
    const today = new Date().toISOString().slice(0, 10);
    if (sub.lastQueryDate !== today) {
      sub.dailyAiQueriesUsed = 0;
      sub.lastQueryDate = today;
      await sub.save();
    }

    req.subscription = sub;
    next();
  } catch (error) {
    console.error('attachSubscription error:', error);
    next(error);
  }
};

// Middleware to require a minimum subscription tier ('basic' or 'pro')
const requirePlan = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        // If not attached, attach now
        await attachSubscription(req, res, () => {});
      }

      const sub = req.subscription;
      const isSubValid = sub && sub.status === 'active' && (!sub.endDate || new Date(sub.endDate) >= new Date());

      const userPlan = isSubValid ? sub.planId : 'free';
      const userWeight = PLAN_WEIGHTS[userPlan] || 1;
      const reqWeight = PLAN_WEIGHTS[requiredPlan] || 1;

      if (userWeight < reqWeight) {
        return res.status(403).json({
          message: `This feature requires a ${requiredPlan.toUpperCase()} subscription plan`,
          upgradeRequired: true,
          requiredPlan,
          currentPlan: userPlan,
        });
      }

      next();
    } catch (error) {
      console.error('requirePlan error:', error);
      res.status(500).json({ message: 'Server error checking subscription' });
    }
  };
};

// Middleware to check and increment AI Coach usage limit
const checkAiCoachLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      // Guest users get limited demo access (handled in controller)
      return next();
    }

    if (!req.subscription) {
      await attachSubscription(req, res, () => {});
    }

    const sub = req.subscription;
    const isSubValid = sub && sub.status === 'active' && (!sub.endDate || new Date(sub.endDate) >= new Date());
    const plan = isSubValid ? sub.planId : 'free';

    const limit = AI_QUERY_LIMITS[plan] || 5;

    if (sub.dailyAiQueriesUsed >= limit) {
      return res.status(403).json({
        message: `You have reached your daily AI Coach limit of ${limit} questions on the ${sub.planName} plan. Upgrade to unlock more questions!`,
        limitReached: true,
        limit,
        used: sub.dailyAiQueriesUsed,
        currentPlan: plan,
        upgradeRequired: true,
      });
    }

    // Increment query count
    sub.dailyAiQueriesUsed += 1;
    await sub.save();

    req.remainingAiQueries = limit === Infinity ? 'Unlimited' : Math.max(0, limit - sub.dailyAiQueriesUsed);
    next();
  } catch (error) {
    console.error('checkAiCoachLimit error:', error);
    next(error);
  }
};

module.exports = {
  attachSubscription,
  requirePlan,
  checkAiCoachLimit,
  PLAN_WEIGHTS,
  AI_QUERY_LIMITS,
};
