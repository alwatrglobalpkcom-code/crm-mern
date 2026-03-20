/**
 * Seed Notifications - Add realistic notifications for all roles (testing)
 * Usage: node scripts/seedNotifications.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

const seedNotifications = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');

  const admin = await User.findOne({ role: 'admin' });
  const manager = await User.findOne({ role: 'manager' });
  const agents = await User.find({ role: 'agent' }).limit(2);
  const agent1 = agents[0];
  const agent2 = agents[1];

  if (!admin || !manager || !agent1) {
    console.log('Run seedDummyData.js first to create users.');
    process.exit(1);
  }

  const clients = await Client.find().limit(3).lean();
  const tasks = await Task.find().limit(3).populate('client').lean();

  const templates = [
    { msg: 'New client added. Awaiting your approval.', type: 'client_approval', forRole: 'manager' },
    { msg: 'Task needs approval: BAS for client', type: 'task_approval', forRole: 'manager' },
    { msg: 'New task assigned to you', type: 'task_assigned', forRole: 'agent' },
    { msg: 'Deadline reminder: Task due tomorrow', type: 'deadline', forRole: 'agent' },
    { msg: 'Overdue: Task was due 2 days ago', type: 'overdue', forRole: 'agent' },
    { msg: 'Client approved and is now active', type: 'client_approval', forRole: 'agent' },
    { msg: 'System: Tasks due this week across your team', type: 'deadline', forRole: 'admin' },
    { msg: 'Weekly summary: Clients and tasks in progress', type: 'deadline', forRole: 'admin' },
    { msg: 'GST return due in 3 days', type: 'deadline', forRole: 'agent' },
    { msg: 'Tax Return for client due next week', type: 'deadline', forRole: 'agent' }
  ];

  const getUsersForRole = (role) => {
    if (role === 'admin') return [admin];
    if (role === 'manager') return [manager];
    return [agent1, agent2].filter(Boolean);
  };

  let created = 0;
  for (const t of templates) {
    const users = getUsersForRole(t.forRole);
    for (const u of users) {
      const clientName = clients[0]?.clientName || 'Client';
      const msg = t.msg.replace('client', clientName).replace('Client', clientName);
      const exists = await Notification.findOne({ message: msg, user: u._id });
      if (!exists) {
        await Notification.create({
          user: u._id,
          message: msg,
          type: t.type,
          read: Math.random() > 0.4
        });
        created++;
      }
    }
  }

  console.log('✓ Notifications seeded:', created, 'new');
  console.log('Total:', await Notification.countDocuments());
  process.exit(0);
};

seedNotifications().catch(err => {
  console.error(err);
  process.exit(1);
});
