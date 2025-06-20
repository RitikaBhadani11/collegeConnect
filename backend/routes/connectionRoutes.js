const express = require("express");
const router = express.Router();
const connectionController = require("../controllers/connectionController");
const { authMiddleware } = require("../middleware/authmiddleware");

// Connection routes
router.get("/requests", authMiddleware, connectionController.getConnectionRequests);
router.get("/suggestions", authMiddleware, connectionController.getSuggestedUsers);
router.post("/:userId", authMiddleware, connectionController.sendConnectionRequest);
router.put("/respond/:requestId", authMiddleware, connectionController.respondToConnectionRequest);
router.get("/", authMiddleware, connectionController.getConnections);
router.delete("/:connectionId", authMiddleware, connectionController.removeConnection);
router.get("/search", authMiddleware, connectionController.searchUsers);

module.exports = router;