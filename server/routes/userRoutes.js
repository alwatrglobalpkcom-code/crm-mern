const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/agents', userController.getAgents);
router.get('/team', roleMiddleware('manager'), userController.getTeam);
router.get('/unassigned-agents', roleMiddleware('manager'), userController.getUnassignedAgents);
router.post('/team', roleMiddleware('manager'), userController.addAgentToTeam);
router.get('/', roleMiddleware('admin'), userController.getAll);
router.get('/:id', roleMiddleware('admin', 'manager'), userController.getById);
router.post('/', roleMiddleware('admin'), userController.create);
router.put('/:id', roleMiddleware('admin', 'manager'), userController.update);
router.delete('/:id', roleMiddleware('admin'), userController.delete);
router.delete('/team/:id', roleMiddleware('manager'), userController.deleteTeamMember);

module.exports = router;
