const User = require('../models/User');
const { ValidationError, required, isValidEmail, isValidPhone, minLength } = require('../utils/validate');

class UserService {
  static async getTeamForManager(managerId) {
    const manager = await User.findById(managerId);
    if (!manager || !manager.assignedAgents?.length) return [];
    return User.find({ _id: { $in: manager.assignedAgents } })
      .populate('assignedManager', 'name email')
      .select('-password')
      .sort({ name: 1 });
  }

  static async getAll(filter = {}) {
    let query = {};
    if (filter.role) query.role = filter.role;
    const users = await User.find(query)
      .populate('assignedManager', 'name email')
      .populate('assignedAgents', 'name email')
      .populate('createdBy', 'name email')
      .select('-password')
      .sort({ createdAt: -1 });
    return users;
  }

  static async getById(id, currentUser) {
    const user = await User.findById(id)
      .populate('assignedManager', 'name email')
      .populate('assignedAgents', 'name email')
      .select('-password');
    if (!user) throw new Error('User not found.');
    if (currentUser?.role === 'manager') {
      const isMyAgent = (currentUser.assignedAgents || []).some(a => a.toString() === id);
      if (!isMyAgent) throw new Error('Access denied.');
    }
    return user;
  }

  static async create(data, createdBy) {
    required(data.name, 'Name');
    required(data.email, 'Email');
    isValidEmail(data.email);
    required(data.role, 'Role');
    if (!['admin', 'manager', 'agent'].includes(data.role)) {
      throw new ValidationError('Invalid role. Must be admin, manager, or agent.');
    }
    if (data.role !== 'admin') {
      required(data.password, 'Password');
      minLength(data.password, 6, 'Password');
    }
    if (data.phone) isValidPhone(data.phone);

    const user = new User({
      ...data,
      createdBy
    });
    await user.save();

    if (data.role === 'agent' && data.assignedManager) {
      await User.findByIdAndUpdate(data.assignedManager, {
        $addToSet: { assignedAgents: user._id }
      });
    }

    const saved = await User.findById(user._id)
      .populate('assignedManager', 'name email')
      .select('-password');
    return saved;
  }

  static async update(id, data, currentUser) {
    if (data.name !== undefined) required(data.name, 'Name');
    if (data.email !== undefined) {
      required(data.email, 'Email');
      isValidEmail(data.email);
    }
    if (data.password) minLength(data.password, 6, 'Password');
    if (data.phone !== undefined && data.phone) isValidPhone(data.phone);

    const user = await User.findById(id);
    if (!user) throw new Error('User not found.');

    if (currentUser?.role === 'manager') {
      const isMyAgent = (currentUser.assignedAgents || []).some(a => a.toString() === id);
      if (!isMyAgent) throw new Error('Access denied.');
      const managerAllowed = ['name', 'email'];
      if (data.password) managerAllowed.push('password');
      data = Object.fromEntries(Object.entries(data).filter(([k]) => managerAllowed.includes(k)));
    }

    const allowedUpdates = ['name', 'email', 'role', 'assignedManager'];
    if (data.password) allowedUpdates.push('password');

    Object.keys(data).forEach(key => {
      if (allowedUpdates.includes(key)) user[key] = data[key];
    });

    await user.save();

    if (data.assignedManager !== undefined && currentUser?.role === 'admin') {
      await User.updateMany(
        { assignedAgents: user._id },
        { $pull: { assignedAgents: user._id } }
      );
      if (data.assignedManager) {
        await User.findByIdAndUpdate(data.assignedManager, {
          $addToSet: { assignedAgents: user._id }
        });
      }
    }

    return User.findById(user._id).populate('assignedManager', 'name email').select('-password');
  }

  static async removeAgentFromManager(agentId, managerId) {
    const manager = await User.findById(managerId);
    if (!manager || !(manager.assignedAgents || []).some(a => a.toString() === agentId)) {
      throw new Error('Agent not in your team.');
    }
    await User.findByIdAndUpdate(agentId, { assignedManager: null });
    await User.findByIdAndUpdate(managerId, { $pull: { assignedAgents: agentId } });
    return { success: true };
  }

  static async addAgentToTeam(agentId, managerId) {
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') throw new Error('Agent not found.');
    if (agent.assignedManager) throw new Error('Agent is already assigned to another manager.');
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') throw new Error('Manager not found.');
    await User.findByIdAndUpdate(agentId, { assignedManager: managerId });
    await User.findByIdAndUpdate(managerId, { $addToSet: { assignedAgents: agentId } });
    return User.findById(agentId).populate('assignedManager', 'name email').select('-password');
  }

  static async getUnassignedAgents() {
    return User.find({ role: 'agent', assignedManager: null }).select('name email').sort({ name: 1 });
  }

  static async delete(id) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found.');

    await User.updateMany(
      { assignedAgents: user._id },
      { $pull: { assignedAgents: user._id } }
    );
    await user.deleteOne();
    return { success: true };
  }
}

module.exports = UserService;
