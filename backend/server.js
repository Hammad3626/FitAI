const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FitAI Backend', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/fitness-data', require('./routes/fitnessRoutes'));
app.use('/api/routines', require('./routes/routineRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/trainers', require('./routes/trainerRoutes'));
app.use('/api/user-trainer', require('./routes/userTrainerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error handler:', err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) { app.listen(PORT, () => {
  console.log(`FitAI Backend Server running on http://localhost:${PORT}`);
}); }

module.exports = app;
