const { ERROR_CODES } = require("../utils/errorCodes");
const { logger } = require("../utils/logger");

/**
 * Global error handling middleware
 * Must be placed after all routes and middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error with context
  logger.logSystemError("Global error handler caught error", err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    requestId: req.requestId,
  });

  // Handle specific error types with standardized responses

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.error(
      ERROR_CODES.INVALID_INPUT_FORMAT,
      "Invalid resource ID format"
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return res.error(ERROR_CODES.VALIDATION_ERROR, message);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
      value: val.value,
    }));
    return res.validationError(validationErrors);
  }

  // JWT errors (these should be handled by auth middleware, but just in case)
  if (err.name === "JsonWebTokenError") {
    return res.authError(ERROR_CODES.INVALID_TOKEN);
  }

  if (err.name === "TokenExpiredError") {
    return res.authError(ERROR_CODES.TOKEN_EXPIRED);
  }

  // Custom JWT errors from our enhanced JWT utility
  if (err.name === "JWTError") {
    return res.authError(err.code, err.message);
  }

  // Database connection errors
  if (err.name === "MongoError" || err.name === "MongooseError") {
    return res.error(ERROR_CODES.DATABASE_ERROR, "Database operation failed");
  }

  // Default system error
  return res.systemError(err);
};

/**
 * Handle 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  logger.logInfo(
    "system",
    "route_not_found",
    `Route not found: ${req.method} ${req.originalUrl}`,
    {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      requestId: req.requestId,
    }
  );

  return res.notFound(`Route ${req.originalUrl}`);
};

module.exports = {
  errorHandler,
  notFound,
};
