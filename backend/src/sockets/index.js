const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const Event = require('../models/Event');
const { setIo } = require('../utils/io');

/**
 * Real-time chat per event + live viewer counts for "crowd" tracking.
 * Client joins room `event:<eventId>` after JWT auth in handshake.
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  setIo(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        socket.user = null;
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('join_event', async ({ eventId, userName }) => {
      if (!eventId) return;
      const room = `event:${eventId}`;
      socket.join(room);

      if (socket.userId && !socket.data.crowdCounted) {
        await Event.findByIdAndUpdate(eventId, { $inc: { liveViewers: 1 } });
        io.to(room).emit('crowd_update', { eventId, delta: 1 });
        socket.data.crowdCounted = true;
      }

      socket.data.eventRoom = room;
      socket.data.eventId = eventId;
      socket.data.userName = userName || 'Anonymous';

      const history = await ChatMessage.find({ event: eventId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('user', 'name')
        .lean();
      socket.emit('chat_history', history.reverse());
    });

    socket.on('leave_event', async ({ eventId }) => {
      const eid = eventId || socket.data.eventId;
      if (!eid) return;
      socket.leave(`event:${eid}`);
      if (socket.userId && socket.data.crowdCounted) {
        await Event.findByIdAndUpdate(eid, { $inc: { liveViewers: -1 } });
        io.to(`event:${eid}`).emit('crowd_update', { eventId: eid, delta: -1 });
        socket.data.crowdCounted = false;
      }
    });

    socket.on('chat_message', async ({ eventId, message }) => {
      if (!socket.userId || !eventId || !message?.trim()) return;
      const doc = await ChatMessage.create({
        event: eventId,
        user: socket.userId,
        userName: socket.data.userName,
        message: message.trim().slice(0, 2000),
      });
      const populated = await ChatMessage.findById(doc._id).populate('user', 'name').lean();
      io.to(`event:${eventId}`).emit('chat_message', populated);
    });

    socket.on('disconnect', async () => {
      const eid = socket.data.eventId;
      if (socket.userId && eid && socket.data.crowdCounted) {
        await Event.findByIdAndUpdate(eid, { $inc: { liveViewers: -1 } });
        io.to(`event:${eid}`).emit('crowd_update', { eventId: eid, delta: -1 });
        socket.data.crowdCounted = false;
      }
    });
  });

  return io;
}

module.exports = { initSocket };
