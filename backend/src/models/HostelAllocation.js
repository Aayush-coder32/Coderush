const mongoose = require('mongoose');

const hostelAllocationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** Legacy / short label; for self-service mirrors `hostelName`. */
    block: { type: String, default: '', trim: true },
    roomNumber: { type: String, required: true, trim: true },
    bedNumber: { type: String, default: '', trim: true },
    academicYear: { type: String, required: true, trim: true },
    /** Admin who assigned; null when student submitted the form. */
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    hostelName: { type: String, default: '', trim: true },
    residentName: { type: String, default: '', trim: true },
    mobile: { type: String, default: '', trim: true },
    collegeName: { type: String, default: '', trim: true },
    branch: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

hostelAllocationSchema.index({ student: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('HostelAllocation', hostelAllocationSchema);
