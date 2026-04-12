const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    courseTag: { type: String, default: '', trim: true },
    fileUrl: { type: String, default: '' },
    filePublicId: { type: String, default: '' },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ courseTag: 1 });
noteSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Note', noteSchema);
