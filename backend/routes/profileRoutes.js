// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authmiddleware');
const profileController = require('../controllers/profileController');
const upload = require('../middleware/uploadMiddleware');

const profileUpload = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]);

// Connection routes
router.put('/:userId/increment-post-count', authMiddleware, profileController.incrementPostCount);

router.get('/:userId/connections', authMiddleware, profileController.getUserConnections);
router.delete('/connections/:connectionId', authMiddleware, profileController.removeConnection);
router.put('/:userId/decrement-post-count', profileController.decrementPostCount);
// Existing profile routes
router.get('/author/:userId', profileController.getPostAuthorProfile);
router.get('/me', authMiddleware, profileController.getMyProfile); // ✅ Correct function name
router.post('/update', authMiddleware, profileUpload, profileController.updateProfile);

module.exports = router;