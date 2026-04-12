const AppNotification = require('../models/AppNotification');
const { getIo } = require('../utils/io');

async function notifyUser(userId, { title, body, type = 'info', meta = {} }) {
  const doc = await AppNotification.create({
    user: userId,
    title,
    body,
    type,
    meta,
  });
  const io = getIo();
  if (io) {
    io.to(`user:${userId}`).emit('campus_notification', {
      id: doc._id,
      title: doc.title,
      body: doc.body,
      type: doc.type,
      createdAt: doc.createdAt,
    });
  }
  return doc;
}

module.exports = { notifyUser };
