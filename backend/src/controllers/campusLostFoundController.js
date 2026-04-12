const LostFound = require('../models/LostFound');
const { uploadBuffer } = require('../utils/uploadImage');

exports.list = async (req, res) => {
  try {
    const { kind, status } = req.query;
    const q = {};
    if (kind) q.kind = kind;
    if (status) q.status = status;
    else q.status = 'open';
    const data = await LostFound.find(q).populate('author', 'name email').sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { kind, title, description, locationHint } = req.body;
    if (!kind || !title) return res.status(400).json({ success: false, message: 'kind and title required' });

    let imageUrl = '';
    let imagePublicId = '';
    if (req.file?.buffer) {
      const up = await uploadBuffer(req.file.buffer, 'smart_campus_lostfound');
      imageUrl = up.url;
      imagePublicId = up.publicId;
    }

    const doc = await LostFound.create({
      author: req.user._id,
      kind,
      title,
      description: description || '',
      locationHint: locationHint || '',
      imageUrl,
      imagePublicId,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.claim = async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item || item.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Cannot claim' });
    }
    if (String(item.author) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot claim your own post' });
    }
    item.status = 'claimed';
    item.claimedBy = req.user._id;
    item.claimedAt = new Date();
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.closeMine = async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    if (String(item.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    item.status = 'closed';
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
