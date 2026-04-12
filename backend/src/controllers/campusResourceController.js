const CampusResource = require('../models/CampusResource');
const LibraryLoan = require('../models/LibraryLoan');
const LabUsageLog = require('../models/LabUsageLog');
const ResourceBooking = require('../models/ResourceBooking');
const { COLLEGES } = require('../constants/attendanceCohort');

function staff(user) {
  return user.role === 'faculty' || user.role === 'organizer' || user.role === 'admin';
}

exports.listResources = async (req, res) => {
  try {
    const { type, status } = req.query;
    const q = {};
    if (type) q.type = type;
    if (status) q.status = status;
    const data = await CampusResource.find(q).sort({ type: 1, name: 1 }).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createResource = async (req, res) => {
  try {
    if (!staff(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin' });
    }
    const body = req.body;
    const doc = await CampusResource.create({
      type: body.type,
      name: body.name,
      code: body.code || '',
      description: body.description || '',
      location: body.location || '',
      totalCopies: body.totalCopies ?? 1,
      availableCopies: body.availableCopies ?? body.totalCopies ?? 1,
      status: body.status || 'available',
      capacity: body.capacity ?? 1,
      meta: body.meta || {},
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateResource = async (req, res) => {
  try {
    if (!staff(req.user)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const doc = await CampusResource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.libraryIssue = async (req, res) => {
  try {
    if (!staff(req.user)) return res.status(403).json({ success: false, message: 'Staff only' });
    const { resourceId, userId, days } = req.body;
    const resource = await CampusResource.findById(resourceId);
    if (!resource || resource.type !== 'book') {
      return res.status(400).json({ success: false, message: 'Invalid book resource' });
    }
    if (resource.availableCopies < 1) {
      return res.status(400).json({ success: false, message: 'No copies available' });
    }
    const due = new Date();
    due.setDate(due.getDate() + (Number(days) || 14));
    resource.availableCopies -= 1;
    await resource.save();
    const loan = await LibraryLoan.create({
      resource: resource._id,
      user: userId,
      issuedBy: req.user._id,
      dueAt: due,
    });
    res.status(201).json({ success: true, data: loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.libraryReturn = async (req, res) => {
  try {
    if (!staff(req.user)) return res.status(403).json({ success: false, message: 'Staff only' });
    const loan = await LibraryLoan.findById(req.params.loanId).populate('resource');
    if (!loan || loan.returnedAt) return res.status(404).json({ success: false, message: 'Invalid loan' });
    loan.returnedAt = new Date();
    await loan.save();
    const resource = loan.resource;
    if (resource) {
      resource.availableCopies = Math.min(resource.totalCopies, resource.availableCopies + 1);
      await resource.save();
    }
    res.json({ success: true, data: loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function parseYmdLocal(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const parts = ymd.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * POST /campus/library/borrow-self — student: college, reg no., subject, issue date, end (return) date.
 */
exports.libraryBorrowSelf = async (req, res) => {
  try {
    const { collegeName, registrationNumber, subjectTitle, issueDate, endDate } = req.body;
    if (!collegeName || !COLLEGES.includes(String(collegeName).trim())) {
      return res.status(400).json({ success: false, message: 'Select a valid college' });
    }
    const reg = typeof registrationNumber === 'string' ? registrationNumber.trim() : '';
    if (!reg || reg.length < 3) {
      return res.status(400).json({ success: false, message: 'Enter your registration number' });
    }
    const subject = typeof subjectTitle === 'string' ? subjectTitle.trim() : '';
    if (!subject || subject.length < 2) {
      return res.status(400).json({ success: false, message: 'Enter the subject / name of book' });
    }
    const issuedAt = parseYmdLocal(issueDate);
    if (!issuedAt) {
      return res.status(400).json({ success: false, message: 'Invalid issue date' });
    }
    const dueAt = parseYmdLocal(endDate);
    if (!dueAt) {
      return res.status(400).json({ success: false, message: 'Invalid end date' });
    }
    if (dueAt < issuedAt) {
      return res.status(400).json({ success: false, message: 'End date cannot be before issue date' });
    }

    const loan = await LibraryLoan.create({
      resource: null,
      user: req.user._id,
      issuedBy: null,
      issuedAt,
      dueAt,
      collegeName: collegeName.trim(),
      registrationNumber: reg,
      subjectTitle: subject,
    });
    res.status(201).json({ success: true, data: loan, message: 'Library borrow recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.myLoans = async (req, res) => {
  try {
    const list = await LibraryLoan.find({ user: req.user._id, returnedAt: null })
      .populate('resource')
      .sort({ dueAt: 1 })
      .lean();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.labLog = async (req, res) => {
  try {
    const { resourceId, action, note } = req.body;
    const resource = await CampusResource.findById(resourceId);
    if (!resource || resource.type !== 'lab_equipment') {
      return res.status(400).json({ success: false, message: 'Invalid lab resource' });
    }
    const log = await LabUsageLog.create({
      resource: resource._id,
      user: req.user._id,
      action: action || 'session',
      note: note || '',
    });
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createResourceBooking = async (req, res) => {
  try {
    const { resourceId, startAt, endAt, purpose } = req.body;
    const resource = await CampusResource.findById(resourceId);
    if (!resource || resource.type !== 'room') {
      return res.status(400).json({ success: false, message: 'Book a room resource' });
    }
    const s = new Date(startAt);
    const e = new Date(endAt);
    if (e <= s) return res.status(400).json({ success: false, message: 'Invalid time range' });

    const overlap = await ResourceBooking.findOne({
      resource: resource._id,
      status: { $ne: 'cancelled' },
      startAt: { $lt: e },
      endAt: { $gt: s },
    });
    if (overlap) {
      return res.status(409).json({ success: false, message: 'Slot already booked' });
    }

    const booking = await ResourceBooking.create({
      resource: resource._id,
      user: req.user._id,
      startAt: s,
      endAt: e,
      purpose: purpose || '',
      status: 'confirmed',
    });
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listMyResourceBookings = async (req, res) => {
  try {
    const data = await ResourceBooking.find({ user: req.user._id })
      .populate('resource')
      .sort({ startAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** Aggregate bookings by hour for a room — lowest slots = AI "low crowd" hint. */
exports.suggestLabSlots = async (req, res) => {
  try {
    const { resourceId } = req.query;
    const match = { status: { $ne: 'cancelled' } };
    if (resourceId) match.resource = resourceId;
    const agg = await ResourceBooking.aggregate([
      { $match: match },
      {
        $project: {
          hour: { $hour: '$startAt' },
          dow: { $dayOfWeek: '$startAt' },
        },
      },
      { $group: { _id: { hour: '$hour', dow: '$dow' }, count: { $sum: 1 } } },
      { $sort: { count: 1 } },
      { $limit: 12 },
    ]);
    const best = agg.slice(0, 5).map((r) => ({
      dayOfWeek: r._id.dow,
      hour: r._id.hour,
      bookings: r.count,
      hint: `Typically quieter around ${r._id.hour}:00 (campus local time)`,
    }));
    res.json({
      success: true,
      data: best,
      aiSummary:
        best.length > 0
          ? `Best windows: ${best.map((b) => `dow ${b.dayOfWeek} @ ${b.hour}h (${b.bookings} bookings)`).join('; ')}`
          : 'Not enough booking history — try early morning slots.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
