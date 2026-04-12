const crypto = require('crypto');
const QRCode = require('qrcode');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const { distanceMeters } = require('../utils/geo');
const { timeBucket, tokenForSession, verifyToken, qrPayload, WINDOW_MS } = require('../utils/attendanceQr');
const { notifyUser } = require('../services/notifyUser');
const { isValidCohort } = require('../constants/attendanceCohort');

function isFaculty(user) {
  return user.role === 'faculty' || user.role === 'organizer' || user.role === 'admin';
}

exports.createSession = async (req, res) => {
  try {
    if (!isFaculty(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty only' });
    }
    const { courseCode, title, geoCenter, geoRadiusMeters, startsAt, endsAt } = req.body;
    if (!courseCode || !geoCenter?.lat || !geoCenter?.lng || !startsAt || !endsAt) {
      return res.status(400).json({ success: false, message: 'courseCode, geoCenter, startsAt, endsAt required' });
    }
    const session = await AttendanceSession.create({
      faculty: req.user._id,
      courseCode: String(courseCode).toUpperCase(),
      title: title || '',
      geoCenter: { lat: Number(geoCenter.lat), lng: Number(geoCenter.lng) },
      geoRadiusMeters: Math.min(500, Math.max(20, Number(geoRadiusMeters) || 100)),
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      qrSecret: crypto.randomBytes(24).toString('hex'),
    });
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listSessions = async (req, res) => {
  try {
    const q = {};
    if (req.user.role === 'admin') {
      if (req.query.facultyId) q.faculty = req.query.facultyId;
    } else if (isFaculty(req.user)) {
      q.faculty = req.user._id;
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const list = await AttendanceSession.find(q).sort({ startsAt: -1 }).limit(200).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSessionQr = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (String(session.faculty) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const b = timeBucket();
    const token = tokenForSession(String(session._id), session.qrSecret, b);
    const validUntil = (b + 1) * WINDOW_MS;
    const json = qrPayload(session._id, token, validUntil);
    const dataUrl = await QRCode.toDataURL(json, { width: 280, margin: 2 });
    res.json({
      success: true,
      dataUrl,
      payload: JSON.parse(json),
      validUntil,
      geoHint: session.geoCenter,
      radiusMeters: session.geoRadiusMeters,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Students mark attendance' });
    }
    const { sessionId, token, lat, lng, deviceFingerprint, college, branch, section } = req.body;
    if (!sessionId || !token || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'sessionId, token, lat, lng required' });
    }
    if (!college || !branch || !section) {
      return res.status(400).json({ success: false, message: 'college, branch, and section required' });
    }
    if (!isValidCohort(college, branch, section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid college, branch, or section combination',
      });
    }
    const session = await AttendanceSession.findById(sessionId);
    if (!session || !session.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid session' });
    }

    const now = new Date();
    const timeOk = now >= session.startsAt && now <= session.endsAt;
    const dist = distanceMeters(Number(lat), Number(lng), session.geoCenter.lat, session.geoCenter.lng);
    const geofenceOk = dist <= session.geoRadiusMeters;
    const qr = verifyToken(String(session._id), session.qrSecret, String(token));
    const qrOk = qr.ok;

    let proxyRisk = 'none';
    const fp = (deviceFingerprint || '').slice(0, 128);
    if (fp) {
      const u = await User.findById(req.user._id);
      const known = u.knownDevices || [];
      if (known.length >= 2 && !known.includes(fp)) proxyRisk = 'low';
      if (!known.includes(fp)) {
        known.push(fp);
        while (known.length > 5) known.shift();
        u.knownDevices = known;
        await u.save();
      }
    }

    if (!timeOk || !geofenceOk || !qrOk) {
      return res.status(400).json({
        success: false,
        message: 'Attendance rejected',
        checks: { timeOk, geofenceOk, qrOk, distanceMeters: Math.round(dist) },
      });
    }

    const existing = await AttendanceRecord.findOne({ session: session._id, user: req.user._id });
    if (existing) {
      return res.json({ success: true, message: 'Already marked', data: existing });
    }

    const record = await AttendanceRecord.create({
      session: session._id,
      user: req.user._id,
      courseCode: session.courseCode,
      location: { lat: Number(lat), lng: Number(lng) },
      deviceFingerprint: fp,
      qrWindow: qr.bucket,
      checks: { geofenceOk, timeOk, qrOk },
      proxyRisk,
      college,
      branch,
      section: String(section).trim(),
    });

    await notifyUser(req.user._id, {
      title: 'Attendance recorded',
      body: `${session.courseCode} — ${session.title || 'Session'}`,
      type: 'attendance',
      meta: { sessionId: String(session._id) },
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already marked for this session' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.myAttendance = async (req, res) => {
  try {
    const list = await AttendanceRecord.find({ user: req.user._id })
      .populate('session', 'title courseCode startsAt endsAt')
      .sort({ markedAt: -1 })
      .limit(500)
      .lean();
    const byCourse = {};
    list.forEach((r) => {
      const c = r.courseCode;
      if (!byCourse[c]) byCourse[c] = { attended: 0 };
      byCourse[c].attended += 1;
    });
    res.json({ success: true, data: list, summaryByCourse: byCourse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sessionAnalytics = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    if (String(session.faculty) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const records = await AttendanceRecord.find({ session: session._id })
      .populate('user', 'name email studentRoll')
      .lean();
    res.json({
      success: true,
      session,
      count: records.length,
      records,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deactivateSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    if (String(session.faculty) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    session.isActive = false;
    await session.save();
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
