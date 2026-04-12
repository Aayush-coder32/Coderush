const MapPin = require('../models/MapPin');

exports.listPins = async (req, res) => {
  try {
    const data = await MapPin.find().sort({ label: 1 }).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.upsertPin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { id, label, category, lat, lng, description } = req.body;
    if (id) {
      const doc = await MapPin.findByIdAndUpdate(
        id,
        { label, category, lat, lng, description },
        { new: true }
      );
      return res.json({ success: true, data: doc });
    }
    const doc = await MapPin.create({
      label,
      category: category || 'building',
      lat,
      lng,
      description: description || '',
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
