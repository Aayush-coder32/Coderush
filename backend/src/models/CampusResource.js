const mongoose = require('mongoose');

const campusResourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['book', 'lab_equipment', 'room'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    totalCopies: { type: Number, default: 1, min: 0 },
    availableCopies: { type: Number, default: 1, min: 0 },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'retired'],
      default: 'available',
    },
    capacity: { type: Number, default: 1, min: 1 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

campusResourceSchema.index({ name: 'text', code: 'text', description: 'text' });
campusResourceSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('CampusResource', campusResourceSchema);
