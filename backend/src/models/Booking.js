const mongoose = require('mongoose');

/**
 * One ticket booking per user per event (unique compound index).
 */
const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    /** Human-readable ticket id for check-in. */
    ticketCode: { type: String, required: true, unique: true },
    /** Payload encoded into QR (JSON string). */
    qrPayload: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    paymentIntentId: { type: String, default: '' },
    /** Latest Razorpay order id for this booking (test / live checkout). */
    razorpayOrderId: { type: String, default: '' },
    amountPaid: { type: Number, default: 0 },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
