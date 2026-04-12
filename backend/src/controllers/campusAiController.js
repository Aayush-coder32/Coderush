const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Note = require('../models/Note');
const CampusResource = require('../models/CampusResource');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const BehaviorEvent = require('../models/BehaviorEvent');
const AppNotification = require('../models/AppNotification');
const { explainRecommendations, campusAssistantChat, narrateBrainFeed } = require('../services/openaiService');
const { notifyUser } = require('../services/notifyUser');

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ success: false, message: 'messages[] required' });
    }
    const safe = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    const { reply, usedOpenAI } = await campusAssistantChat(safe);
    res.json({ success: true, reply, usedOpenAI });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.brainFeed = async (req, res) => {
  try {
    const user = req.user;
    const bookings = await Booking.find({ user: user._id, status: 'confirmed' }).populate('event');
    const categories = new Set();
    bookings.forEach((b) => {
      if (b.event?.category) categories.add(b.event.category);
    });
    const bookedEventIds = bookings.map((b) => b.event?._id).filter(Boolean);
    const filter = {
      isPublished: true,
      date: { $gte: new Date() },
      _id: { $nin: bookedEventIds },
    };
    const catList = [...categories].filter((c) => ['fest', 'workshop', 'seminar', 'competition', 'other'].includes(c));
    if (catList.length) filter.category = { $in: catList };

    let events = await Event.find(filter).sort({ trendingScore: -1 }).limit(5).lean();
    if (!events.length) {
      events = await Event.find({ isPublished: true, date: { $gte: new Date() } })
        .sort({ trendingScore: -1 })
        .limit(5)
        .lean();
    }

    const interestTags = [...(user.interests || []), ...catList];
    const noteFilter =
      interestTags.length > 0
        ? { courseTag: new RegExp(interestTags.join('|'), 'i') }
        : {};
    const notes = await Note.find(noteFilter).sort({ downloads: -1 }).limit(5).populate('author', 'name').lean();

    const recent = await BehaviorEvent.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    const books = await CampusResource.find({ type: 'book', status: 'available' })
      .sort({ availableCopies: -1 })
      .limit(5)
      .lean();

    const titles = events.map((e) => e.title);
    let aiReasons = [];
    try {
      aiReasons = await explainRecommendations(user.name, titles);
    } catch {
      aiReasons = titles.map((t) => ({ title: t, reason: 'Trending on campus.' }));
    }
    const reasonByTitle = Object.fromEntries(aiReasons.map((r) => [r.title, r.reason]));
    const eventsWithReasons = events.map((e) => ({
      ...e,
      recommendationReason: reasonByTitle[e.title] || 'Suggested for you.',
    }));

    const summaryPayload = {
      name: user.name,
      interests: user.interests,
      eventTitles: events.map((e) => e.title),
      noteTitles: notes.map((n) => n.title),
      behaviorKinds: [...new Set(recent.map((r) => r.kind))],
    };
    let narrative = '';
    let usedOpenAI = false;
    try {
      const n = await narrateBrainFeed(summaryPayload);
      narrative = n.narrative;
      usedOpenAI = n.usedOpenAI;
    } catch {
      narrative = 'Here is your AI Campus Brain feed — events, notes, and library picks based on your activity.';
    }

    res.json({
      success: true,
      narrative,
      usedOpenAINarrative: usedOpenAI,
      usedOpenAIEvents: Boolean(process.env.OPENAI_API_KEY),
      events: eventsWithReasons,
      notes,
      books,
      recentBehavior: recent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.attendancePrediction = async (req, res) => {
  try {
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Students only' });
    }
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const courseCodes = await AttendanceRecord.distinct('courseCode', {
      user: req.user._id,
      markedAt: { $gte: since },
    });

    const risks = [];
    for (const courseCode of courseCodes) {
      const held = await AttendanceSession.countDocuments({
        courseCode,
        endsAt: { $gte: since },
      });
      const attended = await AttendanceRecord.countDocuments({
        user: req.user._id,
        courseCode,
        markedAt: { $gte: since },
      });
      const rate = held > 0 ? (attended / held) * 100 : null;
      if (rate == null) continue;
      let level = 'ok';
      if (rate < 75) level = 'critical';
      else if (rate < 85) level = 'warning';
      risks.push({
        courseCode,
        sessionsHeld: held,
        sessionsAttended: attended,
        attendanceRate: Math.round(rate * 10) / 10,
        level,
        message:
          rate < 75
            ? 'You may fall below 75% attendance — prioritize upcoming sessions.'
            : rate < 85
              ? 'Attendance is borderline; avoid missing the next few classes.'
              : 'On track.',
      });
    }

    const critical = risks.filter((r) => r.level === 'critical');
    if (
      critical.length &&
      req.user.role === 'student' &&
      process.env.ENABLE_ATTENDANCE_ALERTS !== 'false'
    ) {
      const sinceN = new Date(Date.now() - 48 * 60 * 60 * 1000);
      for (const c of critical) {
        const already = await AppNotification.findOne({
          user: req.user._id,
          type: 'attendance_risk',
          'meta.courseCode': c.courseCode,
          createdAt: { $gte: sinceN },
        });
        if (!already) {
          await notifyUser(req.user._id, {
            title: 'Attendance alert',
            body: `${c.courseCode}: ~${c.attendanceRate}% — risk of falling below 75%.`,
            type: 'attendance_risk',
            meta: { courseCode: c.courseCode },
          }).catch(() => {});
        }
      }
    }

    res.json({ success: true, data: risks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
