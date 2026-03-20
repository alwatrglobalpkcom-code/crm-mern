const User = require('../models/User');
const UserService = require('../services/UserService');
const ActivityLogService = require('../services/ActivityLogService');

exports.getTeam = async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const users = await UserService.getTeamForManager(req.user._id);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAgents = async (req, res) => {
  try {
    let query = { role: 'agent' };
    if (req.user.role === 'manager') {
      query._id = { $in: req.user.assignedAgents || [] };
    } else if (req.user.role === 'agent') {
      query._id = req.user._id;
    }
    const agents = await User.find(query).select('name email').sort({ name: 1 });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const users = await UserService.getAll(req.query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await UserService.getById(req.params.id, req.user);
    res.json(user);
  } catch (error) {
    const status = error.message === 'Access denied.' ? 403 : 404;
    res.status(status).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const user = await UserService.create(req.body, req.user);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'create', entity: 'user', entityId: user._id, entityLabel: user.name });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const user = await UserService.update(req.params.id, req.body, req.user);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'update', entity: 'user', entityId: user._id, entityLabel: user.name });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    await UserService.removeAgentFromManager(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUnassignedAgents = async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const agents = await UserService.getUnassignedAgents();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addAgentToTeam = async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ message: 'agentId is required.' });
    const user = await UserService.addAgentToTeam(agentId, req.user._id);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const target = await User.findById(req.params.id).select('name').lean();
    await UserService.delete(req.params.id);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'delete', entity: 'user', entityId: req.params.id, entityLabel: target?.name });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
