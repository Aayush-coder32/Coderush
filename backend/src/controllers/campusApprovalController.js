const ApprovalRequest = require('../models/ApprovalRequest');

exports.create = async (req, res) => {
  try {
    const { type, title, details } = req.body;
    if (!type || !title) return res.status(400).json({ success: false, message: 'type and title required' });
    const doc = await ApprovalRequest.create({
      requester: req.user._id,
      type,
      title,
      details: details || '',
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.mine = async (req, res) => {
  try {
    const data = await ApprovalRequest.find({ requester: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.pendingQueue = async (req, res) => {
  try {
    if (!['admin', 'faculty', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Staff only' });
    }
    const data = await ApprovalRequest.find({ status: 'pending' })
      .populate('requester', 'name email studentRoll')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.review = async (req, res) => {
  try {
    if (!['admin', 'faculty', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Staff only' });
    }
    const { status, comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status approved or rejected' });
    }
    const doc = await ApprovalRequest.findById(req.params.id);
    if (!doc || doc.status !== 'pending') return res.status(400).json({ success: false, message: 'Invalid request' });
    doc.status = status;
    doc.reviewedBy = req.user._id;
    doc.reviewedAt = new Date();
    doc.comment = comment || '';
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
