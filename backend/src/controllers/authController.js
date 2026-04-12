const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * POST /api/auth/register
 * New users default to `student`. First account can request organizer via separate flow or admin.
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, interests } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    let finalRole = 'student';
    if (role === 'student' || role === 'faculty' || role === 'organizer') {
      finalRole = role === 'organizer' ? 'faculty' : role;
    }
    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot self-register as admin' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      interests: Array.isArray(interests) ? interests : [],
      department: req.body.department || '',
      studentRoll: req.body.studentRoll || '',
      skills: Array.isArray(req.body.skills) ? req.body.skills : [],
    });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        interests: user.interests,
        department: user.department,
        studentRoll: user.studentRoll,
        skills: user.skills,
        bio: user.bio,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        interests: user.interests,
        department: user.department,
        studentRoll: user.studentRoll,
        skills: user.skills,
        bio: user.bio,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/auth/me
 */
exports.me = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      walletBalance: req.user.walletBalance,
      interests: req.user.interests,
      avatar: req.user.avatar,
      department: req.user.department,
      studentRoll: req.user.studentRoll,
      skills: req.user.skills,
      bio: req.user.bio,
    },
  });
};

/**
 * PATCH /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, interests, department, studentRoll, skills, bio } = req.body;
    if (name) req.user.name = name;
    if (Array.isArray(interests)) req.user.interests = interests;
    if (department != null) req.user.department = department;
    if (studentRoll != null) req.user.studentRoll = studentRoll;
    if (Array.isArray(skills)) req.user.skills = skills;
    if (bio != null) req.user.bio = String(bio).slice(0, 2000);
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
