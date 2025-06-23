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
const upload = require('../middleware/upload');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Search users
router.get('/search', searchUsers);

// Get conversations
router.get('/conversations', getConversations);

// Start new conversation
router.post('/conversation', startConversation);

// Get messages
router.get('/messages/:id', getMessages);

// Send message (with optional file upload)
router.post('/message', upload.single('file'), sendMessage);

module.exports = router;