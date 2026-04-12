const HostelAllocation = require('../models/HostelAllocation');
const { HOSTEL_NAMES, isValidHostelName, isValidRoomNumber } = require('../constants/hostels');

function defaultAcademicYear() {
  const y = new Date().getFullYear();
  const next = String(y + 1).slice(-2);
  return `${y}-${next}`;
}

exports.assign = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { studentId, block, roomNumber, bedNumber, academicYear } = req.body;
    if (!studentId || !block || !roomNumber || !academicYear) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    const doc = await HostelAllocation.create({
      student: studentId,
      block,
      roomNumber,
      bedNumber: bedNumber || '',
      academicYear,
      allocatedBy: req.user._id,
      hostelName: block,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Student already allocated for this year' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.mine = async (req, res) => {
  try {
    const data = await HostelAllocation.find({ student: req.user._id })
      .sort({ academicYear: -1 })
      .lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listAll = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const data = await HostelAllocation.find()
      .populate('student', 'name email studentRoll')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /campus/hostel/allocate-self — student picks hostel, room 1–300, and details.
 */
exports.allocateSelf = async (req, res) => {
  try {
    const {
      hostelName,
      roomNumber,
      studentName,
      mobile,
      collegeName,
      branch,
      academicYear,
    } = req.body;

    const year = (academicYear || defaultAcademicYear()).trim();
    if (!isValidHostelName(hostelName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid hostel. Choose one of: ${HOSTEL_NAMES.join(', ')}`,
      });
    }
    if (!isValidRoomNumber(roomNumber)) {
      return res.status(400).json({ success: false, message: 'Room must be between 1 and 300' });
    }
    const name = typeof studentName === 'string' ? studentName.trim() : '';
    const mob = typeof mobile === 'string' ? mobile.replace(/\D/g, '') : '';
    const college = typeof collegeName === 'string' ? collegeName.trim() : '';
    const br = typeof branch === 'string' ? branch.trim() : '';
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }
    if (mob.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
    }
    if (!college) {
      return res.status(400).json({ success: false, message: 'College name is required' });
    }
    if (!br) {
      return res.status(400).json({ success: false, message: 'Branch is required' });
    }

    const hn = hostelName.trim();
    const rn = String(Number.parseInt(String(roomNumber).trim(), 10));

    const doc = await HostelAllocation.findOneAndUpdate(
      { student: req.user._id, academicYear: year },
      {
        student: req.user._id,
        hostelName: hn,
        block: hn,
        roomNumber: rn,
        bedNumber: '',
        academicYear: year,
        allocatedBy: null,
        residentName: name,
        mobile: mob.slice(-10),
        collegeName: college,
        branch: br,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, data: doc, message: 'Hostel allocation saved' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already recorded for this academic year' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /campus/hostel/options — hostel list for dropdowns */
exports.options = (req, res) => {
  res.json({ success: true, hostels: HOSTEL_NAMES, roomsMin: 1, roomsMax: 300 });
};
