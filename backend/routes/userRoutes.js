const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const { authMiddleware } = require("../middleware/authmiddleware")

// Apply auth middleware to all routes
router.use(authMiddleware)

// Search users
router.get("/search", userController.searchUsers)

// Get suggested users
router.get("/suggested", userController.getSuggestedUsers)

// Get connection requests
router.get("/requests", userController.getConnectionRequests)

// Follow a user
router.post("/follow/:userId", userController.followUser)

// Respond to a follow request
router.put("/request/:requestId", userController.respondToFollowRequest)

// Get followers and following
router.get("/connections/:userId?", userController.getConnections)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // User is already attached to req by middleware
    res.json(req.user);
  } catch (err) {
    console.error("🔥 Error in /me route:", err);
    res.status(500).json({ message: "Server error while fetching user" });
  }
});

module.exports = router;





