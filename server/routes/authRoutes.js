const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// One-time seed: GET /api/auth/seed-admin?key=YOUR_SEED_SECRET
router.get('/seed-admin', async (req, res) => {
  const key = process.env.SEED_SECRET;
  if (!key || req.query.key !== key) {
    return res.status(401).json({ message: 'Invalid or missing key. Set SEED_SECRET in Railway Variables.' });
  }
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.json({ ok: true, message: 'Admin already exists', email: existing.email });
    }
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'admin'
    });
    res.json({ ok: true, message: 'Admin created', email: admin.email, password: 'admin123' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Seed failed' });
  }
});

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, authController.updateProfile);
router.post('/register', authMiddleware, roleMiddleware('admin'), authController.register);

module.exports = router;
