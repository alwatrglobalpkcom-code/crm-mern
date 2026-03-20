const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware, roleMiddleware('manager', 'agent'));

router.get('/conversations', chatController.getConversations);
router.get('/:userId', chatController.getMessages);
router.post('/', chatController.sendMessage);

module.exports = router;
