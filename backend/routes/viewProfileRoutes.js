const express = require("express");
const router = express.Router();
const { getProfile } = require("../controllers/viewProfileController");
const { authMiddleware } = require("../middleware/authmiddleware");

// Get profile by user ID
router.get("/:userId", authMiddleware, getProfile);

module.exports = router;