const mongoose = require('mongoose');

/**
 * Campus event created by an organizer.
 * bookedCount and trendingScore are updated when bookings/reviews change.
 */
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['fest', 'workshop', 'seminar', 'competition', 'other'],
      default: 'other',
    },
    date: { type: Date, required: true },
    startTime: { type: String, default: '10:00' },
    endTime: { type: String, default: '12:00' },
    location: { type: String, required: true },
    price: { type: Number, default: 0, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: true },
    /** Higher = more "trending" (bookings + reviews boost). */
    trendingScore: { type: Number, default: 0 },
    /** Socket.io: users currently in event chat room (approximate crowd online). */
    liveViewers: { type: Number, default: 0, min: 0 },
    /** Checked-in attendees count (updated at QR scan). */
    checkedInCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1, category: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
