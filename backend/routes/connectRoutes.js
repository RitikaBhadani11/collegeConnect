const express = require("express");
const router = express.Router();
const connectionController = require("../controllers/connectionController");
const { authMiddleware } = require("../middleware/authmiddleware");

router.post("/", authMiddleware, connectionController.sendRequest);
router.put("/respond", authMiddleware, connectionController.respondToRequest);
router.get("/", authMiddleware, connectionController.getConnections);
router.get("/requests", authMiddleware, connectionController.getPendingRequests);

module.exports = router;