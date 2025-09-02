const User = require("../models/User");
const { logger } = require("../utils/logger");

/**
 * Get authenticated user's profile
 */
const getProfile = async (req, res) => {
  try {
    // User ID is available from auth middleware
    const userId = req.user.userId;

    // Find user by ID and exclude password
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        statusCode: 404,
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user,
      statusCode: 200,
    });
  } catch (error) {
    logger.logSystemError("Profile retrieval error", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      statusCode: 500,
    });
  }
};

module.exports = {
  getProfile,
};
