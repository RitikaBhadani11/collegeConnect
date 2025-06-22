const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authmiddleware');
const profileController = require('../controllers/profileController');
const upload = require("../middleware/upload");
const profileUpload = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]);

// Connection routes
router.put('/:userId/increment-post-count', authMiddleware, profileController.incrementPostCount);
router.put('/:userId/decrement-post-count', authMiddleware, profileController.decrementPostCount);

// Profile routes
router.get('/me', authMiddleware, profileController.getMyProfile);
router.post('/update', authMiddleware, profileUpload, profileController.updateProfile);
router.get('/author/:userId', profileController.getPostAuthorProfile);

// Connection routes
router.get('/:userId/connections', authMiddleware, profileController.getUserConnections);
router.delete('/connections/:connectionId', authMiddleware, profileController.removeConnection);

module.exports = router;