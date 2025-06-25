const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json([]); // or actual logic later
});

module.exports = router;