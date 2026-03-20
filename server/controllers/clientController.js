const Client = require('../models/Client');
const ClientService = require('../services/ClientService');
const ActivityLogService = require('../services/ActivityLogService');

exports.getAll = async (req, res) => {
  try {
    const clients = await ClientService.getForUser(req.user);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingForApproval = async (req, res) => {
  try {
    const clients = await ClientService.getPendingForApproval(req.user);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const client = await ClientService.getById(req.params.id, req.user);
    res.json(client);
  } catch (error) {
    const status = error.message === 'Access denied.' ? 403 : 404;
    res.status(status).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const client = await ClientService.create(req.body, req.user);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'create', entity: 'client', entityId: client._id, entityLabel: client.clientName || client.companyName });
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const client = await ClientService.update(req.params.id, req.body, req.user);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'update', entity: 'client', entityId: client._id, entityLabel: client.clientName || client.companyName });
    res.json(client);
  } catch (error) {
    const status = error.message === 'Access denied.' ? 403 : 400;
    res.status(status).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await ClientService.delete(req.params.id, req.user);
    res.json({ success: true });
  } catch (error) {
    const status = error.message === 'Access denied.' ? 403 : 400;
    res.status(status).json({ message: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Manager or Admin only.' });
    }
    const client = await ClientService.approve(req.params.id, req.user);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'update', entity: 'client', entityId: client._id, entityLabel: client.clientName || client.companyName });
    res.json(client);
  } catch (error) {
    const status = error.message === 'Access denied.' || error.message.includes('approve') ? 403 : 400;
    res.status(status).json({ message: error.message });
  }
};
