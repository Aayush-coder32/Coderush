const mongoose = require('mongoose');

/** Lightweight signals for the AI Campus Brain (views, opens, searches). */
const behaviorEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: {
      type: String,
      enum: ['view_event', 'view_note', 'forum_view', 'resource_view', 'search'],
      required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

behaviorEventSchema.index({ user: 1, createdAt: -1 });
behaviorEventSchema.index({ kind: 1, createdAt: -1 });

module.exports = mongoose.model('BehaviorEvent', behaviorEventSchema);
