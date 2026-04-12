const Booking = require('../models/Booking');
const Event = require('../models/Event');

/**
 * GET /api/organizer/dashboard
 * Aggregated registrations and revenue for events owned by this organizer.
 */
exports.dashboard = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).select('_id title date price bookedCount').lean();
    const eventIds = events.map((e) => e._id);

    const confirmed = await Booking.aggregate([
      { $match: { event: { $in: eventIds }, status: 'confirmed' } },
      {
        $group: {
          _id: '$event',
          registrations: { $sum: 1 },
          revenue: { $sum: '$amountPaid' },
          checkedIn: { $sum: { $cond: ['$checkedIn', 1, 0] } },
        },
      },
    ]);

    const map = Object.fromEntries(confirmed.map((c) => [String(c._id), c]));
    const rows = events.map((e) => ({
      ...e,
      registrations: map[String(e._id)]?.registrations || 0,
      revenue: map[String(e._id)]?.revenue || 0,
      checkedIn: map[String(e._id)]?.checkedIn || 0,
    }));

    const totals = rows.reduce(
      (a, r) => ({
        registrations: a.registrations + r.registrations,
        revenue: a.revenue + r.revenue,
        checkedIn: a.checkedIn + r.checkedIn,
      }),
      { registrations: 0, revenue: 0, checkedIn: 0 }
    );

    res.json({ success: true, totals, events: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/organizer/checkin
 * Body: { ticketCode } or { qrRaw } (JSON string from scanned QR)
 */
exports.checkIn = async (req, res) => {
  try {
    let ticketCode = req.body.ticketCode?.trim?.();
    const raw = typeof req.body.qrRaw === 'string' ? req.body.qrRaw.trim() : '';
    if (!ticketCode && raw) {
      try {
        const parsed = JSON.parse(raw);
        ticketCode = parsed.ticketCode;
      } catch {
        /** Camera scanners often return the raw ticket id (e.g. TKT-…) instead of JSON. */
        ticketCode = raw;
      }
    }
    if (!ticketCode) {
      return res.status(400).json({ success: false, message: 'ticketCode or qrRaw required' });
    }

    const booking = await Booking.findOne({ ticketCode }).populate('event');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invalid ticket' });
    }

    const event = booking.event;
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not your event' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Booking not confirmed' });
    }
    if (booking.checkedIn) {
      return res.json({ success: true, message: 'Already checked in', data: booking });
    }

    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    await Event.updateOne({ _id: event._id }, { $inc: { checkedInCount: 1 } });

    res.json({ success: true, message: 'Checked in', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/organizer/events/:eventId/attendees
 */
exports.attendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const list = await Booking.find({ event: event._id, status: 'confirmed' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      crowd: {
        registered: list.length,
        checkedIn: event.checkedInCount,
        liveOnline: event.liveViewers,
      },
      data: list,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
