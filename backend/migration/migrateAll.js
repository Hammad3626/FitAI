const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const FitnessData = require('../models/FitnessData');
const CustomRoutine = require('../models/CustomRoutine');

// Load environment variables from backend or root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'seedData.json'), 'utf-8')
);

const runMigration = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fitai';
  console.log('==================================================');
  console.log('Starting Supabase -> MongoDB Migration Script');
  console.log(`Connecting to MongoDB at: ${mongoUri}`);
  console.log('==================================================');

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // Seed or migrate users
    console.log('\n[1/3] Migrating Users & Profiles...');
    const userMap = new Map();

    for (const userData of seedData.users) {
      let existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (!existingUser) {
        existingUser = await User.create({
          email: userData.email.toLowerCase(),
          password: userData.password,
          displayName: userData.displayName,
          avatarUrl: userData.avatarUrl || '',
        });
        console.log(`  + Created user: ${existingUser.email} (${existingUser._id})`);
      } else {
        console.log(`  * User already exists: ${existingUser.email} (${existingUser._id})`);
      }
      userMap.set(userData.email.toLowerCase(), existingUser);
    }

    // Seed or migrate Fitness Data
    console.log('\n[2/3] Migrating User Fitness Data...');
    for (const fit of seedData.fitnessData) {
      const user = userMap.get(fit.userEmail.toLowerCase());
      if (user) {
        const existingFit = await FitnessData.findOne({ user: user._id });
        if (!existingFit) {
          await FitnessData.create({
            user: user._id,
            goal: fit.goal,
            weeklyTarget: fit.weeklyTarget,
            workoutsThisWeek: fit.workoutsThisWeek,
            waterCups: fit.waterCups,
            savedWorkouts: fit.savedWorkouts || [],
          });
          console.log(`  + Seeded fitness data for: ${user.email}`);
        } else {
          console.log(`  * Fitness data already exists for: ${user.email}`);
        }
      }
    }

    // Seed or migrate Custom Routines
    console.log('\n[3/3] Migrating Custom Routines...');
    for (const r of seedData.customRoutines) {
      const user = userMap.get(r.userEmail.toLowerCase());
      if (user) {
        const existingRoutine = await CustomRoutine.findOne({
          user: user._id,
          title: r.title,
        });

        if (!existingRoutine) {
          await CustomRoutine.create({
            user: user._id,
            title: r.title,
            goal: r.goal,
            level: r.level,
            equipment: r.equipment,
            daysPerWeek: r.daysPerWeek,
            timeMin: r.timeMin,
            focus: r.focus,
            injuries: r.injuries,
            intensity: r.intensity,
            dayNumber: r.dayNumber || 1,
            completed: r.completed || false,
            completedAt: r.completedAt ? new Date(r.completedAt) : null,
            completedExercises: r.completedExercises || [],
            content: r.content,
          });
          console.log(`  + Seeded custom routine: "${r.title}" for ${user.email}`);
        } else {
          console.log(`  * Routine already exists: "${r.title}"`);
        }
      }
    }

    // Database Audit & Verification
    console.log('\n==================================================');
    console.log('DATABASE AUDIT & VERIFICATION:');
    const totalUsers = await User.countDocuments();
    const totalFitness = await FitnessData.countDocuments();
    const totalRoutines = await CustomRoutine.countDocuments();

    console.log(`- Total Users in MongoDB: ${totalUsers}`);
    console.log(`- Total Fitness Records: ${totalFitness}`);
    console.log(`- Total Custom Routines: ${totalRoutines}`);
    console.log('Migration completed successfully with 0 errors!');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
};

runMigration();
