const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseCode: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, trim: true, default: '' },
    geoCenter: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    geoRadiusMeters: { type: Number, default: 100, min: 20, max: 500 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    qrSecret: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ faculty: 1, startsAt: -1 });
attendanceSessionSchema.index({ courseCode: 1, startsAt: -1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
