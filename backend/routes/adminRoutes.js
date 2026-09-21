const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/auth');

// All admin routes strictly require valid JWT with role: 'admin'
router.use(protectAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.get('/trainers', getAdminTrainers);
router.get('/messages', getAdminMessages);
router.get('/subscriptions', getAdminSubscriptions);
router.get('/payments', getAdminPayments);
router.get('/revenue', getAdminRevenueStats);
router.put('/trainers/:id', updateTrainer);
router.delete('/users/:id', deleteUser);
router.delete('/trainers/:id', deleteTrainer);

module.exports = router;
