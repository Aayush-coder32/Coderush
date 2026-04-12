const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Role-based accounts: students, faculty (events + attendance + resources), admins.
 * Legacy `organizer` is treated as faculty in auth middleware for older databases.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'organizer'],
      default: 'student',
    },
    avatar: { type: String, default: '' },
    department: { type: String, default: '', trim: true },
    studentRoll: { type: String, default: '', trim: true },
    bio: { type: String, default: '', maxlength: 2000 },
    skills: [{ type: String, trim: true }],
    /** Anti-proxy: last few device fingerprints seen at attendance scan (hashed client id). */
    knownDevices: [{ type: String, maxlength: 128 }],
    /** Simple wallet for optional credits (demo). */
    walletBalance: { type: Number, default: 0, min: 0 },
    /** Used by AI / rule-based recommendations. */
    interests: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

userSchema.index({ role: 1, department: 1 });
userSchema.index({ skills: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
