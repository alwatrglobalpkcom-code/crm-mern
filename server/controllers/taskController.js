const Task = require('../models/Task');
const TaskService = require('../services/TaskService');
const ActivityLogService = require('../services/ActivityLogService');

exports.getAll = async (req, res) => {
  try {
    const clientId = req.query.clientId;
    const tasks = await TaskService.getForUser(req.user, clientId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const task = await TaskService.getById(req.params.id, req.user);
    res.json(task);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const task = await TaskService.create(req.body, req.user);
    const label = task.taskType + (task.client?.clientName || task.client?.companyName ? ` (${task.client.clientName || task.client.companyName})` : '');
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'create', entity: 'task', entityId: task._id, entityLabel: label });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const task = await TaskService.update(req.params.id, req.body, req.user);
    const label = task.taskType + (task.client?.clientName || task.client?.companyName ? ` (${task.client.clientName || task.client.companyName})` : '');
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'update', entity: 'task', entityId: task._id, entityLabel: label });
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUpcomingDeadlines = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const tasks = await TaskService.getUpcomingDeadlines(req.user, days);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingForApproval = async (req, res) => {
  try {
    const tasks = await TaskService.getPendingForApproval(req.user);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Manager or Admin only.' });
    }
    const task = await TaskService.approve(req.params.id, req.user);
    const label = task.taskType + (task.client?.clientName || task.client?.companyName ? ` (${task.client.clientName || task.client.companyName})` : '');
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'update', entity: 'task', entityId: task._id, entityLabel: label });
    res.json(task);
  } catch (error) {
    const status = error.message === 'Access denied.' || error.message.includes('approve') ? 403 : 400;
    res.status(status).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const target = await Task.findById(req.params.id).populate('client', 'clientName companyName').select('taskType').lean();
    await TaskService.delete(req.params.id, req.user);
    const label = target ? target.taskType + (target.client?.clientName || target.client?.companyName ? ` (${target.client.clientName || target.client.companyName})` : '') : null;
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'delete', entity: 'task', entityId: req.params.id, entityLabel: label });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
