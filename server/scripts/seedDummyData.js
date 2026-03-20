/**
 * Seed Dummy Data - Full demo with Admin, Manager, Agent, Clients, Tasks, Notifications
 * Usage: node scripts/seedDummyData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

const DUMMY_PASSWORD = 'demo123';

const seedDummy = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');

  console.log('Seeding dummy data...\n');

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✓ Admin:', admin.email);
  }

  let manager = await User.findOne({ name: 'Sarah Manager' });
  if (!manager) {
    manager = await User.create({
      name: 'Sarah Manager',
      email: 'manager@crm.com',
      password: DUMMY_PASSWORD,
      role: 'manager',
      createdBy: admin._id
    });
    console.log('✓ Manager:', manager.email);
  }

  let agent1 = await User.findOne({ name: 'Ali Agent' });
  if (!agent1) {
    agent1 = await User.create({
      name: 'Ali Agent',
      email: 'agent1@crm.com',
      password: DUMMY_PASSWORD,
      role: 'agent',
      assignedManager: manager._id,
      createdBy: admin._id
    });
    await User.findByIdAndUpdate(manager._id, { $addToSet: { assignedAgents: agent1._id } });
    console.log('✓ Agent 1:', agent1.email);
  }

  let agent2 = await User.findOne({ name: 'Emma Agent' });
  if (!agent2) {
    agent2 = await User.create({
      name: 'Emma Agent',
      email: 'agent2@crm.com',
      password: DUMMY_PASSWORD,
      role: 'agent',
      assignedManager: manager._id,
      createdBy: admin._id
    });
    await User.findByIdAndUpdate(manager._id, { $addToSet: { assignedAgents: agent2._id } });
    console.log('✓ Agent 2:', agent2.email);
  }

  const clientData = [
    { clientName: 'John Smith', companyName: 'ABC Pty Ltd', country: 'Australia', ABN: '12345678901', TFN: '123456789', email: 'john@abc.com', phone: '+61 400 111 222', address: 'Sydney NSW', businessType: 'Retail', notes: 'GST registered' },
    { clientName: 'Jane Doe', companyName: 'XYZ Traders', country: 'Australia', ABN: '98765432109', TFN: '987654321', email: 'jane@xyz.com', phone: '+61 411 333 444', address: 'Melbourne VIC', businessType: 'Wholesale', notes: 'BAS monthly' },
    { clientName: 'Mike Wilson', companyName: 'Wilson & Co', country: 'Australia', ABN: '55566677788', email: 'mike@wilson.com', phone: '+61 422 555 666', address: 'Brisbane QLD', businessType: 'Services', notes: '' },
    { clientName: 'Lisa Brown', companyName: 'Brown Consulting', country: 'Australia', ABN: '11122233344', email: 'lisa@brown.com', phone: '+61 433 777 888', address: 'Perth WA', businessType: 'Consulting', notes: 'Tax return due' },
    { clientName: 'David Lee', companyName: 'Lee Enterprises', country: 'Australia', ABN: '99988877766', email: 'david@lee.com', phone: '+61 444 999 000', address: 'Adelaide SA', businessType: 'Manufacturing', notes: '' }
  ];

  let clientCount = 0;
  for (let i = 0; i < clientData.length; i++) {
    const c = clientData[i];
    const exists = await Client.findOne({ companyName: c.companyName });
    if (!exists) {
      await Client.create({
        ...c,
        assignedAgent: i < 3 ? agent1._id : agent2._id,
        assignedManager: manager._id,
        createdBy: i === 0 ? agent1._id : manager._id,
        status: i < 4 ? 'active' : 'pending_approval',
        approvedBy: i < 4 ? manager._id : null
      });
      clientCount++;
    }
  }
  if (clientCount > 0) console.log('✓ Clients:', clientCount);

  const taskTypes = ['BAS', 'GST', 'Tax Return', 'Payroll'];
  const statuses = ['Pending', 'In Progress', 'Completed'];
  const activeClients = await Client.find({ status: 'active', assignedAgent: { $exists: true, $ne: null } }).limit(4);

  let taskCount = 0;
  for (let i = 0; i < 8 && activeClients.length > 0; i++) {
    const client = activeClients[i % activeClients.length];
    if (!client.assignedAgent) continue;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (i % 7) - 2);

    const exists = await Task.findOne({ client: client._id, taskType: taskTypes[i % 4] });
    if (!exists) {
      await Task.create({
        client: client._id,
        taskType: taskTypes[i % 4],
        description: `Task ${i + 1} for ${client.clientName}`,
        dueDate,
        assignedAgent: client.assignedAgent,
        priority: ['high', 'medium', 'low'][i % 3],
        status: statuses[i % 3],
        approvalStatus: 'approved',
        approvedBy: manager._id,
        createdBy: i % 2 === 0 ? manager._id : agent1._id
      });
      taskCount++;
    }
  }
  console.log('✓ Tasks:', taskCount || await Task.countDocuments());

  const notificationTemplates = [
    { msg: 'New client added by Agent Ali: ABC Pty Ltd. Awaiting approval.', type: 'client_approval', forUser: 'manager' },
    { msg: 'Task needs approval: BAS for ABC Pty Ltd by Agent Ali', type: 'task_approval', forUser: 'manager' },
    { msg: 'New task assigned: GST for XYZ Traders', type: 'task_assigned', forUser: 'agent1' },
    { msg: 'Deadline reminder: Tax Return for Wilson & Co due tomorrow', type: 'deadline', forUser: 'agent1' },
    { msg: 'Overdue: BAS for John Smith was due 2 days ago', type: 'overdue', forUser: 'agent1' },
    { msg: 'Client Brown Consulting approved and is now active', type: 'client_approval', forUser: 'agent2' },
    { msg: 'New client Lisa Brown added. Pending your approval.', type: 'client_approval', forUser: 'manager' },
    { msg: 'System: 3 tasks due this week across your team', type: 'deadline', forUser: 'admin' },
    { msg: 'Task approved: Payroll for Lee Enterprises', type: 'task_approval', forUser: 'agent2' },
    { msg: 'New task assigned: BAS for Brown Consulting', type: 'task_assigned', forUser: 'agent2' },
    { msg: 'Weekly summary: 5 clients, 12 tasks in progress', type: 'deadline', forUser: 'admin' },
    { msg: 'GST return for XYZ Traders due in 3 days', type: 'deadline', forUser: 'agent1' }
  ];

  const userMap = { admin, manager, agent1, agent2 };
  let notifCreated = 0;
  for (const t of notificationTemplates) {
    const uid = userMap[t.forUser]?._id;
    if (!uid) continue;
    const exists = await Notification.findOne({ message: t.msg, user: uid });
    if (!exists) {
      await Notification.create({
        user: uid,
        message: t.msg,
        type: t.type,
        read: Math.random() > 0.5
      });
      notifCreated++;
    }
  }
  const notifCount = await Notification.countDocuments();
  console.log('✓ Notifications:', notifCount, notifCreated > 0 ? `(+${notifCreated} new)` : '');

  console.log('\n=== Login Credentials ===');
  console.log('Admin:   admin@crm.com / admin123');
  console.log('Manager: manager@crm.com / demo123');
  console.log('Agent 1: agent1@crm.com / demo123');
  console.log('Agent 2: agent2@crm.com / demo123');
  console.log('\nDone!');
  process.exit(0);
};

seedDummy().catch(err => {
  console.error(err);
  process.exit(1);
});
