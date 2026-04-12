const Note = require('../models/Note');
const { uploadBuffer } = require('../utils/uploadImage');
const BehaviorEvent = require('../models/BehaviorEvent');

exports.listNotes = async (req, res) => {
  try {
    const { courseTag, q } = req.query;
    const filter = {};
    if (courseTag) filter.courseTag = new RegExp(courseTag, 'i');
    if (q && String(q).trim()) {
      filter.$text = { $search: String(q).trim() };
    }
    const data = await Note.find(filter)
      .populate('author', 'name department')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    if (req.user.role !== 'student' && req.user.role !== 'faculty' && req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { title, description, courseTag } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title required' });

    let fileUrl = '';
    let filePublicId = '';
    if (req.file?.buffer) {
      const up = await uploadBuffer(req.file.buffer, 'smart_campus_notes');
      fileUrl = up.url;
      filePublicId = up.publicId;
    }

    const note = await Note.create({
      author: req.user._id,
      title,
      description: description || '',
      courseTag: courseTag || '',
      fileUrl,
      filePublicId,
    });
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('author', 'name email department').lean();
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user) {
      await BehaviorEvent.create({
        user: req.user._id,
        kind: 'view_note',
        refId: note._id,
      }).catch(() => {});
    }
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.trackDownload = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
    if (!note) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { fileUrl: note.fileUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
