const Client = require('../models/Client');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailService = require('./EmailService');
const { required, isValidEmail, isValidPhone } = require('../utils/validate');

const toId = (v) => (v?._id ?? v)?.toString?.() || '';

class ClientService {
  static async getForUser(user) {
    let query = {};
    if (user.role === 'admin') {
      query = {};
    } else if (user.role === 'manager') {
      query.$or = [
        { assignedManager: user._id },
        { createdBy: user._id }
      ];
    } else if (user.role === 'agent') {
      query.$or = [
        { assignedAgent: user._id },
        { createdBy: user._id }
      ];
    }

    const clients = await Client.find(query)
      .populate('assignedAgent', 'name email')
      .populate('assignedManager', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    return clients;
  }

  static async getById(id, user) {
    const client = await Client.findById(id)
      .populate('assignedAgent', 'name email')
      .populate('assignedManager', 'name email')
      .populate('createdBy', 'name email');
    if (!client) throw new Error('Client not found.');

    const uid = toId(user._id);
    const canAccess = user.role === 'admin' ||
      toId(client.assignedManager) === uid ||
      toId(client.assignedAgent) === uid ||
      toId(client.createdBy) === uid;

    if (!canAccess) throw new Error('Access denied.');
    return client;
  }

  static async create(data, user) {
    required(data.clientName, 'Client name');
    if (data.email) isValidEmail(data.email);
    if (data.phone) isValidPhone(data.phone);

    const clientData = {
      ...data,
      createdBy: user._id
    };

    if (user.role === 'agent') {
      clientData.assignedAgent = user._id;
      clientData.status = 'pending_approval';
      const agent = await User.findById(user._id).populate('assignedManager');
      if (agent?.assignedManager) {
        clientData.assignedManager = agent.assignedManager._id;
      }
    } else if (user.role === 'manager') {
      clientData.assignedManager = user._id;
      if (data.assignedAgent) clientData.assignedAgent = data.assignedAgent;
    }

    const client = await Client.create(clientData);

    if (user.role === 'agent') {
      const agent = await User.findById(user._id).populate('assignedManager', 'email name');
      const cName = client.companyName || client.clientName || 'Client';
      if (agent?.assignedManager) {
        await Notification.create({
          user: agent.assignedManager._id,
          message: `New client added by Agent ${user.name}: ${cName}. Manager approval required.`,
          type: 'client_approval',
          relatedId: client._id,
          relatedModel: 'Client'
        });
        if (agent.assignedManager.email) {
          await EmailService.sendClientNeedsApproval(agent.assignedManager.email, agent.assignedManager.name, cName, user.name);
        }
      }
      const admins = await User.find({ role: 'admin' }).select('email name');
      for (const a of admins) {
        if (a?.email) await EmailService.sendClientNeedsApproval(a.email, a.name, cName, user.name);
      }
    }

    return Client.findById(client._id)
      .populate('assignedAgent', 'name email')
      .populate('assignedManager', 'name email')
      .populate('createdBy', 'name email');
  }

  static async update(id, data, user) {
    if (data.clientName !== undefined) required(data.clientName, 'Client name');
    if (data.email) isValidEmail(data.email);
    if (data.phone) isValidPhone(data.phone);

    const client = await Client.findById(id);
    if (!client) throw new Error('Client not found.');

    const uid = toId(user._id);
    const canEdit = user.role === 'admin' ||
      toId(client.assignedManager) === uid ||
      toId(client.assignedAgent) === uid ||
      toId(client.createdBy) === uid;

    if (!canEdit) throw new Error('Access denied.');

    Object.assign(client, data);
    await client.save();
    return Client.findById(client._id)
      .populate('assignedAgent', 'name email')
      .populate('assignedManager', 'name email')
      .populate('createdBy', 'name email');
  }

  static async delete(id, user) {
    const client = await Client.findById(id);
    if (!client) throw new Error('Client not found.');

    const uid = toId(user._id);
    const canDelete = user.role === 'admin' ||
      toId(client.assignedManager) === uid;

    if (!canDelete) throw new Error('Access denied. Only Admin or Manager can delete clients.');

    await client.deleteOne();
    return { success: true };
  }

  static async approve(id, user) {
    if (user.role !== 'manager' && user.role !== 'admin') throw new Error('Only managers can approve clients.');

    const client = await Client.findById(id);
    if (!client) throw new Error('Client not found.');
    if (user.role === 'manager' && toId(client.assignedManager) !== toId(user._id)) {
      throw new Error('You can only approve clients under your management.');
    }

    client.status = 'active';
    client.approvedBy = user._id;
    await client.save();

    const cName = client.clientName || client.companyName || 'Client';
    const agentId = client.assignedAgent || client.createdBy;
    if (agentId) {
      await Notification.create({
        user: agentId,
        message: `Client approved: ${cName}. You can now add tasks.`,
        type: 'client_approval',
        relatedId: client._id,
        relatedModel: 'Client'
      });
    }
    const sent = new Set();
    const sendTo = async (email, name) => {
      if (email && !sent.has(email)) {
        sent.add(email);
        await EmailService.sendClientApproval(email, name, cName);
      }
    };

    if (agentId) {
      const agentUser = await User.findById(agentId).select('email name');
      if (agentUser?.email) await sendTo(agentUser.email, agentUser.name);
    }

    const clientPop = await Client.findById(client._id).populate('assignedManager', 'email name');
    if (clientPop?.assignedManager?.email) {
      await sendTo(clientPop.assignedManager.email, clientPop.assignedManager.name);
    }

    const admins = await User.find({ role: 'admin' }).select('email name');
    for (const a of admins) {
      if (a?.email) await sendTo(a.email, a.name);
    }

    return Client.findById(client._id)
      .populate('assignedAgent', 'name email')
      .populate('assignedManager', 'name email');
  }

  static async getPendingForApproval(user) {
    if (user.role !== 'manager' && user.role !== 'admin') return [];
    const query = { status: 'pending_approval' };
    if (user.role === 'manager') query.assignedManager = user._id;
    return Client.find(query)
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  }
}

module.exports = ClientService;
