const NotificationService = require('../services/NotificationService');

exports.getAll = async (req, res) => {
  try {
    const notifications = await NotificationService.getForUser(req.user._id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notif = await NotificationService.markAsRead(req.params.id, req.user._id);
    res.json(notif);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user._id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
