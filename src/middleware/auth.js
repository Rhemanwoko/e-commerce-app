const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens
 * Extracts user information from valid tokens and adds to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        statusCode: 401
      });
    }

    // Verify token
    const decoded = verifyToken(authHeader);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
        statusCode: 401
      });
    }

    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Access denied. Invalid token.',
      statusCode: 401
    });
  }
};

module.exports = { authenticate };