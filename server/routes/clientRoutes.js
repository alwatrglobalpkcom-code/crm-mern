const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const allowedRoles = ['admin', 'manager', 'agent'];
router.use(authMiddleware, roleMiddleware(...allowedRoles));

router.get('/', clientController.getAll);
router.get('/pending-approval', roleMiddleware('admin', 'manager'), clientController.getPendingForApproval);
router.get('/:id', clientController.getById);
router.post('/', clientController.create);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);
router.post('/:id/approve', roleMiddleware('admin', 'manager'), clientController.approve);

module.exports = router;
