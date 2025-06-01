const express = require('express');
const router = express.Router();
const {
  searchUsers,
  getConversations,
  startConversation,
  getMessages,
  sendMessage
} = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/authmiddleware');

router.get('/search', authMiddleware, searchUsers);
router.get('/conversations', authMiddleware, getConversations);
router.post('/conversation', authMiddleware, startConversation);
router.get('/messages/:id', authMiddleware, getMessages);
router.post('/message', authMiddleware, sendMessage);

module.exports = router;
