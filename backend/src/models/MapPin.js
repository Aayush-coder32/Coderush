const mongoose = require('mongoose');

const mapPinSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['building', 'lab', 'hostel', 'food', 'sports', 'other'],
      default: 'building',
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

mapPinSchema.index({ category: 1 });

module.exports = mongoose.model('MapPin', mapPinSchema);
