const Bookmark = require('../models/Bookmark');
const Event = require('../models/Event');

/** POST /api/bookmarks/toggle { eventId } */
exports.toggle = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const existing = await Bookmark.findOne({ user: req.user._id, event: eventId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, bookmarked: false });
    }
    await Bookmark.create({ user: req.user._id, event: eventId });
    res.json({ success: true, bookmarked: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/bookmarks */
exports.list = async (req, res) => {
  try {
    const marks = await Bookmark.find({ user: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: marks.map((m) => m.event).filter(Boolean) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/bookmarks/status/:eventId */
exports.status = async (req, res) => {
  try {
    const b = await Bookmark.findOne({ user: req.user._id, event: req.params.eventId });
    res.json({ success: true, bookmarked: Boolean(b) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
