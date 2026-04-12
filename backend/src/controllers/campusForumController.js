const ForumThread = require('../models/ForumThread');
const ForumComment = require('../models/ForumComment');
const BehaviorEvent = require('../models/BehaviorEvent');

exports.listThreads = async (req, res) => {
  try {
    const { flair } = req.query;
    const q = {};
    if (flair) q.flair = flair;
    const data = await ForumThread.find(q)
      .populate('author', 'name department')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(80)
      .lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createThread = async (req, res) => {
  try {
    const { title, body, flair } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: 'title and body required' });
    const thread = await ForumThread.create({
      author: req.user._id,
      title,
      body,
      flair: flair || 'general',
    });
    res.status(201).json({ success: true, data: thread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getThread = async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id).populate('author', 'name email').lean();
    if (!thread) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user?._id) {
      await BehaviorEvent.create({
        user: req.user._id,
        kind: 'forum_view',
        refId: thread._id,
      }).catch(() => {});
    }
    const comments = await ForumComment.find({ thread: thread._id })
      .populate('author', 'name')
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, data: { thread, comments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { body, parentId } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'body required' });
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    const comment = await ForumComment.create({
      thread: thread._id,
      author: req.user._id,
      body: body.trim().slice(0, 8000),
      parent: parentId || null,
    });
    thread.commentCount = (thread.commentCount || 0) + 1;
    await thread.save();
    const populated = await ForumComment.findById(comment._id).populate('author', 'name').lean();
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.upvoteThread = async (req, res) => {
  try {
    const thread = await ForumThread.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true });
    if (!thread) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: thread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
