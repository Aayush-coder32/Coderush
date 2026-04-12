const Complaint = require('../models/Complaint');

exports.create = async (req, res) => {
  try {
    const { category, subject, body } = req.body;
    if (!category || !subject || !body) {
      return res.status(400).json({ success: false, message: 'category, subject, body required' });
    }
    const doc = await Complaint.create({
      user: req.user._id,
      category,
      subject,
      body,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.mine = async (req, res) => {
  try {
    const data = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listAll = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;
    const data = await Complaint.find(q).populate('user', 'name email').sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { status, resolution, assignedTo } = req.body;
    const doc = await Complaint.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    if (status) doc.status = status;
    if (resolution != null) doc.resolution = resolution;
    if (assignedTo) doc.assignedTo = assignedTo;
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
