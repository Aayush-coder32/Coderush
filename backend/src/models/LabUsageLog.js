const mongoose = require('mongoose');

const labUsageLogSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'CampusResource', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['check_in', 'check_out', 'session'], default: 'session' },
    note: { type: String, default: '', maxlength: 500 },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

labUsageLogSchema.index({ resource: 1, startedAt: -1 });
labUsageLogSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model('LabUsageLog', labUsageLogSchema);
