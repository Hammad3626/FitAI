const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token and protect routes (replaces Supabase RLS & auth checks)
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitai_secret_key_12345');

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found or deleted' });
      }

      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware to verify trainer role
const protectTrainer = async (req, res, next) => {
  protect(req, res, () => {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ message: 'Access denied: Trainer role required' });
    }
    next();
  });
};

// Middleware to verify user role
const protectUser = async (req, res, next) => {
  protect(req, res, () => {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied: User role required' });
    }
    next();
  });
};

// Middleware to verify admin role
const protectAdmin = async (req, res, next) => {
  protect(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Administrator role required' });
    }
    next();
  });
};

// Middleware for optional authentication (populates req.user if token is present)
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitai_secret_key_12345');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // Ignore token failure for optional routes
    }
  }
  next();
};

module.exports = { protect, protectTrainer, protectUser, protectAdmin, optionalAuth };
