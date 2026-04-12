const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { explainRecommendations } = require('../services/openaiService');

/**
 * GET /api/recommendations
 * Uses past bookings + interests; enriches with OpenAI when OPENAI_API_KEY is set.
 */
exports.forUser = async (req, res) => {
  try {
    const user = req.user;
    const bookings = await Booking.find({ user: user._id, status: 'confirmed' }).populate('event');
    const categories = new Set();
    bookings.forEach((b) => {
      if (b.event?.category) categories.add(b.event.category);
    });

    const bookedEventIds = bookings.map((b) => b.event?._id).filter(Boolean);

    const filter = {
      isPublished: true,
      date: { $gte: new Date() },
      _id: { $nin: bookedEventIds },
    };
    const catList = [...categories].filter((c) =>
      ['fest', 'workshop', 'seminar', 'competition', 'other'].includes(c)
    );
    if (catList.length) filter.category = { $in: catList };

    let events = await Event.find(filter).sort({ trendingScore: -1 }).limit(6).lean();
    if (!events.length) {
      events = await Event.find({ isPublished: true, date: { $gte: new Date() } })
        .sort({ trendingScore: -1 })
        .limit(6)
        .lean();
    }

    const titles = events.map((e) => e.title);
    let aiReasons = [];
    try {
      aiReasons = await explainRecommendations(user.name, titles);
    } catch {
      aiReasons = titles.map((t) => ({ title: t, reason: 'Trending near you.' }));
    }

    const reasonByTitle = Object.fromEntries(aiReasons.map((r) => [r.title, r.reason]));

    const data = events.map((e) => ({
      ...e,
      recommendationReason: reasonByTitle[e.title] || 'Matches campus activity.',
    }));

    res.json({ success: true, data, usedOpenAI: Boolean(process.env.OPENAI_API_KEY) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
