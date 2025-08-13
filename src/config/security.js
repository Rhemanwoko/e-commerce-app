/**
 * Security configuration and constants
 * Centralizes security-related settings and validation rules
 */

const SECURITY_CONFIG = {
  // JWT Configuration
  JWT: {
    MIN_SECRET_LENGTH: 32,
    RECOMMENDED_SECRET_LENGTH: 64,
    DEFAULT_EXPIRES_IN: "24h",
    ISSUER: "ecommerce-api",
  },

  // Password Requirements (for future use)
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
  },

  // Rate Limiting (for future implementation)
  RATE_LIMITING: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    AUTH_ATTEMPTS: 5,
  },

  // CORS Settings
  CORS: {
    DEFAULT_ORIGINS: ["http://localhost:3000", "http://localhost:3001"],
    CREDENTIALS: true,
  },

  // Security Headers
  HEADERS: {
    CONTENT_SECURITY_POLICY: false, // Disabled for API
    HSTS_MAX_AGE: 31536000, // 1 year
    NO_SNIFF: true,
    FRAME_OPTIONS: "DENY",
  },
};

/**
 * Security validation utilities
 */
class SecurityValidator {
  /**
   * Validate JWT secret strength
   * @param {string} secret - JWT secret to validate
   * @returns {Object} Validation result with warnings
   */
  static validateJWTSecret(secret) {
    const result = {
      valid: true,
      warnings: [],
      errors: [],
    };

    if (!secret) {
      result.valid = false;
      result.errors.push("JWT secret is required");
      return result;
    }

    if (secret.length < SECURITY_CONFIG.JWT.MIN_SECRET_LENGTH) {
      result.valid = false;
      result.errors.push(
        `JWT secret must be at least ${SECURITY_CONFIG.JWT.MIN_SECRET_LENGTH} characters`
      );
    }

    if (secret.length < SECURITY_CONFIG.JWT.RECOMMENDED_SECRET_LENGTH) {
      result.warnings.push(
        `JWT secret should be at least ${SECURITY_CONFIG.JWT.RECOMMENDED_SECRET_LENGTH} characters for optimal security`
      );
    }

    // Check for common weak patterns
    const weakPatterns = [
      /^(password|secret|key|token)/i,
      /^(123|abc|test)/i,
      /(.)\1{3,}/, // Repeated characters
    ];

    weakPatterns.forEach((pattern) => {
      if (pattern.test(secret)) {
        result.warnings.push("JWT secret appears to use a weak pattern");
      }
    });

    return result;
  }

  /**
   * Get security headers configuration
   * @returns {Object} Helmet configuration object
   */
  static getSecurityHeaders() {
    return {
      contentSecurityPolicy: SECURITY_CONFIG.HEADERS.CONTENT_SECURITY_POLICY,
      hsts: {
        maxAge: SECURITY_CONFIG.HEADERS.HSTS_MAX_AGE,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: SECURITY_CONFIG.HEADERS.NO_SNIFF,
      frameguard: {
        action: SECURITY_CONFIG.HEADERS.FRAME_OPTIONS.toLowerCase(),
      },
    };
  }

  /**
   * Get CORS configuration
   * @returns {Object} CORS configuration object
   */
  static getCORSConfig() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      : SECURITY_CONFIG.CORS.DEFAULT_ORIGINS;

    return {
      origin: process.env.NODE_ENV === "production" ? allowedOrigins : true,
      credentials: SECURITY_CONFIG.CORS.CREDENTIALS,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    };
  }
}

/**
 * Security event types for logging
 */
const SECURITY_EVENTS = {
  AUTH_SUCCESS: "auth_success",
  AUTH_FAILURE: "auth_failure",
  TOKEN_EXPIRED: "token_expired",
  INVALID_TOKEN: "invalid_token",
  UNAUTHORIZED_ACCESS: "unauthorized_access",
  PERMISSION_DENIED: "permission_denied",
  STARTUP_VALIDATION: "startup_validation",
  SECURITY_WARNING: "security_warning",
};

/**
 * Error codes for standardized responses
 */
const ERROR_CODES = {
  // Authentication errors
  NO_TOKEN: "NO_TOKEN",
  INVALID_TOKEN_FORMAT: "INVALID_TOKEN_FORMAT",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Authorization errors
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // System errors
  SYSTEM_ERROR: "SYSTEM_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
};

module.exports = {
  SECURITY_CONFIG,
  SecurityValidator,
  SECURITY_EVENTS,
  ERROR_CODES,
};
