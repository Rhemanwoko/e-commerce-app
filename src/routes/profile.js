const express = require("express");
const { getProfile } = require("../controllers/profileController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /profile - Get authenticated user's profile
router.get("/", authenticate, getProfile);

module.exports = router;
