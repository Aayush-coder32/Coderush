const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { uploadBuffer } = require('../utils/uploadImage');

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';

/**
 * GET /api/events
 * Query: search, category, minPrice, maxPrice, fromDate, toDate, sort (date|popularity|price_asc|price_desc)
 */
exports.listEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      fromDate,
      toDate,
      sort = 'date',
    } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (minPrice !== undefined) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice !== undefined) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (fromDate) filter.date = { ...filter.date, $gte: new Date(fromDate) };
    if (toDate) filter.date = { ...filter.date, $lte: new Date(toDate) };
    if (search) {
      filter.$text = { $search: search };
    }

    let sortObj = { date: 1 };
    if (sort === 'popularity') sortObj = { trendingScore: -1, date: 1 };
    if (sort === 'price_asc') sortObj = { price: 1, date: 1 };
    if (sort === 'price_desc') sortObj = { price: -1, date: 1 };

    const events = await Event.find(filter)
      .sort(sortObj)
      .populate('organizer', 'name email')
      .lean();

    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/events/trending */
exports.trending = async (req, res) => {
  try {
    const events = await Event.find({ isPublished: true })
      .sort({ trendingScore: -1, bookedCount: -1 })
      .limit(8)
      .populate('organizer', 'name')
      .lean();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/events/upcoming */
exports.upcoming = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({ isPublished: true, date: { $gte: now } })
      .sort({ date: 1 })
      .limit(12)
      .populate('organizer', 'name')
      .lean();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/events/:id */
exports.getById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const reviews = await Review.find({ event: event._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const avg =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
    res.json({
      success: true,
      data: event,
      reviews,
      ratingSummary: { average: Math.round(avg * 10) / 10, count: reviews.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/events
 * Organizer/Admin — multipart field `poster` optional.
 */
exports.create = async (req, res) => {
  try {
    const body = req.body;
    const payload = {
      title: body.title,
      description: body.description || '',
      category: body.category || 'other',
      date: new Date(body.date),
      startTime: body.startTime || '10:00',
      endTime: body.endTime || '12:00',
      location: body.location,
      price: Number(body.price) || 0,
      totalSeats: Number(body.totalSeats),
      organizer: req.user._id,
      isPublished: body.isPublished !== 'false',
    };

    if (req.file?.buffer) {
      const img = await uploadBuffer(req.file.buffer);
      payload.image = { url: img.url, publicId: img.publicId };
    } else {
      payload.image = { url: PLACEHOLDER, publicId: '' };
    }

    const event = await Event.create(payload);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/events/:id */
exports.update = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your event' });
    }

    const b = req.body;
    ['title', 'description', 'category', 'startTime', 'endTime', 'location', 'isPublished'].forEach(
      (k) => {
        if (b[k] !== undefined) event[k] = b[k];
      }
    );
    if (b.date) event.date = new Date(b.date);
    if (b.price !== undefined) event.price = Number(b.price);
    if (b.totalSeats !== undefined) event.totalSeats = Number(b.totalSeats);

    if (req.file?.buffer) {
      const img = await uploadBuffer(req.file.buffer);
      event.image = { url: img.url, publicId: img.publicId };
    }

    await event.save();
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/events/:id */
exports.remove = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your event' });
    }
    await Booking.deleteMany({ event: event._id });
    await Review.deleteMany({ event: event._id });
    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/events/mine — organizer's events */
exports.myEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ date: -1 }).lean();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
