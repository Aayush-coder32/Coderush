const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['lost', 'found'], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    locationHint: { type: String, default: '' },
    status: { type: String, enum: ['open', 'claimed', 'closed'], default: 'open' },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    claimedAt: { type: Date },
  },
  { timestamps: true }
);

lostFoundSchema.index({ status: 1, createdAt: -1 });
lostFoundSchema.index({ kind: 1 });

module.exports = mongoose.model('LostFound', lostFoundSchema);
