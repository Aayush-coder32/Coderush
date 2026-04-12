const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    details: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

approvalRequestSchema.index({ status: 1, createdAt: -1 });
approvalRequestSchema.index({ requester: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
