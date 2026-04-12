const QRCode = require('qrcode');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { generateTicketCode } = require('../utils/ticketCode');
const { notifyBookingConfirmed } = require('../services/emailService');

async function buildQrPayload(booking, event) {
  const payload = JSON.stringify({
    ticketCode: booking.ticketCode,
    eventId: String(event._id),
    userId: String(booking.user),
  });
  return QRCode.toDataURL(payload);
}

/**
 * POST /api/bookings
 * Free events → confirmed immediately. Paid → pending until Stripe verify or simulate in dev.
 */
exports.create = async (req, res) => {
  try {
    const { eventId, simulatePaid } = req.body;
    const event = await Event.findById(eventId);
    if (!event || !event.isPublished) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const remaining = event.totalSeats - event.bookedCount;
    if (remaining < 1) {
      return res.status(400).json({ success: false, message: 'Sold out' });
    }

    const existing = await Booking.findOne({ user: req.user._id, event: event._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already booked this event' });
    }

    const ticketCode = generateTicketCode();
    const qrDataUrl = await buildQrPayload(
      { ticketCode, user: req.user._id },
      event
    );
    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      ticketCode,
      qrPayload: qrDataUrl,
      status: 'pending',
      amountPaid: 0,
    });

    const isFree = !event.price || event.price <= 0;
    const stripeOk = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'));
    const razorpayOk = Boolean(
      process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET &&
        process.env.RAZORPAY_KEY_ID.startsWith('rzp_')
    );
    const anyGateway = stripeOk || razorpayOk;

    if (isFree) {
      booking.status = 'confirmed';
      await booking.save();
      event.bookedCount += 1;
      event.trendingScore += 2;
      await event.save();
      try {
        await notifyBookingConfirmed(req.user.email, event.title, ticketCode);
      } catch (e) {
        console.error('[booking] notify:', e.message);
      }
      return res.status(201).json({
        success: true,
        data: booking,
        message: 'Free ticket confirmed',
      });
    }

    if (!anyGateway && (simulatePaid || process.env.NODE_ENV !== 'production')) {
      booking.status = 'confirmed';
      booking.amountPaid = event.price;
      await booking.save();
      event.bookedCount += 1;
      event.trendingScore += 2;
      await event.save();
      try {
        await notifyBookingConfirmed(req.user.email, event.title, ticketCode);
      } catch (e) {
        console.error('[booking] notify:', e.message);
      }
      return res.status(201).json({
        success: true,
        data: booking,
        message: 'Simulated payment (no Stripe key) — ticket confirmed for demo',
      });
    }

    return res.status(201).json({
      success: true,
      data: booking,
      needsPayment: true,
      checkoutHint: 'Use POST /api/payments/create-checkout-session with bookingId',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/bookings/mine */
exports.mine = async (req, res) => {
  try {
    const list = await Booking.find({ user: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/bookings/:id */
exports.getOne = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('event');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
