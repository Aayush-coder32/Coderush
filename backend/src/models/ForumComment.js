const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 8000 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumComment', default: null },
  },
  { timestamps: true }
);

forumCommentSchema.index({ thread: 1, createdAt: 1 });

module.exports = mongoose.model('ForumComment', forumCommentSchema);
