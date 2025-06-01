const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Get user notifications
router.get('/', authMiddleware, getNotifications);

// Mark notification as read
router.put('/:notificationId/read', authMiddleware, markAsRead);

module.exports = router;