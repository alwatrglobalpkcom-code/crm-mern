/**
 * Add clientCode to existing clients that don't have it
 * Usage: node scripts/migrateClientCodes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');

const migrate = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
  const withCode = await Client.find({ clientCode: { $exists: true, $ne: null } });
  const maxNum = withCode.reduce((m, c) => {
    const n = parseInt((c.clientCode || '').replace('CLT-', ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  const clients = await Client.find({ $or: [{ clientCode: null }, { clientCode: { $exists: false } }] }).sort({ createdAt: 1 });
  for (let i = 0; i < clients.length; i++) {
    const code = `CLT-${String(maxNum + i + 1).padStart(4, '0')}`;
    await Client.findByIdAndUpdate(clients[i]._id, { clientCode: code });
  }
  console.log(`Updated ${clients.length} clients with clientCode`);
  process.exit(0);
};

migrate().catch(e => { console.error(e); process.exit(1); });
