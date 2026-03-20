require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
    return;
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@crm.com',
    password: 'admin123',
    role: 'admin'
  });

  console.log('Admin created:', admin.email, '| Password: admin123');
  process.exit(0);
};

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
