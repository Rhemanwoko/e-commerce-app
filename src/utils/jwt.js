const jwt = require("jsonwebtoken");
const { ERROR_CODES, SECURITY_CONFIG } = require("../config/security");
const { logger } = require("./logger");

/**
 * Custom JWT error class for better error handling
 */
class JWTError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = "JWTError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Validate token format before JWT verification
 * @param {string} token - Token to validate
 * @throws {JWTError} If token format is invalid
 */
const validateTokenFormat = (token) => {
  if (!token || typeof token !== "string") {
    throw new JWTError(
      "Token is required and must be a string",
      ERROR_CODES.NO_TOKEN
    );
  }

  // Remove Bearer prefix if present
  const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

  if (!cleanToken) {
    throw new JWTError(
      "Token cannot be empty",
      ERROR_CODES.INVALID_TOKEN_FORMAT
    );
  }

  // Basic JWT format validation (3 parts separated by dots)
  const parts = cleanToken.split(".");
  if (parts.length !== 3) {
    throw new JWTError(
      "Invalid token format - JWT must have 3 parts",
      ERROR_CODES.INVALID_TOKEN_FORMAT
    );
  }

  // Validate each part is base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  if (!parts.every((part) => base64UrlRegex.test(part))) {
    throw new JWTError(
      "Invalid token format - invalid base64url encoding",
      ERROR_CODES.INVALID_TOKEN_FORMAT
    );
  }

  return cleanToken;
};

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
      const error = new JWTError(
        "Missing required payload fields: userId, email, role",
        ERROR_CODES.VALIDATION_ERROR
      );
      logger.logSystemError(
        "JWT token generation failed - missing payload fields",
        error,
        {
          providedFields: Object.keys(payload),
        }
      );
      throw error;
    }

    const tokenPayload = {
      userId,
      email,
      role,
    };

    const options = {
      expiresIn:
        process.env.JWT_EXPIRES_IN || SECURITY_CONFIG.JWT.DEFAULT_EXPIRES_IN,
      issuer: SECURITY_CONFIG.JWT.ISSUER,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, options);

    logger.logInfo(
      "auth",
      "token_generated",
      `JWT token generated for user ${userId}`,
      {
        userId,
        role,
        expiresIn: options.expiresIn,
      }
    );

    return token;
  } catch (error) {
    if (error instanceof JWTError) {
      throw error;
    }

    const jwtError = new JWTError(
      `Token generation failed: ${error.message}`,
      ERROR_CODES.SYSTEM_ERROR,
      error
    );
    logger.logSystemError("JWT token generation failed", error, {
      payload: Object.keys(payload),
    });
    throw jwtError;
  }
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    // Validate token format first
    const cleanToken = validateTokenFormat(token);

    // Verify JWT
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

    // Validate decoded payload has required fields
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new JWTError(
        "Token payload missing required fields",
        ERROR_CODES.INVALID_TOKEN
      );
    }

    logger.logInfo(
      "auth",
      "token_verified",
      `JWT token verified for user ${decoded.userId}`,
      {
        userId: decoded.userId,
        role: decoded.role,
      }
    );

    return decoded;
  } catch (error) {
    // Handle JWT library specific errors
    if (error.name === "TokenExpiredError") {
      const jwtError = new JWTError(
        "Token has expired",
        ERROR_CODES.TOKEN_EXPIRED,
        error
      );
      logger.logTokenExpired(null, { error: error.message });
      throw jwtError;
    } else if (error.name === "JsonWebTokenError") {
      const jwtError = new JWTError(
        "Invalid token signature or structure",
        ERROR_CODES.INVALID_TOKEN,
        error
      );
      logger.logInvalidToken("Invalid JWT signature or structure", {
        error: error.message,
      });
      throw jwtError;
    } else if (error.name === "NotBeforeError") {
      const jwtError = new JWTError(
        "Token not active yet",
        ERROR_CODES.INVALID_TOKEN,
        error
      );
      logger.logInvalidToken("Token not active yet", { error: error.message });
      throw jwtError;
    } else if (error instanceof JWTError) {
      // Re-throw our custom JWT errors
      throw error;
    } else {
      // Handle unexpected errors
      const jwtError = new JWTError(
        `Token verification failed: ${error.message}`,
        ERROR_CODES.SYSTEM_ERROR,
        error
      );
      logger.logSystemError("Unexpected JWT verification error", error);
      throw jwtError;
    }
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
