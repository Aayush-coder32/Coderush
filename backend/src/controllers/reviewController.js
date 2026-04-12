const Review = require('../models/Review');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

/**
 * POST /api/reviews
 * Only attendees with confirmed booking can review once per event.
 */
exports.create = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const attended = await Booking.findOne({
      user: req.user._id,
      event: eventId,
      status: 'confirmed',
    });
    if (!attended) {
      return res.status(403).json({ success: false, message: 'Only confirmed attendees can review' });
    }

    const review = await Review.create({
      user: req.user._id,
      event: eventId,
      rating: Number(rating),
      comment: comment || '',
    });

    event.trendingScore += Number(rating);
    await event.save();

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already reviewed this event' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/reviews/event/:eventId */
exports.forEvent = async (req, res) => {
  try {
    const list = await Review.find({ event: req.params.eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
