const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const { getJwtSecret } = require('../config/env');

const toId = (v) => (v?._id ?? v)?.toString?.() || '';

const canChatWith = (currentUser, targetId) => {
  const tid = toId(targetId);
  const uid = toId(currentUser?._id);
  if (!tid || !uid) return false;
  if (currentUser.role === 'manager') {
    const agentIds = (currentUser.assignedAgents || []).map(a => toId(a));
    return agentIds.includes(tid);
  }
  if (currentUser.role === 'agent') {
    const managerId = toId(currentUser.assignedManager);
    return managerId === tid;
  }
  return false;
};

function setupChatSocket(io) {
  const onlineUsers = new Map();

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = toId(socket.user._id);
    const room = `user-${userId}`;
    socket.join(room);
    onlineUsers.set(userId, { socketId: socket.id, user: socket.user });
    socket.emit('online_list', { userIds: Array.from(onlineUsers.keys()) });
    io.emit('user_online', { userId, name: socket.user.name });

    socket.on('typing', ({ receiverId }) => {
      if (!canChatWith(socket.user, receiverId)) return;
      io.to(`user-${toId(receiverId)}`).emit('typing', { userId, name: socket.user.name });
    });

    socket.on('typing_stop', ({ receiverId }) => {
      if (!canChatWith(socket.user, receiverId)) return;
      io.to(`user-${toId(receiverId)}`).emit('typing_stop', { userId });
    });

    socket.on('message_seen', async ({ messageId, senderId }) => {
      const senderIdStr = toId(senderId);
      if (!canChatWith(socket.user, senderIdStr)) return;
      const msg = await Message.findOneAndUpdate(
        { _id: messageId, receiver: socket.user._id, sender: senderId },
        { $set: { readAt: new Date() } },
        { new: true }
      );
      if (msg) {
        io.to(`user-${senderIdStr}`).emit('message_read', { messageId, readBy: userId });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_offline', { userId });
    });
  });

  return {
    emitNewMessage: (message, receiverId) => {
      io.to(`user-${toId(receiverId)}`).emit('new_message', message);
    },
    getOnlineUsers: () => Array.from(onlineUsers.keys()),
    getIO: () => io
  };
}

module.exports = { setupChatSocket };
