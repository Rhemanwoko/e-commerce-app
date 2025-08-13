const { ERROR_CODES } = require("../utils/errorCodes");
const { logger } = require("../utils/logger");

/**
 * Middleware to authorize user roles
 * Must be used after authenticate middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      logger.logAuthFailure("Authorization attempted without authentication", {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      return res.authError(
        ERROR_CODES.NO_TOKEN,
        "Authentication required for this resource"
      );
    }

    // Check if user role is authorized
    if (!roles.includes(req.user.role)) {
      logger.logPermissionDenied(
        req.user.userId,
        roles.join(" or "),
        req.user.role,
        {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        }
      );

      return res.authorizationError(
        req.user.userId,
        roles.join(" or "),
        req.user.role
      );
    }

    // Log successful authorization
    logger.logInfo(
      "auth",
      "authorization_success",
      `User ${req.user.userId} authorized for ${req.method} ${req.path}`,
      {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
      }
    );

    next();
  };
};

/**
 * Middleware specifically for admin-only routes
 */
const requireAdmin = authorize("admin");

/**
 * Middleware for routes accessible by both admin and customer
 */
const requireUser = authorize("admin", "customer");

module.exports = {
  authorize,
  requireAdmin,
  requireUser,
};
