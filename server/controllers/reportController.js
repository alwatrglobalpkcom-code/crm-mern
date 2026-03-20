const ReportService = require('../services/ReportService');

exports.getClientStats = async (req, res) => {
  try {
    const stats = await ReportService.getClientStats(req.user);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    const stats = await ReportService.getTaskStats(req.user);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const stats = await ReportService.getUserStats(req.user);
    res.json(stats || { totalUsers: 0, byRole: {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserPerformance = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const stats = await ReportService.getUserPerformanceStats(req.user);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const data = await ReportService.getRevenue(req.user);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
