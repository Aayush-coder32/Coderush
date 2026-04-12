const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const AttendanceRecord = require('../models/AttendanceRecord');
const Complaint = require('../models/Complaint');
const CampusResource = require('../models/CampusResource');
const LibraryLoan = require('../models/LibraryLoan');
const ResourceBooking = require('../models/ResourceBooking');
const Note = require('../models/Note');
const ForumThread = require('../models/ForumThread');

exports.overview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const [
      usersByRole,
      eventCount,
      bookingCount,
      attendanceCount,
      openComplaints,
      resourceCount,
      activeLoans,
      upcomingBookings,
      noteCount,
      threadCount,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', c: { $sum: 1 } } }]),
      Event.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      AttendanceRecord.countDocuments(),
      Complaint.countDocuments({ status: 'open' }),
      CampusResource.countDocuments(),
      LibraryLoan.countDocuments({ returnedAt: null }),
      ResourceBooking.countDocuments({ startAt: { $gte: new Date() }, status: { $ne: 'cancelled' } }),
      Note.countDocuments(),
      ForumThread.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        usersByRole: Object.fromEntries(usersByRole.map((x) => [x._id, x.c])),
        eventCount,
        bookingCount,
        attendanceCount,
        openComplaints,
        resourceCount,
        activeLoans,
        upcomingBookings,
        noteCount,
        threadCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
