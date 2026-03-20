/**
 * Seed Demo Data - Full CRM demo for all roles
 * Covers: Admin, Manager, 2+ Agents, Clients, Tasks, Notifications, Documents, Chat
 * Includes: Pending approvals, Overdue tasks, Upcoming deadlines
 * Usage: node scripts/seedDemo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Client = require('../models/Client');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Document = require('../models/Document');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');

const PASSWORD = 'demo123';
const UPLOAD_DIR = path.join(__dirname, '../uploads');

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
};

const createPlaceholderFile = (fileName) => {
  ensureUploadDir();
  const fullPath = path.join(UPLOAD_DIR, `seed-${Date.now()}-${Math.random().toString(36).slice(2)}-${path.basename(fileName)}`);
  fs.writeFileSync(fullPath, `Placeholder for ${fileName} - CRM Demo Seed Data`);
  return fullPath;
};

const seedDemo = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
  console.log('Seeding CRM demo data...\n');

  // --- USERS ---
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✓ Admin:', admin.email);
  } else console.log('✓ Admin exists:', admin.email);

  const managerEmails = ['manager1@crm.com', 'manager2@crm.com'];
  const managerNames = ['Sarah Manager', 'David Manager'];
  const managers = [];
  for (let i = 0; i < managerEmails.length; i++) {
    let m = await User.findOne({ email: managerEmails[i] });
    if (!m) {
      m = await User.create({
        name: managerNames[i],
        email: managerEmails[i],
        password: PASSWORD,
        role: 'manager',
        createdBy: admin._id
      });
      console.log(`✓ Manager ${i + 1}:`, m.email);
    } else console.log(`✓ Manager ${i + 1} exists:`, m.email);
    managers.push(m);
  }
  const manager = managers[0];

  const agentEmails = ['agent1@crm.com', 'agent2@crm.com', 'agent3@crm.com', 'agent4@crm.com', 'agent5@crm.com', 'agent6@crm.com'];
  const agentNames = ['Ali Agent', 'Emma Agent', 'James Agent', 'Olivia Agent', 'Noah Agent', 'Ava Agent'];
  const agents = [];

  for (let i = 0; i < agentEmails.length; i++) {
    const mgr = managers[i % 2];
    let agent = await User.findOne({ email: agentEmails[i] });
    if (!agent) {
      agent = await User.create({
        name: agentNames[i],
        email: agentEmails[i],
        password: PASSWORD,
        role: 'agent',
        assignedManager: mgr._id,
        createdBy: admin._id
      });
      await User.findByIdAndUpdate(mgr._id, { $addToSet: { assignedAgents: agent._id } });
      console.log(`✓ Agent ${i + 1}:`, agent.email);
    } else {
      await User.findByIdAndUpdate(agent._id, { assignedManager: mgr._id });
      await User.findByIdAndUpdate(mgr._id, { $addToSet: { assignedAgents: agent._id } });
      console.log(`✓ Agent ${i + 1} exists:`, agent.email);
    }
    agents.push(agent);
  }

  const agent1 = agents[0];
  const agent2 = agents[1];
  const agent3 = agents[2] || agent2;

  // --- CLIENTS (20) ---
  const clientData = [
    { clientName: 'John Smith', companyName: 'ABC Pty Ltd', country: 'Australia', ABN: '12345678901', TFN: '123456789', email: 'john@abc.com', phone: '+61 400 111 222', address: 'Sydney NSW', businessType: 'Retail', notes: 'GST registered' },
    { clientName: 'Jane Doe', companyName: 'XYZ Traders', country: 'Australia', ABN: '98765432109', TFN: '987654321', email: 'jane@xyz.com', phone: '+61 411 333 444', address: 'Melbourne VIC', businessType: 'Wholesale', notes: 'BAS monthly' },
    { clientName: 'Mike Wilson', companyName: 'Wilson & Co', country: 'Australia', ABN: '55566677788', email: 'mike@wilson.com', phone: '+61 422 555 666', address: 'Brisbane QLD', businessType: 'Services', notes: '' },
    { clientName: 'Lisa Brown', companyName: 'Brown Consulting', country: 'Australia', ABN: '11122233344', email: 'lisa@brown.com', phone: '+61 433 777 888', address: 'Perth WA', businessType: 'Consulting', notes: 'Tax return due' },
    { clientName: 'David Lee', companyName: 'Lee Enterprises', country: 'Australia', ABN: '99988877766', email: 'david@lee.com', phone: '+61 444 999 000', address: 'Adelaide SA', businessType: 'Manufacturing', notes: '' },
    { clientName: 'Sophie Chen', companyName: 'Chen Accounting', country: 'Australia', ABN: '22233344455', email: 'sophie@chen.com', phone: '+61 455 111 222', address: 'Hobart TAS', businessType: 'Accounting', notes: 'Payroll quarterly' },
    { clientName: 'Tom Harris', companyName: 'Harris Builders', country: 'Australia', ABN: '33344455566', email: 'tom@harris.com', phone: '+61 466 333 444', address: 'Melbourne VIC', businessType: 'Construction', notes: '' },
    { clientName: 'Rachel Green', companyName: 'Green Design Studio', country: 'Australia', ABN: '44455566677', email: 'rachel@green.com', phone: '+61 477 555 666', address: 'Sydney NSW', businessType: 'Design', notes: '' },
    { clientName: 'Chris Taylor', companyName: 'Taylor Logistics', country: 'Australia', ABN: '55566677788', email: 'chris@taylor.com', phone: '+61 488 777 888', address: 'Gold Coast QLD', businessType: 'Logistics', notes: '' },
    { clientName: 'Amy White', companyName: 'White Legal', country: 'Australia', ABN: '66677788899', email: 'amy@white.com', phone: '+61 499 888 999', address: 'Canberra ACT', businessType: 'Legal', notes: '' },
    { clientName: 'Mark Davis', companyName: 'Davis Motors', country: 'Australia', ABN: '77788899900', email: 'mark@davis.com', phone: '+61 500 999 000', address: 'Newcastle NSW', businessType: 'Automotive', notes: '' },
    { clientName: 'Kate Moore', companyName: 'Moore Marketing', country: 'Australia', ABN: '88899900011', email: 'kate@moore.com', phone: '+61 511 000 111', address: 'Wollongong NSW', businessType: 'Marketing', notes: '' },
    { clientName: 'Paul Clark', companyName: 'Clark Plumbing', country: 'Australia', ABN: '99900011122', email: 'paul@clark.com', phone: '+61 522 111 222', address: 'Geelong VIC', businessType: 'Trade', notes: '' },
    { clientName: 'Anna King', companyName: 'King Catering', country: 'Australia', ABN: '10011122233', email: 'anna@king.com', phone: '+61 533 222 333', address: 'Sunshine Coast QLD', businessType: 'Hospitality', notes: '' },
    { clientName: 'Steve Wright', companyName: 'Wright IT Solutions', country: 'Australia', ABN: '11122233344', email: 'steve@wright.com', phone: '+61 544 333 444', address: 'Darwin NT', businessType: 'IT', notes: '' },
    { clientName: 'Emma Scott', companyName: 'Scott Real Estate', country: 'Australia', ABN: '12223334455', email: 'emma@scott.com', phone: '+61 555 444 555', address: 'Hobart TAS', businessType: 'Real Estate', notes: '' },
    { clientName: 'James Hill', companyName: 'Hill Engineering', country: 'Australia', ABN: '13334445566', email: 'james@hill.com', phone: '+61 566 555 666', address: 'Launceston TAS', businessType: 'Engineering', notes: '' },
    { clientName: 'Maria Young', companyName: 'Young Dental', country: 'Australia', ABN: '14445556677', email: 'maria@young.com', phone: '+61 577 666 777', address: 'Cairns QLD', businessType: 'Healthcare', notes: '' },
    { clientName: 'Dan Adams', companyName: 'Adams Fitness', country: 'Australia', ABN: '15556667788', email: 'dan@adams.com', phone: '+61 588 777 888', address: 'Ballarat VIC', businessType: 'Fitness', notes: '' },
    { clientName: 'Sara Baker', companyName: 'Baker Bakery', country: 'Australia', ABN: '16667778899', email: 'sara@baker.com', phone: '+61 599 888 999', address: 'Bendigo VIC', businessType: 'Food', notes: '' }
  ];

  const clients = [];
  for (let i = 0; i < clientData.length; i++) {
    const c = clientData[i];
    let client = await Client.findOne({ companyName: c.companyName });
    if (!client) {
      const agentAssign = agents[i % agents.length];
      const mgrAssign = managers[i % 2];
      client = await Client.create({
        ...c,
        assignedAgent: agentAssign._id,
        assignedManager: mgrAssign._id,
        createdBy: agents[i % 3]._id,
        status: i < 16 ? 'active' : 'pending_approval',
        approvedBy: i < 16 ? mgrAssign._id : null
      });
    }
    clients.push(client);
  }
  console.log('✓ Clients:', clients.length);

  const activeClients = clients.filter(c => c.status === 'active');
  const pendingClients = clients.filter(c => c.status === 'pending_approval');

  // --- TASKS ---
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const taskTypes = ['BAS', 'GST', 'Tax Return', 'Payroll'];
  const taskDescs = ['Q1 BAS lodgement', 'GST reconciliation', 'FY2024 tax return', 'Monthly BAS', 'Payroll processing', 'GST return', 'Individual tax return', 'Quarterly BAS', 'Payroll approval', 'BAS preparation', 'Company tax return', 'Annual BAS', 'GST lodgement', 'Payroll run', 'Tax return review', 'BAS amendment', 'Superannuation', 'FBT return', 'IAS lodgement', 'Work cover'];
  let taskCount = 0;
  const existingTaskCount = await Task.countDocuments();
  const targetTasks = 40;
  for (let i = 0; i < targetTasks && activeClients.length > 0; i++) {
    const client = activeClients[i % activeClients.length];
    const type = taskTypes[i % 4];
    const desc = taskDescs[i % taskDescs.length] + ` (${i + 1})`;
    const due = [yesterday, tomorrow, nextWeek, nextMonth, lastWeek][i % 5];
    const status = ['Pending', 'In Progress', 'Completed'][i % 3];
    const approval = i % 7 === 0 ? 'pending_approval' : 'approved';
    const exists = await Task.findOne({ client: client._id, description: desc });
    if (!exists) {
      await Task.create({
        client: client._id,
        taskType: type,
        description: desc,
        dueDate: due,
        assignedAgent: client.assignedAgent,
        createdBy: agent1._id,
        priority: ['high', 'medium', 'low'][i % 3],
        status,
        approvalStatus: approval,
        approvedBy: approval === 'approved' ? manager._id : null,
        amount: status === 'Completed' ? Math.round(500 + Math.random() * 2000) : 0
      });
      taskCount++;
    }
  }
  console.log('✓ Tasks:', taskCount || existingTaskCount || await Task.countDocuments());

  // --- NOTIFICATIONS ---
  const notificationData = [
    { msg: 'New client Tom Harris (Harris Builders) added by Ali. Awaiting your approval.', type: 'client_approval', forUser: 'manager' },
    { msg: 'New client Rachel Green (Green Design Studio) added. Pending your approval.', type: 'client_approval', forUser: 'manager' },
    { msg: 'Task needs approval: Payroll for XYZ Traders by Ali Agent', type: 'task_approval', forUser: 'manager' },
    { msg: 'Task needs approval: BAS for ABC Pty Ltd by Ali Agent', type: 'task_approval', forUser: 'manager' },
    { msg: 'New task assigned: GST for XYZ Traders due tomorrow', type: 'task_assigned', forUser: 'agent1' },
    { msg: 'New task assigned: Tax Return for ABC Pty Ltd due next week', type: 'task_assigned', forUser: 'agent1' },
    { msg: 'Deadline reminder: Tax Return for XYZ Traders due tomorrow', type: 'deadline', forUser: 'agent1' },
    { msg: 'Deadline reminder: GST for Wilson & Co due tomorrow', type: 'deadline', forUser: 'agent1' },
    { msg: 'Overdue: Payroll for Wilson & Co was due 7 days ago', type: 'overdue', forUser: 'agent1' },
    { msg: 'Overdue: Payroll for XYZ Traders was due yesterday', type: 'overdue', forUser: 'agent1' },
    { msg: 'Overdue: BAS for ABC Pty Ltd was due yesterday', type: 'overdue', forUser: 'agent1' },
    { msg: 'Client Brown Consulting approved and is now active', type: 'client_approval', forUser: 'agent2' },
    { msg: 'Task approved: Payroll for Lee Enterprises', type: 'task_approval', forUser: 'agent2' },
    { msg: 'New task assigned: GST for Lee Enterprises due tomorrow', type: 'task_assigned', forUser: 'agent2' },
    { msg: 'Task assigned: Tax Return for Chen Accounting due next week', type: 'task_assigned', forUser: 'agent2' },
    { msg: 'System: 5 tasks due this week across your team', type: 'deadline', forUser: 'admin' },
    { msg: 'Weekly summary: 8 clients, 13 tasks in progress', type: 'deadline', forUser: 'admin' },
    { msg: '3 overdue tasks require attention', type: 'overdue', forUser: 'admin' },
    { msg: 'GST return for XYZ Traders due in 1 day', type: 'deadline', forUser: 'agent1' },
    { msg: 'Tax Return for Brown Consulting due in 7 days', type: 'deadline', forUser: 'agent1' }
  ];

  const userMap = { admin, manager, agent1, agent2 };
  let notifCreated = 0;
  for (const t of notificationData) {
    const uid = userMap[t.forUser]?._id;
    if (!uid) continue;
    const exists = await Notification.findOne({ message: t.msg, user: uid });
    if (!exists) {
      await Notification.create({
        user: uid,
        message: t.msg,
        type: t.type,
        read: Math.random() > 0.6
      });
      notifCreated++;
    }
  }
  console.log('✓ Notifications:', await Notification.countDocuments(), notifCreated > 0 ? `(+${notifCreated} new)` : '');

  // --- DOCUMENTS (30) ---
  const docNames = ['invoice-2024.pdf', 'ABN-certificate.pdf', 'bank-statement.pdf', 'contract.pdf', 'tax-document.pdf', 'receipts.pdf', 'financial-report.pdf', 'insurance-cert.pdf', 'lease-agreement.pdf', 'employee-contract.pdf'];
  let docCount = 0;
  const targetDocs = 30;
  for (let i = 0; i < targetDocs && activeClients.length > 0; i++) {
    const client = activeClients[i % activeClients.length];
    const fileName = `${docNames[i % docNames.length].replace('.pdf', '')}-${i + 1}.pdf`;
    const exists = await Document.findOne({ client: client._id, fileName });
    if (!exists) {
      const filePath = createPlaceholderFile(fileName);
      await Document.create({
        client: client._id,
        fileName,
        filePath,
        uploadedBy: agents[i % agents.length]._id
      });
      docCount++;
    }
  }
  console.log('✓ Documents:', docCount || await Document.countDocuments());

  // --- CHAT MESSAGES ---
  const chatMessages = [
    { from: 'manager', to: 'agent1', text: 'Hi Ali, can you prioritise the BAS for ABC Pty Ltd? It\'s overdue.' },
    { from: 'agent1', to: 'manager', text: 'Sure Sarah, I\'ll get it done by today.' },
    { from: 'manager', to: 'agent1', text: 'Thanks! Let me know when it\'s submitted.' },
    { from: 'agent1', to: 'manager', text: 'Will do. I\'ve also started on the GST for Wilson & Co.' },
    { from: 'manager', to: 'agent2', text: 'Hi Emma, the new client Lee Enterprises is assigned to you. Please review their documents.' },
    { from: 'agent2', to: 'manager', text: 'Got it. I\'ll reach out to them today.' },
    { from: 'manager', to: 'agent2', text: 'Great. Their tax return is due next week.' },
    { from: 'agent1', to: 'manager', text: 'BAS for ABC submitted. Pending your approval.' },
    { from: 'manager', to: 'agent1', text: 'Approved. Good work.' },
    { from: 'agent2', to: 'manager', text: 'Quick question - is GST monthly or quarterly for Chen Accounting?' },
    { from: 'manager', to: 'agent2', text: 'Quarterly for Chen. Due end of next month.' }
  ];

  let msgCount = 0;
  for (const m of chatMessages) {
    const sender = m.from === 'manager' ? manager._id : (m.from === 'agent1' ? agent1._id : agent2._id);
    const receiver = m.to === 'manager' ? manager._id : (m.to === 'agent1' ? agent1._id : agent2._id);
    const exists = await Message.findOne({ sender, receiver, text: m.text });
    if (!exists) {
      await Message.create({
        sender,
        receiver,
        text: m.text,
        readAt: Math.random() > 0.3 ? new Date() : null
      });
      msgCount++;
    }
  }
  console.log('✓ Chat messages:', msgCount || await Message.countDocuments());

  // --- ACTIVITY LOGS (for Admin testing) ---
  const sampleTask = await Task.findOne().lean();
  const sampleDoc = await Document.findOne().lean();
  const logEntries = [
    { userId: admin._id, userName: admin.name, action: 'create', entity: 'user', entityId: manager._id, entityLabel: manager.name },
    { userId: admin._id, userName: admin.name, action: 'create', entity: 'client', entityId: activeClients[0]?._id, entityLabel: activeClients[0]?.clientName || 'ABC Pty Ltd' },
    { userId: agent1._id, userName: agent1.name, action: 'create', entity: 'client', entityId: activeClients[1]?._id, entityLabel: activeClients[1]?.clientName || 'XYZ Traders' },
    { userId: manager._id, userName: manager.name, action: 'update', entity: 'client', entityId: activeClients[0]?._id, entityLabel: activeClients[0]?.clientName || 'ABC Pty Ltd' },
    { userId: agent1._id, userName: agent1.name, action: 'create', entity: 'task', entityId: sampleTask?._id, entityLabel: 'BAS for ABC Pty Ltd' },
    { userId: manager._id, userName: manager.name, action: 'update', entity: 'task', entityId: sampleTask?._id, entityLabel: 'GST for XYZ Traders' },
    { userId: agent2._id, userName: agent2.name, action: 'create', entity: 'document', entityId: sampleDoc?._id, entityLabel: sampleDoc?.fileName || 'invoice-2024.pdf' }
  ];
  let logCount = 0;
  for (const entry of logEntries) {
    const exists = await ActivityLog.findOne({
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityLabel: entry.entityLabel
    });
    if (!exists) {
      await ActivityLog.create(entry);
      logCount++;
    }
  }
  if (logCount > 0) console.log('✓ Activity logs:', logCount);

  const taskCountTotal = await Task.countDocuments();
  const overdueCount = await Task.countDocuments({
    status: { $ne: 'Completed' },
    dueDate: { $lt: now }
  });
  const pendingApprovalTasks = await Task.countDocuments({ approvalStatus: 'pending_approval' });
  const pendingApprovalClients = await Client.countDocuments({ status: 'pending_approval' });

  console.log('\n=== Demo Summary ===');
  console.log('Clients:', await Client.countDocuments(), '(active + pending:', pendingApprovalClients, 'pending)');
  console.log('Tasks:', taskCountTotal, '(overdue:', overdueCount, '| pending approval:', pendingApprovalTasks, ')');
  console.log('Notifications:', await Notification.countDocuments());
  console.log('Documents:', await Document.countDocuments());
  console.log('Chat messages:', await Message.countDocuments());
  console.log('Activity logs:', await ActivityLog.countDocuments());

  console.log('\n=== Login Credentials ===');
  console.log('Admin:    admin@crm.com / admin123');
  console.log('Manager1: manager1@crm.com /', PASSWORD);
  console.log('Manager2: manager2@crm.com /', PASSWORD);
  agents.forEach((a, i) => console.log(`Agent ${i + 1}: ${a.email} /`, PASSWORD));
  console.log('\nDone! Run the app and test all modules.');
  process.exit(0);
};

seedDemo().catch(err => {
  console.error(err);
  process.exit(1);
});
