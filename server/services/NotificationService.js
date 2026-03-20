const Notification = require('../models/Notification');

class NotificationService {
  static async getForUser(userId) {
    return Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  static async markAsRead(id, userId) {
    const notif = await Notification.findOne({ _id: id, user: userId });
    if (!notif) throw new Error('Notification not found.');
    notif.read = true;
    await notif.save();
    return notif;
  }

  static async markAllAsRead(userId) {
    await Notification.updateMany({ user: userId }, { read: true });
    return { success: true };
  }
}

module.exports = NotificationService;
