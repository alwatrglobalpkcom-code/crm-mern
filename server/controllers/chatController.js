const Message = require('../models/Message');
const User = require('../models/User');

const toId = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val._id) return String(val._id);
  return String(val);
};

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

exports.getConversations = async (req, res) => {
  try {
    const user = req.user;
    let participants = [];

    if (user.role === 'manager') {
      const agentIds = (user.assignedAgents || []).map(a => toId(a)).filter(Boolean);
      if (agentIds.length > 0) {
        participants = await User.find({ _id: { $in: agentIds } })
          .select('name email')
          .sort({ name: 1 });
      }
    } else if (user.role === 'agent') {
      const managerId = toId(user.assignedManager);
      if (managerId) {
        const manager = await User.findById(managerId).select('name email');
        if (manager) participants = [manager];
      }
    }

    const lastMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: user._id },
            { receiver: user._id }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', user._id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const unreadCounts = await Message.aggregate([
      { $match: { receiver: user._id, readAt: null } },
      { $group: { _id: '$sender', count: { $sum: 1 } } }
    ]);
    const unreadMap = Object.fromEntries(unreadCounts.map(u => [u._id.toString(), u.count]));

    const participantsWithLast = participants.map(p => {
      const pid = p._id.toString();
      const last = lastMessages.find(m => m._id.toString() === pid);
      return {
        ...p.toObject(),
        lastMessage: last?.lastMessage?.text,
        lastAt: last?.lastMessage?.createdAt,
        unreadCount: unreadMap[pid] || 0
      };
    });

    participantsWithLast.sort((a, b) => {
      const aTime = a.lastAt ? new Date(a.lastAt) : 0;
      const bTime = b.lastAt ? new Date(b.lastAt) : 0;
      return bTime - aTime;
    });

    res.json(participantsWithLast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    if (!canChatWith(currentUser, userId)) {
      return res.status(403).json({ message: 'Access denied. You cannot chat with this user.' });
    }

    await Message.updateMany(
      { sender: userId, receiver: currentUser._id, readAt: null },
      { $set: { readAt: new Date() } }
    );

    const messages = await Message.find({
      $or: [
        { sender: currentUser._id, receiver: userId },
        { sender: userId, receiver: currentUser._id }
      ]
    })
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body;
    const sender = req.user;

    if (!receiver || !text?.trim()) {
      return res.status(400).json({ message: 'Receiver and text are required.' });
    }

    if (!canChatWith(sender, receiver)) {
      return res.status(403).json({ message: 'Access denied. You cannot chat with this user.' });
    }

    const message = new Message({
      sender: sender._id,
      receiver,
      text: text.trim()
    });
    await message.save();
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    const chatSocket = req.app.get('chatSocket');
    if (chatSocket?.emitNewMessage) {
      chatSocket.emitNewMessage(message, receiver);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
