const mongoose = require('mongoose');

const appNotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    type: { type: String, default: 'info', trim: true },
    read: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

appNotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('AppNotification', appNotificationSchema);
