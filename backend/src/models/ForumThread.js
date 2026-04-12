const mongoose = require('mongoose');

const forumThreadSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    flair: { type: String, default: 'general', trim: true },
    upvotes: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

forumThreadSchema.index({ createdAt: -1 });
forumThreadSchema.index({ flair: 1, upvotes: -1 });
forumThreadSchema.index({ title: 'text', body: 'text' });

module.exports = mongoose.model('ForumThread', forumThreadSchema);
