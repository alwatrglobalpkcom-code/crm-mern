const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailService = require('../services/EmailService');

const runReminderCheck = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);

  const clientName = (task) => task.client?.clientName || task.client?.companyName || 'Client';
  const dueStr = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  const upcomingTasks = await Task.find({
    dueDate: { $gte: startOfToday, $lte: in7Days },
    status: { $ne: 'Completed' },
    approvalStatus: 'approved'
  })
    .populate('client', 'clientName companyName')
    .populate('assignedAgent')
    .populate('createdBy');

  for (const task of upcomingTasks) {
    if (!task.assignedAgent) continue;
    const existing = await Notification.findOne({
      user: task.assignedAgent._id,
      type: 'deadline',
      relatedId: task._id,
      relatedModel: 'Task',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    if (existing) continue;
    const cName = clientName(task);
    const dStr = dueStr(task.dueDate);
    await Notification.create({
      user: task.assignedAgent._id,
      message: `Deadline reminder: ${task.taskType} for ${cName} due ${dStr}`,
      type: 'deadline',
      relatedId: task._id,
      relatedModel: 'Task'
    });
    const reminderSent = new Set();
    const sendReminderTo = (email, name) => {
      if (email && !reminderSent.has(email)) {
        reminderSent.add(email);
        return EmailService.sendReminder(email, name, task.taskType, cName, dStr);
      }
    };
    await sendReminderTo(task.assignedAgent.email, task.assignedAgent.name);
    const agentWithManager = await User.findById(task.assignedAgent._id).populate('assignedManager', 'email name');
    if (agentWithManager?.assignedManager?.email) {
      await Notification.create({
        user: agentWithManager.assignedManager._id,
        message: `Deadline reminder: ${task.taskType} for ${cName} (Agent: ${task.assignedAgent.name}) due ${dStr}`,
        type: 'deadline',
        relatedId: task._id,
        relatedModel: 'Task'
      });
      await sendReminderTo(agentWithManager.assignedManager.email, agentWithManager.assignedManager.name);
    }
    const admins = await User.find({ role: 'admin' }).select('email name');
    for (const a of admins) await sendReminderTo(a.email, a.name);
  }

  const overdueTasks = await Task.find({
    dueDate: { $lt: startOfToday },
    status: { $ne: 'Completed' },
    approvalStatus: 'approved'
  })
    .populate('client', 'clientName companyName')
    .populate('assignedAgent')
    .populate('createdBy');

  for (const task of overdueTasks) {
    if (!task.assignedAgent) continue;
    const existing = await Notification.findOne({
      user: task.assignedAgent._id,
      type: 'overdue',
      relatedId: task._id,
      relatedModel: 'Task',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    if (existing) continue;
    const cName = clientName(task);
    const dStr = dueStr(task.dueDate);
    const message = `${dStr} ho gayi - abhi tak kuch hua nahi: ${task.taskType} for ${cName}`;
    await Notification.create({
      user: task.assignedAgent._id,
      message,
      type: 'overdue',
      relatedId: task._id,
      relatedModel: 'Task'
    });
    const overdueSent = new Set();
    const sendOverdueTo = (email, name) => {
      if (email && !overdueSent.has(email)) {
        overdueSent.add(email);
        return EmailService.sendOverdueReminder(email, name, task.taskType, cName, dStr);
      }
    };
    await sendOverdueTo(task.assignedAgent.email, task.assignedAgent.name);
    const agentWithManager = await User.findById(task.assignedAgent._id).populate('assignedManager', 'email name');
    if (agentWithManager?.assignedManager?.email) {
      await Notification.create({
        user: agentWithManager.assignedManager._id,
        message: `${dStr} ho gayi - abhi tak kuch hua nahi: ${task.taskType} for ${cName} (Agent: ${task.assignedAgent.name})`,
        type: 'overdue',
        relatedId: task._id,
        relatedModel: 'Task'
      });
      await sendOverdueTo(agentWithManager.assignedManager.email, agentWithManager.assignedManager.name);
    }
    const admins = await User.find({ role: 'admin' }).select('email name');
    for (const a of admins) await sendOverdueTo(a.email, a.name);
  }
};

const startReminderJob = () => {
  cron.schedule('0 9 * * *', runReminderCheck, { timezone: 'Australia/Sydney' });
};

module.exports = { startReminderJob, runReminderCheck };
