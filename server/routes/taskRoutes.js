const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const allowedRoles = ['admin', 'manager', 'agent'];
router.use(authMiddleware, roleMiddleware(...allowedRoles));

router.get('/', taskController.getAll);
router.get('/upcoming-deadlines', taskController.getUpcomingDeadlines);
router.get('/pending-approval', roleMiddleware('admin', 'manager'), taskController.getPendingForApproval);
router.get('/:id', taskController.getById);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.delete);
router.post('/:id/approve', roleMiddleware('admin', 'manager'), taskController.approve);

module.exports = router;
