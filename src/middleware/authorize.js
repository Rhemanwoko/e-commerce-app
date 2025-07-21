/**
 * Middleware to authorize user roles
 * Must be used after authenticate middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
        statusCode: 401
      });
    }

    // Check if user role is authorized
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        statusCode: 403
      });
    }

    next();
  };
};

/**
 * Middleware specifically for admin-only routes
 */
const requireAdmin = authorize('admin');

/**
 * Middleware for routes accessible by both admin and customer
 */
const requireUser = authorize('admin', 'customer');

module.exports = {
  authorize,
  requireAdmin,
  requireUser
};