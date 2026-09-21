const express = require('express');
const router = express.Router();
const {
  getPlans,
  getMySubscription,
  chooseFreePlan,
  cancelSubscription,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');
const { attachSubscription } = require('../middleware/subscription');

router.get('/plans', getPlans);
router.get('/me', protect, attachSubscription, getMySubscription);
router.post('/free', protect, chooseFreePlan);
router.put('/cancel', protect, cancelSubscription);

module.exports = router;
