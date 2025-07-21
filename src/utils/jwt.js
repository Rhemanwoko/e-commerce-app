const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate JWT token with user information
 * @param {Object} payload - User data to include in token
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  try {
    const { userId, email, role } = payload;
    
    if (!userId || !email || !role) {
      throw new Error('Missing required payload fields: userId, email, role');
    }

    const tokenPayload = {
      userId,
      email,
      role
    };

    const options = {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'ecommerce-api'
    };

    return jwt.sign(tokenPayload, process.env.JWT_SECRET, options);
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active yet');
    } else {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
};

module.exports = {
  generateToken,
  verifyToken
};