const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Model — stores credentials and profile info (replaces Supabase auth.users & profiles)
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
    },
    displayName: {
      type: String,
      trim: true,
      default: function () {
        return this.email ? this.email.split('@')[0] : 'User';
      },
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    // Role System: 'user', 'trainer', or 'admin'
    role: {
      type: String,
      enum: ['user', 'trainer', 'admin'],
      default: 'user',
    },
    // Trainer-specific profile fields
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    specialization: {
      type: String,
      default: '',
      trim: true,
    },
    experience: {
      type: String,
      default: '',
      trim: true,
    },
    certifications: {
      type: String,
      default: '',
      trim: true,
    },
    expertise: {
      type: [String],
      default: [],
    },
    trainingTypes: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    availability: {
      type: String,
      default: 'Accepting Clients',
      trim: true,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password prior to saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
