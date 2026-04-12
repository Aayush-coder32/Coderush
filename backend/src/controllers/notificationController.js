const Booking = require('../models/Booking');
const AppNotification = require('../models/AppNotification');
const { notifyEventReminder } = require('../services/emailService');
const User = require('../models/User');

/**
 * POST /api/notifications/remind
 * Demo: send reminder email for a booking (organizer/admin or self).
 */
exports.sendReminder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('event');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (String(booking.user) !== String(req.user._id) && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await User.findById(booking.user);
    const event = booking.event;
    const when = `${event.date?.toDateString?.() || ''} ${event.startTime || ''}`;
    await notifyEventReminder(user.email, event.title, when);
    res.json({ success: true, message: 'Reminder queued (see server logs if SMTP not set)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/notifications/in-app
 * Simple list of user's upcoming confirmed bookings as in-app notifications.
 */
exports.inApp = async (req, res) => {
  try {
    const list = await Booking.find({ user: req.user._id, status: 'confirmed' })
      .populate('event')
      .sort({ createdAt: -1 })
      .lean();

    const bookingNotes = list
      .filter((b) => b.event && new Date(b.event.date) >= new Date())
      .slice(0, 10)
      .map((b) => ({
        id: b._id,
        type: 'booking',
        title: `Upcoming: ${b.event.title}`,
        body: `${b.event.location} — ${new Date(b.event.date).toLocaleDateString()}`,
        read: false,
      }));

    const campus = await AppNotification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const campusMapped = campus.map((n) => ({
      id: n._id,
      type: n.type || 'campus',
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    }));

    const merged = [...campusMapped, ...bookingNotes].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    res.json({ success: true, data: merged.slice(0, 25) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
