const mongoose = require('mongoose');

const resourceBookingSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'CampusResource', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    purpose: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

resourceBookingSchema.index({ resource: 1, startAt: 1, endAt: 1 });
resourceBookingSchema.index({ user: 1, startAt: -1 });

module.exports = mongoose.model('ResourceBooking', resourceBookingSchema);
