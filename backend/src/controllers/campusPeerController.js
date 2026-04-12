const User = require('../models/User');

exports.directory = async (req, res) => {
  try {
    const { skill, department } = req.query;
    const q = { role: 'student' };
    if (skill) q.skills = new RegExp(skill, 'i');
    if (department) q.department = new RegExp(department, 'i');

    const data = await User.find(q)
      .select('name email department studentRoll skills bio avatar')
      .sort({ name: 1 })
      .limit(100)
      .lean();

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
