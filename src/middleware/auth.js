const { verifyToken } = require("../utils/jwt");
const { ERROR_CODES } = require("../utils/errorCodes");
const { logger } = require("../utils/logger");
const User = require("../models/User");

/**
 * Middleware to authenticate JWT tokens
 * Extracts user information from valid tokens and adds to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      logger.logAuthFailure("No authorization header provided", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        method: req.method,
      });

      return res.authError(ERROR_CODES.NO_TOKEN);
    }

    // Verify token
    const decoded = verifyToken(authHeader);

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.logAuthFailure("User not found for valid token", {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.authError(ERROR_CODES.USER_NOT_FOUND);
    }

    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Log successful authentication
    logger.logAuthSuccess(decoded.userId, decoded.role, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    // Handle JWT-specific errors
    if (error.name === "JWTError") {
      logger.logAuthFailure(`JWT Error: ${error.code}`, {
        errorCode: error.code,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
      });

      return res.authError(error.code, error.message);
    }

    // Handle unexpected errors
    logger.logSystemError("Unexpected authentication error", error, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
    });

    return res.authError(
      ERROR_CODES.SYSTEM_ERROR,
      "Authentication system error"
    );
  }
};

module.exports = { authenticate };
