const mongoose = require('mongoose');

/** Persisted chat messages per event (attendee discussion). */
const chatMessageSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
