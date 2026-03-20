const Task = require('../models/Task');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailService = require('./EmailService');
const { ValidationError, required, isObjectId, isValidDate } = require('../utils/validate');

const toId = (v) => (v?._id ?? v)?.toString?.() || '';

class TaskService {
  static async getForUser(user, clientId) {
    let query = {};

    if (user.role === 'admin') {
      // Admin sees all
    } else if (user.role === 'manager') {
      query.$or = [
        { createdBy: user._id },
        { assignedAgent: { $in: user.assignedAgents || [] } }
      ];
    } else if (user.role === 'agent') {
      query.assignedAgent = user._id;
    }

    if (clientId) query.client = clientId;

    return Task.find(query)
      .populate('client', 'clientName companyName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 })
      .lean();
  }

  static async getById(id, user) {
    const task = await Task.findById(id)
      .populate('client', 'clientName companyName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name email');
    if (!task) throw new Error('Task not found.');

    const uid = toId(user._id);
    const taskAgentId = toId(task.assignedAgent);
    const canAccess = user.role === 'admin' ||
      taskAgentId === uid ||
      toId(task.createdBy) === uid ||
      (user.assignedAgents || []).some(a => toId(a) === taskAgentId);

    if (!canAccess) throw new Error('Access denied.');
    return task;
  }

  static async create(data, user) {
    required(data.client, 'Client');
    isObjectId(data.client, 'Client');
    required(data.taskType, 'Task type');
    const validTypes = ['BAS', 'GST', 'Tax Return', 'Payroll'];
    if (!validTypes.includes(data.taskType)) {
      throw new ValidationError('Invalid task type. Must be BAS, GST, Tax Return, or Payroll.');
    }
    required(data.dueDate, 'Due date');
    isValidDate(data.dueDate, 'Due date');
    required(data.assignedAgent, 'Assigned agent');
    isObjectId(data.assignedAgent, 'Assigned agent');

    const client = await Client.findById(data.client);
    if (!client) throw new Error('Client not found.');
    if (client.status !== 'active') throw new Error('Client must be approved before creating tasks.');

    const canCreate = user.role === 'admin' ||
      user.role === 'manager' ||
      (user.role === 'agent' && (client.assignedAgent?.toString() === user._id.toString() || client.createdBy?.toString() === user._id.toString()));

    if (!canCreate) throw new Error('Access denied.');

    const needsApproval = user.role === 'agent';
    const taskData = {
      ...data,
      createdBy: user._id,
      approvalStatus: needsApproval ? 'pending_approval' : 'approved',
      approvedBy: needsApproval ? null : user._id
    };

    const task = await Task.create(taskData);

    const cName = client.clientName || client.companyName || 'Client';
    if (needsApproval) {
      const agent = await User.findById(user._id).populate('assignedManager', 'email name');
      if (agent?.assignedManager) {
        await Notification.create({
          user: agent.assignedManager._id,
          message: `Task needs approval: ${data.taskType} for ${cName} by Agent ${user.name}`,
          type: 'task_approval',
          relatedId: task._id,
          relatedModel: 'Task'
        });
        if (agent.assignedManager.email) {
          await EmailService.sendTaskNeedsApproval(agent.assignedManager.email, agent.assignedManager.name, data.taskType, cName, user.name);
        }
      }
      const admins = await User.find({ role: 'admin' }).select('email name');
      for (const a of admins) {
        if (a?.email) await EmailService.sendTaskNeedsApproval(a.email, a.name, data.taskType, cName, user.name);
      }
    } else {
      await Notification.create({
        user: task.assignedAgent,
        message: `New task assigned: ${data.taskType} for ${cName}`,
        type: 'task_assigned',
        relatedId: task._id,
        relatedModel: 'Task'
      });
      const agentUser = await User.findById(task.assignedAgent).select('email name');
      if (agentUser?.email) await EmailService.sendTaskAssigned(agentUser.email, agentUser.name, data.taskType, cName);
    }

    return Task.findById(task._id)
      .populate('client', 'clientName companyName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name email');
  }

  static async update(id, data, user) {
    if (data.dueDate !== undefined) isValidDate(data.dueDate, 'Due date');
    if (data.status !== undefined) {
      const validStatuses = ['Pending', 'In Progress', 'Completed'];
      if (!validStatuses.includes(data.status)) {
        throw new ValidationError('Invalid status. Must be Pending, In Progress, or Completed.');
      }
    }

    const task = await Task.findById(id);
    if (!task) throw new Error('Task not found.');

    const uid = toId(user._id);
    const taskAgentId = toId(task.assignedAgent);
    const canUpdate = user.role === 'admin' ||
      taskAgentId === uid ||
      toId(task.createdBy) === uid ||
      (user.assignedAgents || []).some(a => toId(a) === taskAgentId);

    if (!canUpdate) throw new Error('Access denied.');

    Object.assign(task, data);
    await task.save();
    return Task.findById(task._id)
      .populate('client', 'clientName companyName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name email');
  }

  static async approve(id, user) {
    if (user.role !== 'manager' && user.role !== 'admin') throw new Error('Only managers can approve tasks.');

    const task = await Task.findById(id).populate('client assignedAgent createdBy');
    if (!task) throw new Error('Task not found.');
    if (task.approvalStatus === 'approved') throw new Error('Task already approved.');

    const agent = await User.findById(task.assignedAgent);
    const isManagerOfAgent = agent?.assignedManager?.toString() === user._id.toString();
    if (user.role === 'manager' && !isManagerOfAgent) {
      throw new Error('You can only approve tasks from your agents.');
    }

    task.approvalStatus = 'approved';
    task.approvedBy = user._id;
    await task.save();

    await Notification.create({
      user: task.assignedAgent,
      message: `Task approved: ${task.taskType} for ${task.client?.clientName || task.client?.companyName}`,
      type: 'task_assigned',
      relatedId: task._id,
      relatedModel: 'Task'
    });

    const cName = task.client?.clientName || task.client?.companyName || 'Client';
    const sent = new Set();
    const sendTo = async (email, name) => {
      if (email && !sent.has(email)) {
        sent.add(email);
        await EmailService.sendTaskApproval(email, name, task.taskType, cName);
      }
    };

    const agentUser = await User.findById(task.assignedAgent).select('email name');
    if (agentUser?.email) await sendTo(agentUser.email, agentUser.name);

    const agentWithManager = await User.findById(task.assignedAgent).populate('assignedManager', 'email name');
    if (agentWithManager?.assignedManager?.email) {
      await sendTo(agentWithManager.assignedManager.email, agentWithManager.assignedManager.name);
    }

    const admins = await User.find({ role: 'admin' }).select('email name');
    for (const a of admins) {
      if (a?.email) await sendTo(a.email, a.name);
    }

    return Task.findById(task._id)
      .populate('client', 'clientName companyName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name email');
  }

  static async getPendingForApproval(user) {
    if (user.role !== 'manager' && user.role !== 'admin') return [];
    const query = { approvalStatus: 'pending_approval' };
    if (user.role === 'manager') {
      const agentIds = user.assignedAgents || [];
      query.assignedAgent = { $in: agentIds };
    }
    return Task.find(query)
      .populate('client', 'clientName companyName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  }

  static async delete(id, user) {
    const task = await Task.findById(id);
    if (!task) throw new Error('Task not found.');

    const uid = toId(user._id);
    const taskAgentId = toId(task.assignedAgent);
    const canDelete = user.role === 'admin' ||
      toId(task.createdBy) === uid ||
      (user.assignedAgents || []).some(a => toId(a) === taskAgentId);

    if (!canDelete) throw new Error('Access denied.');

    await task.deleteOne();
    return { success: true };
  }

  static async getUpcomingDeadlines(user, days = 7) {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    let query = {
      dueDate: { $gte: start, $lte: end },
      status: { $ne: 'Completed' },
      approvalStatus: 'approved'
    };

    if (user.role === 'agent') {
      query.assignedAgent = user._id;
    } else if (user.role === 'manager') {
      query.assignedAgent = { $in: user.assignedAgents || [] };
    }

    return Task.find(query)
      .populate('client', 'clientName companyName')
      .populate('assignedAgent', 'name email')
      .sort({ dueDate: 1 });
  }
}

module.exports = TaskService;
