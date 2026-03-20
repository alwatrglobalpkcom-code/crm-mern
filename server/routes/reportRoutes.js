const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const allowedRoles = ['admin', 'manager', 'agent'];
router.use(authMiddleware, roleMiddleware(...allowedRoles));

router.get('/clients', reportController.getClientStats);
router.get('/tasks', reportController.getTaskStats);
router.get('/users', roleMiddleware('admin'), reportController.getUserStats);
router.get('/user-performance', roleMiddleware('admin', 'manager'), reportController.getUserPerformance);
router.get('/revenue', reportController.getRevenue);

module.exports = router;
