const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseCode: { type: String, required: true, uppercase: true, trim: true },
    markedAt: { type: Date, default: Date.now },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    deviceFingerprint: { type: String, default: '', maxlength: 128 },
    qrWindow: { type: Number },
    checks: {
      geofenceOk: { type: Boolean, default: false },
      timeOk: { type: Boolean, default: false },
      qrOk: { type: Boolean, default: false },
    },
    proxyRisk: { type: String, enum: ['none', 'low', 'medium'], default: 'none' },
    college: { type: String, enum: ['BBDU', 'BBDITM', 'BBDNIIT'], required: true },
    branch: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ session: 1, user: 1 }, { unique: true });
attendanceRecordSchema.index({ user: 1, markedAt: -1 });
attendanceRecordSchema.index({ courseCode: 1, user: 1 });
attendanceRecordSchema.index({ college: 1, branch: 1, section: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
