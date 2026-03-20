/**
 * Seed Chat Users - Ensures Manager and Agent exist with correct assignment for Chat
 * Run: node scripts/seedChatUsers.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const PASSWORD = 'demo123';

async function seedChatUsers() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
  console.log('Seeding chat users...\n');

  const MANAGER_EMAIL = 'manager@crm.com';
  let manager = await User.findOne({ role: 'manager' }).select('+password');
  if (!manager) {
    manager = await User.create({
      name: 'Chat Manager',
      email: MANAGER_EMAIL,
      password: PASSWORD,
      role: 'manager'
    });
    console.log('✓ Created manager:', manager.email);
  } else {
    if (manager.email !== MANAGER_EMAIL) {
      const existing = await User.findOne({ email: MANAGER_EMAIL });
      if (!existing) {
        manager.email = MANAGER_EMAIL;
      }
    }
    manager.password = PASSWORD;
    await manager.save();
    console.log('✓ Reset manager:', manager.email);
  }

  let agent = await User.findOne({ role: 'agent', email: 'agent1@crm.com' });
  if (!agent) {
    agent = await User.findOne({ role: 'agent' });
  }
  if (!agent) {
    agent = await User.create({
      name: 'Chat Agent',
      email: 'agent1@crm.com',
      password: PASSWORD,
      role: 'agent',
      assignedManager: manager._id
    });
    await User.findByIdAndUpdate(manager._id, { $addToSet: { assignedAgents: agent._id } });
    console.log('✓ Created agent:', agent.email);
  } else {
    await User.findByIdAndUpdate(agent._id, { assignedManager: manager._id });
    await User.findByIdAndUpdate(manager._id, { $addToSet: { assignedAgents: agent._id } });
    console.log('✓ Linked agent to manager:', agent.email);
  }

  console.log('\n=== Chat Login (matches Login page quick buttons) ===');
  console.log('Manager:', manager.email, '/', PASSWORD);
  console.log('Agent:', agent.email, '/', PASSWORD);
  console.log('\nBoth can now use Chat. Restart server if it was running.');

  await mongoose.disconnect();
  process.exit(0);
}

seedChatUsers().catch(e => {
  console.error(e);
  process.exit(1);
});
