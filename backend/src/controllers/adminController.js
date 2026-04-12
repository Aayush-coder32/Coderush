const User = require('../models/User');

/** GET /api/admin/users */
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role: 'student' | 'organizer' | 'admin' }
 */
exports.setRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'faculty', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.role = role === 'organizer' ? 'faculty' : role;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/admin/wallet — credit demo wallet */
exports.creditWallet = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.walletBalance += Number(amount) || 0;
    await user.save();
    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
