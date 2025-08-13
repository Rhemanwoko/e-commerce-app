const { v4: uuidv4 } = require("uuid");
const { ERROR_STATUS_CODES, ERROR_MESSAGES } = require("./errorCodes");
const { logger } = require("./logger");

/**
 * Utility for creating standardized API responses
 * Ensures consistent response format across all endpoints
 */
class ResponseFormatter {
  /**
   * Create a success response
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @param {string} requestId - Request ID for tracking
   */
  static success(
    res,
    data = null,
    message = "Success",
    statusCode = 200,
    requestId = null
  ) {
    const response = {
      success: true,
      message,
      data,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (requestId) {
      response.requestId = requestId;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Create an error response with standardized format
   * @param {Object} res - Express response object
   * @param {string} errorCode - Standardized error code
   * @param {string} customMessage - Custom error message (optional)
   * @param {Array} validationErrors - Validation errors array (optional)
   * @param {string} requestId - Request ID for tracking
   */
  static error(
    res,
    errorCode,
    customMessage = null,
    validationErrors = null,
    requestId = null
  ) {
    const statusCode = ERROR_STATUS_CODES[errorCode] || 500;
    const message =
      customMessage || ERROR_MESSAGES[errorCode] || "An error occurred";

    const response = {
      success: false,
      message,
      errorCode,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (validationErrors && validationErrors.length > 0) {
      response.errors = validationErrors;
    }

    if (requestId) {
      response.requestId = requestId;
    }

    // Log error for monitoring (without sensitive data)
    logger.logSystemError(`API Error: ${errorCode}`, null, {
      errorCode,
      statusCode,
      requestId,
      hasValidationErrors: !!validationErrors,
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Create a validation error response
   * @param {Object} res - Express response object
   * @param {Array} validationErrors - Array of validation errors
   * @param {string} requestId - Request ID for tracking
   */
  static validationError(res, validationErrors, requestId = null) {
    return this.error(
      res,
      "VALIDATION_ERROR",
      "Validation failed",
      validationErrors,
      requestId
    );
  }

  /**
   * Create an authentication error response
   * @param {Object} res - Express response object
   * @param {string} errorCode - Authentication error code
   * @param {string} customMessage - Custom message (optional)
   * @param {string} requestId - Request ID for tracking
   */
  static authError(res, errorCode, customMessage = null, requestId = null) {
    // Log authentication failure
    logger.logAuthFailure(errorCode, { requestId });

    return this.error(res, errorCode, customMessage, null, requestId);
  }

  /**
   * Create an authorization error response
   * @param {Object} res - Express response object
   * @param {string} userId - User ID attempting access
   * @param {string} requiredRole - Required role
   * @param {string} userRole - User's actual role
   * @param {string} requestId - Request ID for tracking
   */
  static authorizationError(
    res,
    userId,
    requiredRole,
    userRole,
    requestId = null
  ) {
    // Log permission denied
    logger.logPermissionDenied(userId, requiredRole, userRole, { requestId });

    return this.error(res, "INSUFFICIENT_PERMISSIONS", null, null, requestId);
  }

  /**
   * Create a not found error response
   * @param {Object} res - Express response object
   * @param {string} resource - Resource that was not found
   * @param {string} requestId - Request ID for tracking
   */
  static notFound(res, resource = "Resource", requestId = null) {
    return this.error(
      res,
      "RESOURCE_NOT_FOUND",
      `${resource} not found`,
      null,
      requestId
    );
  }

  /**
   * Create a system error response
   * @param {Object} res - Express response object
   * @param {Error} error - Original error object
   * @param {string} requestId - Request ID for tracking
   */
  static systemError(res, error = null, requestId = null) {
    // Log system error with details
    if (error) {
      logger.logSystemError("System error occurred", error, { requestId });
    }

    // Don't expose internal error details in production
    const message =
      process.env.NODE_ENV === "development" && error
        ? `System error: ${error.message}`
        : "Internal server error. Please try again later.";

    return this.error(res, "SYSTEM_ERROR", message, null, requestId);
  }
}

/**
 * Middleware to add request ID to all requests
 * This helps with error tracking and debugging
 */
const addRequestId = (req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-ID", req.requestId);
  next();
};

/**
 * Middleware to add response formatter methods to res object
 * This makes it easier to use standardized responses in controllers
 */
const addResponseMethods = (req, res, next) => {
  const requestId = req.requestId;

  // Add convenience methods to response object
  res.success = (data, message, statusCode) =>
    ResponseFormatter.success(res, data, message, statusCode, requestId);

  res.error = (errorCode, customMessage, validationErrors) =>
    ResponseFormatter.error(
      res,
      errorCode,
      customMessage,
      validationErrors,
      requestId
    );

  res.validationError = (validationErrors) =>
    ResponseFormatter.validationError(res, validationErrors, requestId);

  res.authError = (errorCode, customMessage) =>
    ResponseFormatter.authError(res, errorCode, customMessage, requestId);

  res.authorizationError = (userId, requiredRole, userRole) =>
    ResponseFormatter.authorizationError(
      res,
      userId,
      requiredRole,
      userRole,
      requestId
    );

  res.notFound = (resource) =>
    ResponseFormatter.notFound(res, resource, requestId);

  res.systemError = (error) =>
    ResponseFormatter.systemError(res, error, requestId);

  next();
};

module.exports = {
  ResponseFormatter,
  addRequestId,
  addResponseMethods,
};
