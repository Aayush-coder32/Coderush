const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies JWT from `Authorization: Bearer <token>` and attaches req.user.
 */
const protect = async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
  }
};

/** Restrict route to specific roles (`faculty` also allows legacy `organizer`). */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ success: false, message: 'Forbidden for this role' });
  }
  const role = req.user.role;
  const allowed = roles.some((r) => {
    if (r === role) return true;
    if (r === 'faculty' && role === 'organizer') return true;
    return false;
  });
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Forbidden for this role' });
  }
  next();
};

module.exports = { protect, authorize };
