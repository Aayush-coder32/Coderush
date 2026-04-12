const Notice = require('../models/Notice');
const { notifyUser } = require('../services/notifyUser');
const User = require('../models/User');

function canPublish(user) {
  return user.role === 'admin' || user.role === 'faculty' || user.role === 'organizer';
}

exports.create = async (req, res) => {
  try {
    if (!canPublish(req.user)) return res.status(403).json({ success: false, message: 'Forbidden' });
    const { title, body, priority, audience, expiresAt } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: 'title and body required' });
    const notice = await Notice.create({
      title,
      body,
      priority: priority || 'normal',
      audience: audience || 'all',
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    const roleFilter =
      notice.audience === 'students'
        ? { role: 'student' }
        : notice.audience === 'faculty'
          ? { $or: [{ role: 'faculty' }, { role: 'organizer' }] }
          : {};
    const targets = await User.find(roleFilter).select('_id').limit(500).lean();
    await Promise.all(
      targets.map((u) =>
        notifyUser(u._id, {
          title: `Notice: ${notice.title}`,
          body: notice.body.slice(0, 200),
          type: 'notice',
          meta: { noticeId: String(notice._id) },
        }).catch(() => {})
      )
    );

    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const now = new Date();
    const q = {
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    };
    const data = await Notice.find(q).sort({ createdAt: -1 }).limit(50).lean();

    const role = req.user?.role;
    const filtered = data.filter((n) => {
      if (n.audience === 'all') return true;
      if (n.audience === 'students') return role === 'student';
      if (n.audience === 'faculty') return role === 'faculty' || role === 'organizer' || role === 'admin';
      return true;
    });

    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
