/**
 * Standardized error codes for consistent API responses
 * These codes help clients handle different error scenarios appropriately
 */

const ERROR_CODES = {
  // Authentication errors (401)
  NO_TOKEN: "NO_TOKEN",
  INVALID_TOKEN_FORMAT: "INVALID_TOKEN_FORMAT",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Authorization errors (403)
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Validation errors (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELDS: "MISSING_REQUIRED_FIELDS",
  INVALID_INPUT_FORMAT: "INVALID_INPUT_FORMAT",

  // Resource errors (404)
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // System errors (500)
  SYSTEM_ERROR: "SYSTEM_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
};

/**
 * HTTP status codes mapping for error codes
 */
const ERROR_STATUS_CODES = {
  [ERROR_CODES.NO_TOKEN]: 401,
  [ERROR_CODES.INVALID_TOKEN_FORMAT]: 401,
  [ERROR_CODES.TOKEN_EXPIRED]: 401,
  [ERROR_CODES.INVALID_TOKEN]: 401,
  [ERROR_CODES.USER_NOT_FOUND]: 401,
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 403,
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.MISSING_REQUIRED_FIELDS]: 400,
  [ERROR_CODES.INVALID_INPUT_FORMAT]: 400,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.SYSTEM_ERROR]: 500,
  [ERROR_CODES.DATABASE_ERROR]: 500,
  [ERROR_CODES.CONFIGURATION_ERROR]: 500,
};

/**
 * User-friendly error messages for error codes
 */
const ERROR_MESSAGES = {
  [ERROR_CODES.NO_TOKEN]: "Access denied. Authentication token is required.",
  [ERROR_CODES.INVALID_TOKEN_FORMAT]: "Access denied. Invalid token format.",
  [ERROR_CODES.TOKEN_EXPIRED]: "Access denied. Token has expired.",
  [ERROR_CODES.INVALID_TOKEN]: "Access denied. Invalid token.",
  [ERROR_CODES.USER_NOT_FOUND]: "Access denied. User not found.",
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]:
    "Access denied. Insufficient permissions.",
  [ERROR_CODES.VALIDATION_ERROR]: "Validation failed. Please check your input.",
  [ERROR_CODES.MISSING_REQUIRED_FIELDS]: "Missing required fields.",
  [ERROR_CODES.INVALID_INPUT_FORMAT]: "Invalid input format.",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "Requested resource not found.",
  [ERROR_CODES.SYSTEM_ERROR]: "Internal server error. Please try again later.",
  [ERROR_CODES.DATABASE_ERROR]: "Database error. Please try again later.",
  [ERROR_CODES.CONFIGURATION_ERROR]: "System configuration error.",
};

module.exports = {
  ERROR_CODES,
  ERROR_STATUS_CODES,
  ERROR_MESSAGES,
};
