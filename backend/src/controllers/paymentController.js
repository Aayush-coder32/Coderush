const crypto = require('crypto');
const mongoose = require('mongoose');
const stripeLib = require('stripe');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { notifyBookingConfirmed } = require('../services/emailService');
const User = require('../models/User');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith('sk_')) return null;
  return stripeLib(key);
}

function getRazorpay() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret || !id.startsWith('rzp_')) return null;
  return new Razorpay({ key_id: id, key_secret: secret });
}

/**
 * Shared success path after Stripe or Razorpay confirms payment.
 */
async function finalizePaidBooking(booking, userId, paymentRef, amountPaid) {
  if (String(booking.user) !== String(userId)) {
    throw new Error('Booking not found');
  }
  if (booking.status === 'confirmed') {
    return { already: true, booking };
  }

  const event = booking.event;
  const remaining = event.totalSeats - event.bookedCount;
  if (remaining < 1) {
    booking.status = 'cancelled';
    await booking.save();
    throw new Error('Event sold out — refund flow not implemented');
  }

  booking.status = 'confirmed';
  booking.paymentIntentId = paymentRef;
  booking.amountPaid = Number(amountPaid);
  await booking.save();

  event.bookedCount += 1;
  event.trendingScore += 2;
  await event.save();

  const user = await User.findById(userId);
  if (user) {
    try {
      await notifyBookingConfirmed(user.email, event.title, booking.ticketCode);
    } catch (e) {
      console.error('[payment] notifyBookingConfirmed:', e.message);
    }
  }

  return { already: false, booking };
}

/** GET /api/payments/config — public; exposes only Razorpay key_id (safe by design). */
exports.getConfig = (req, res) => {
  const stripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'));
  const razorpay = Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_ID.startsWith('rzp_')
  );
  res.json({
    success: true,
    stripe,
    razorpay,
    razorpayKeyId: razorpay ? process.env.RAZORPAY_KEY_ID : null,
  });
};

/**
 * POST /api/payments/create-checkout-session
 * Body: { bookingId } — creates Stripe Checkout for that pending booking.
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(400).json({
        success: false,
        message: 'Stripe not configured — use free events or demo simulate flow',
      });
    }

    if (!req.body.bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }
    if (!mongoose.isValidObjectId(req.body.bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId' });
    }

    const booking = await Booking.findById(req.body.bookingId).populate('event');
    if (!booking || String(booking.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is not pending payment' });
    }

    const event = booking.event;
    if (!event || !event._id) {
      return res.status(400).json({ success: false, message: 'Event missing for this booking' });
    }
    const unitAmount = Math.round(Number(event.price) * 100);
    if (unitAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Event is free — no checkout needed' });
    }

    const clientBase = process.env.CLIENT_URL || 'http://localhost:3001';
    const payerEmail =
      typeof req.user.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.user.email.trim())
        ? req.user.email.trim()
        : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      ...(payerEmail ? { customer_email: payerEmail } : {}),
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: String(event.title || 'Event ticket').slice(0, 120),
              description: String(event.location || '').slice(0, 200),
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${clientBase}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientBase}/events/${event._id}`,
      metadata: {
        bookingId: String(booking._id),
        eventId: String(event._id),
        userId: String(req.user._id),
      },
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    const msg = err.raw?.message || err.message || 'Stripe checkout failed';
    const code = err.raw?.code || err.code;
    const clientErr =
      code === 'amount_too_small' ||
      /currency|minimum|invalid_request/i.test(String(msg)) ||
      err.type === 'StripeInvalidRequestError';
    res.status(clientErr ? 400 : 500).json({ success: false, message: msg });
  }
};

/**
 * GET /api/payments/verify-session?session_id=
 * Call after redirect from Stripe success page.
 */
exports.verifySession = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(400).json({ success: false, message: 'Stripe not configured' });
    }
    const sessionId = req.query.session_id;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'session_id required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const bookingId = session.metadata?.bookingId;
    if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid session metadata' });
    }
    const booking = await Booking.findById(bookingId).populate('event');
    if (!booking || String(booking.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (!booking.event || !booking.event._id) {
      return res.status(400).json({ success: false, message: 'Event missing for this booking' });
    }

    const pi = session.payment_intent;
    const ref =
      typeof pi === 'string' && pi
        ? pi
        : pi && typeof pi === 'object' && pi.id
          ? String(pi.id)
          : String(session.id);
    const amount = Number(booking.event.price);
    const result = await finalizePaidBooking(booking, req.user._id, ref, amount);
    res.json({
      success: true,
      data: result.booking,
      message: result.already ? 'Already confirmed' : undefined,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/payments/razorpay/create-order
 * Creates a Razorpay order in paise; stores order id on the booking.
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const rz = getRazorpay();
    if (!rz) {
      return res.status(400).json({ success: false, message: 'Razorpay not configured' });
    }

    if (!req.body.bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }
    if (!mongoose.isValidObjectId(req.body.bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId' });
    }

    const booking = await Booking.findById(req.body.bookingId).populate('event');
    if (!booking || String(booking.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is not pending payment' });
    }

    const event = booking.event;
    if (!event || !event._id) {
      return res.status(400).json({ success: false, message: 'Event missing for this booking' });
    }
    const amountPaise = Math.round(Number(event.price) * 100);
    if (amountPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Event is free' });
    }

    const order = await rz.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `bk_${String(booking._id).slice(-14)}`,
      notes: {
        bookingId: String(booking._id),
        eventId: String(event._id),
      },
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      /** Optional overrides for checkout UPI prefill (see frontend Razorpay options). */
      prefillVpa: process.env.RAZORPAY_PREFILL_VPA || undefined,
      prefillContact: process.env.RAZORPAY_PREFILL_CONTACT || undefined,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/payments/razorpay/verify
 * Body: bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature
 */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(400).json({ success: false, message: 'Razorpay not configured' });
    }

    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }
    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const booking = await Booking.findById(bookingId).populate('event');
    if (!booking || String(booking.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (!booking.event || !booking.event._id) {
      return res.status(400).json({ success: false, message: 'Event missing for this booking' });
    }
    if (!booking.razorpayOrderId || booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Order mismatch — open Pay with Razorpay again to create a fresh order',
      });
    }

    const amount = Number(booking.event.price);
    const result = await finalizePaidBooking(booking, req.user._id, razorpay_payment_id, amount);
    res.json({ success: true, data: result.booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/payments/wallet-pay
 * Deduct wallet for free-tier demo when event has price > 0.
 */
exports.walletPay = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }
    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId' });
    }
    const booking = await Booking.findById(bookingId).populate('event');
    if (!booking || String(booking.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const event = booking.event;
    if (!event || !event._id) {
      return res.status(400).json({ success: false, message: 'Event missing for this booking' });
    }
    const price = Number(event.price) || 0;
    if (price <= 0) {
      return res.status(400).json({ success: false, message: 'Use normal booking for free events' });
    }

    const user = await User.findById(req.user._id);
    if (user.walletBalance < price) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const remaining = event.totalSeats - event.bookedCount;
    if (remaining < 1) {
      return res.status(400).json({ success: false, message: 'Sold out' });
    }

    user.walletBalance -= price;
    await user.save();

    booking.status = 'confirmed';
    booking.amountPaid = price;
    await booking.save();

    event.bookedCount += 1;
    event.trendingScore += 2;
    await event.save();

    try {
      await notifyBookingConfirmed(user.email, event.title, booking.ticketCode);
    } catch (e) {
      console.error('[payment] wallet notify:', e.message);
    }

    res.json({ success: true, data: booking, walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
