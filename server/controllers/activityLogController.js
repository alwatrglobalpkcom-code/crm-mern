const ActivityLog = require('../models/ActivityLog');

exports.getAll = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const entity = req.query.entity;
    const action = req.query.action;
    const search = (req.query.search || '').trim();

    const query = {};
    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { entityLabel: { $regex: search, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('userId userName action entity entityId entityLabel createdAt')
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
