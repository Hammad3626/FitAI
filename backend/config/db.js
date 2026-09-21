const mongoose = require('mongoose');

// Connects to MongoDB database using MONGODB_URI environment variable
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fitai');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Ensure all existing user documents have a defined role
    const User = require('../models/User');
    await User.updateMany({ role: { $exists: false } }, { $set: { role: 'user' } });

    // Ensure fixed SuperAdmin account exists with required credentials
    const adminUser = await User.findOne({
      $or: [{ email: 'superadmin@fitai.local' }, { displayName: 'SuperAdmin' }],
    });

    if (!adminUser) {
      await User.create({
        email: 'superadmin@fitai.local',
        displayName: 'SuperAdmin',
        password: 'SuperAdminHammad',
        role: 'admin',
      });
      console.log('Fixed SuperAdmin account created successfully.');
    } else {
      let needsSave = false;
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        needsSave = true;
      }
      if (adminUser.displayName !== 'SuperAdmin') {
        adminUser.displayName = 'SuperAdmin';
        needsSave = true;
      }
      if (needsSave) {
        await adminUser.save();
      }
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Do not crash immediately so local testing without MongoDB running can still test HTTP handlers
  }
};

module.exports = connectDB;
