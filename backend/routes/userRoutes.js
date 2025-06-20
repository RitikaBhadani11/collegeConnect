const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authmiddleware");

// ✅ Apply auth middleware to all routes
router.use(authMiddleware);

// ✅ Search users
router.get("/search", userController.searchUsers);

// ✅ Get suggested users
router.get("/suggested", userController.getSuggestedUsers);

// ✅ Get connection requests
router.get("/requests", userController.getConnectionRequests);

// ✅ Send connection request (follow)
router.post("/follow/:userId", userController.followUser);

// ✅ Respond to a follow request (accept or reject)
router.put("/request/:requestId", userController.respondToFollowRequest);

// ✅ Get followers and following
router.get("/connections/:userId?", userController.getConnections);

// ✅ Check if a connection exists between logged-in user and another user
router.get("/check-request/:userId", userController.checkConnectionStatus);

// ✅ Get logged-in user info
router.get("/me", async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error("🔥 Error in /me route:", err);
    res.status(500).json({ message: "Server error while fetching user" });
  }
});

module.exports = router;
