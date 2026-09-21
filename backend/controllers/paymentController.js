const crypto = require('crypto');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const { PLANS } = require('./subscriptionController');

// Secret for signing test/production payment tokens
const PAYMENT_SECRET = process.env.PAYMENT_SECRET || 'fitai_secure_payment_salt_998877';

// @desc    Initiate / create payment intent for paid plan
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const { planId, paymentMethod = 'card' } = req.body;

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || plan.price <= 0) {
      return res.status(400).json({ message: 'Invalid or free plan selected for payment' });
    }

    // Generate unique payment transaction ID
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const paymentId = `PAY-${Date.now()}-${randomSuffix}`;

    // Generate verification token signed by server
    const verificationToken = crypto
      .createHmac('sha256', PAYMENT_SECRET)
      .update(`${req.user._id}:${paymentId}:${plan.price}`)
      .digest('hex');

    // Create pending payment record in MongoDB
    const payment = await Payment.create({
      user: req.user._id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      paymentMethod,
      paymentId,
      status: 'pending',
      verificationToken,
      metadata: {
        userEmail: req.user.email,
        userName: req.user.displayName,
      },
    });

    res.status(201).json({
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      planName: payment.planName,
      planId: payment.planId,
      verificationToken: payment.verificationToken,
    });
  } catch (error) {
    console.error('createPaymentIntent error:', error);
    res.status(500).json({ message: 'Server error initiating payment' });
  }
};

// @desc    Verify payment and activate subscription
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { paymentId, verificationToken, simulatedFailure = false } = req.body;

    if (!paymentId || !verificationToken) {
      return res.status(400).json({ message: 'Payment ID and verification token are required' });
    }

    const payment = await Payment.findOne({ paymentId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'This transaction has already been verified and processed' });
    }

    // Verify token validity against server secret
    const expectedToken = crypto
      .createHmac('sha256', PAYMENT_SECRET)
      .update(`${req.user._id}:${payment.paymentId}:${payment.amount}`)
      .digest('hex');

    if (verificationToken !== expectedToken) {
      payment.status = 'failed';
      payment.verificationNotes = 'Cryptographic verification token mismatch';
      await payment.save();
      return res.status(400).json({ message: 'Payment validation failed: Security signature mismatch' });
    }

    // Handle simulated gateway failure if requested
    if (simulatedFailure) {
      payment.status = 'failed';
      payment.verificationNotes = 'Simulated card/gateway rejection';
      await payment.save();
      return res.status(400).json({ message: 'Payment was declined by payment provider' });
    }

    // Payment successfully verified by server!
    payment.status = 'paid';
    payment.verifiedAt = new Date();
    payment.verificationNotes = 'Payment verified and confirmed by payment engine';

    // 30-day subscription window
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    let sub = await Subscription.findOne({ user: req.user._id });

    if (!sub) {
      sub = await Subscription.create({
        user: req.user._id,
        planId: payment.planId,
        planName: payment.planName,
        price: payment.amount,
        currency: payment.currency,
        status: 'active',
        paymentStatus: 'paid',
        paymentId: payment.paymentId,
        startDate,
        endDate,
      });
    } else {
      sub.planId = payment.planId;
      sub.planName = payment.planName;
      sub.price = payment.amount;
      sub.currency = payment.currency;
      sub.status = 'active';
      sub.paymentStatus = 'paid';
      sub.paymentId = payment.paymentId;
      sub.startDate = startDate;
      sub.endDate = endDate;
      sub.dailyAiQueriesUsed = 0; // Reset usage on upgrade
      await sub.save();
    }

    payment.subscription = sub._id;
    await payment.save();

    res.json({
      message: 'Payment verified successfully! Your subscription is now active.',
      payment: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        verifiedAt: payment.verifiedAt,
      },
      subscription: sub,
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
};

module.exports = {
  createPaymentIntent,
  verifyPayment,
};
