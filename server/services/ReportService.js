const Client = require('../models/Client');
const Task = require('../models/Task');
const User = require('../models/User');

class ReportService {
  static async getUserStats(user) {
    if (user.role !== 'admin') return null;
    const total = await User.countDocuments();
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    return { totalUsers: total, byRole: Object.fromEntries(byRole.map(r => [r._id, r.count])) };
  }
  static async getClientStats(user) {
    let clientQuery = { status: 'active' };
    if (user.role === 'manager') {
      clientQuery.$or = [
        { assignedManager: user._id },
        { createdBy: user._id }
      ];
    } else if (user.role === 'agent') {
      clientQuery.$or = [
        { assignedAgent: user._id },
        { createdBy: user._id }
      ];
    }

    const total = await Client.countDocuments(clientQuery);
    return { totalClients: total };
  }

  static async getTaskStats(user) {
    let taskQuery = {};
    if (user.role === 'manager') {
      taskQuery.$or = [
        { createdBy: user._id },
        { assignedAgent: { $in: user.assignedAgents || [] } }
      ];
    } else if (user.role === 'agent') {
      taskQuery.assignedAgent = user._id;
      taskQuery.approvalStatus = 'approved';
    }

    const [total, pending, inProgress, completed, overdue, byType] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'Pending' }),
      Task.countDocuments({ ...taskQuery, status: 'In Progress' }),
      Task.countDocuments({ ...taskQuery, status: 'Completed' }),
      Task.countDocuments({
        ...taskQuery,
        status: { $ne: 'Completed' },
        dueDate: { $lt: new Date() }
      }),
      Task.aggregate([
        { $match: taskQuery },
        { $group: { _id: '$taskType', count: { $sum: 1 } } }
      ])
    ]);

    const byTaskType = Object.fromEntries((byType || []).map(r => [r._id, r.count]));
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalTasks: total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate,
      byTaskType
    };
  }

  static async getUserPerformanceStats(user) {
    let agentIds = [];
    if (user.role === 'admin') {
      const agents = await User.find({ role: 'agent' }).select('_id name').lean();
      agentIds = agents.map(a => a._id);
    } else if (user.role === 'manager') {
      agentIds = user.assignedAgents || [];
    } else {
      return [];
    }

    if (agentIds.length === 0) return [];

    const stats = await Task.aggregate([
      { $match: { assignedAgent: { $in: agentIds } } },
      {
        $group: {
          _id: '$assignedAgent',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', total: 1, completed: 1, pending: 1, inProgress: 1 } },
      { $sort: { completed: -1, total: -1 } }
    ]);

    return stats.map(s => ({
      name: s.name,
      total: s.total,
      completed: s.completed,
      pending: s.pending,
      inProgress: s.inProgress,
      completionRate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
    }));
  }

  static async getRevenue(user) {
    let taskQuery = {};
    if (user.role === 'manager') {
      taskQuery.$or = [
        { createdBy: user._id },
        { assignedAgent: { $in: user.assignedAgents || [] } }
      ];
    } else if (user.role === 'agent') {
      taskQuery.assignedAgent = user._id;
      taskQuery.approvalStatus = 'approved';
    }

    const result = await Task.aggregate([
      { $match: taskQuery },
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const total = result[0]?.total ?? 0;
    return {
      total: Number(total),
      currency: 'AUD',
      label: total > 0 ? 'Total revenue from completed tasks' : 'Add amount to completed tasks to track revenue'
    };
  }
}

module.exports = ReportService;
