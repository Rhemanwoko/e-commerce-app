const { SECURITY_EVENTS } = require("../config/security");

/**
 * Structured logging utility with security-focused methods
 * Provides consistent logging format and ensures no sensitive data is exposed
 */
class SecurityLogger {
  constructor() {
    this.logLevels = {
      INFO: "info",
      WARN: "warn",
      ERROR: "error",
      CRITICAL: "critical",
    };
  }

  /**
   * Generate a structured log entry
   * @param {string} level - Log level (info, warn, error, critical)
   * @param {string} category - Log category (auth, security, system)
   * @param {string} event - Event type
   * @param {string} message - Human-readable message
   * @param {Object} context - Additional context (sanitized)
   */
  _createLogEntry(level, category, event, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      event,
      message,
      ...this._sanitizeContext(context),
    };

    return logEntry;
  }

  /**
   * Sanitize context to remove sensitive information
   * @param {Object} context - Context object to sanitize
   * @returns {Object} Sanitized context
   */
  _sanitizeContext(context) {
    const sanitized = { ...context };

    // Remove sensitive fields
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "authorization",
      "jwt",
    ];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = "[REDACTED]";
      }
    });

    // Truncate long values
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "string" && sanitized[key].length > 200) {
        sanitized[key] = sanitized[key].substring(0, 200) + "...[TRUNCATED]";
      }
    });

    return sanitized;
  }

  /**
   * Output log entry to console with appropriate formatting
   * @param {Object} logEntry - Structured log entry
   */
  _outputLog(logEntry) {
    const { level, timestamp, category, event, message, ...context } = logEntry;

    // Color coding for different log levels
    const colors = {
      info: "\x1b[36m", // Cyan
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
      critical: "\x1b[35m", // Magenta
    };

    const reset = "\x1b[0m";
    const color = colors[level] || "";

    // Format the log message
    const logMessage = `${color}[${timestamp}] ${level.toUpperCase()} ${category}:${event} - ${message}${reset}`;

    // Output based on log level
    if (level === "error" || level === "critical") {
      console.error(logMessage);
      if (Object.keys(context).length > 0) {
        console.error("Context:", JSON.stringify(context, null, 2));
      }
    } else if (level === "warn") {
      console.warn(logMessage);
      if (Object.keys(context).length > 0) {
        console.warn("Context:", JSON.stringify(context, null, 2));
      }
    } else {
      console.log(logMessage);
      if (Object.keys(context).length > 0) {
        console.log("Context:", JSON.stringify(context, null, 2));
      }
    }
  }

  /**
   * Log authentication failure events
   * @param {string} reason - Reason for failure
   * @param {Object} details - Additional details (will be sanitized)
   */
  logAuthFailure(reason, details = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.WARN,
      "auth",
      SECURITY_EVENTS.AUTH_FAILURE,
      `Authentication failed: ${reason}`,
      details
    );

    this._outputLog(logEntry);
  }

  /**
   * Log successful authentication events
   * @param {string} userId - User ID (not sensitive)
   * @param {string} role - User role
   * @param {Object} context - Additional context
   */
  logAuthSuccess(userId, role, context = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.INFO,
      "auth",
      SECURITY_EVENTS.AUTH_SUCCESS,
      `Authentication successful for user ${userId} with role ${role}`,
      { userId, role, ...context }
    );

    this._outputLog(logEntry);
  }

  /**
   * Log security warnings
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  logSecurityWarning(message, context = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.WARN,
      "security",
      SECURITY_EVENTS.SECURITY_WARNING,
      message,
      context
    );

    this._outputLog(logEntry);
  }

  /**
   * Log startup validation results
   * @param {Object} results - Validation results
   */
  logStartupValidation(results) {
    const level = results.success
      ? this.logLevels.INFO
      : this.logLevels.CRITICAL;
    const message = results.success
      ? "Startup validation completed successfully"
      : `Startup validation failed: ${results.error}`;

    const logEntry = this._createLogEntry(
      level,
      "system",
      SECURITY_EVENTS.STARTUP_VALIDATION,
      message,
      { validationResults: results }
    );

    this._outputLog(logEntry);
  }

  /**
   * Log token expiration events
   * @param {string} userId - User ID if available
   * @param {Object} context - Additional context
   */
  logTokenExpired(userId = null, context = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.WARN,
      "auth",
      SECURITY_EVENTS.TOKEN_EXPIRED,
      userId ? `Token expired for user ${userId}` : "Token expired",
      { userId, ...context }
    );

    this._outputLog(logEntry);
  }

  /**
   * Log invalid token events
   * @param {string} reason - Reason token is invalid
   * @param {Object} context - Additional context
   */
  logInvalidToken(reason, context = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.WARN,
      "auth",
      SECURITY_EVENTS.INVALID_TOKEN,
      `Invalid token: ${reason}`,
      context
    );

    this._outputLog(logEntry);
  }

  /**
   * Log unauthorized access attempts
   * @param {string} resource - Resource being accessed
   * @param {Object} context - Additional context
   */
  logUnauthorizedAccess(resource, context = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.WARN,
      "security",
      SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
      `Unauthorized access attempt to ${resource}`,
      { resource, ...context }
    );

    this._outputLog(logEntry);
  }

  /**
   * Log permission denied events
   * @param {string} userId - User ID
   * @param {string} requiredRole - Required role
   * @param {string} userRole - User's actual role
   * @param {Object} context - Additional context
   */
  logPermissionDenied(userId, requiredRole, userRole, context = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.WARN,
      "security",
      SECURITY_EVENTS.PERMISSION_DENIED,
      `Permission denied for user ${userId}: required ${requiredRole}, has ${userRole}`,
      { userId, requiredRole, userRole, ...context }
    );

    this._outputLog(logEntry);
  }

  /**
   * Log system errors
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logSystemError(message, error = null, context = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.ERROR,
      "system",
      "system_error",
      message,
      {
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack:
                process.env.NODE_ENV === "development"
                  ? error.stack
                  : "[REDACTED]",
            }
          : null,
        ...context,
      }
    );

    this._outputLog(logEntry);
  }

  /**
   * Log informational messages
   * @param {string} category - Log category
   * @param {string} event - Event type
   * @param {string} message - Message
   * @param {Object} context - Additional context
   */
  logInfo(category, event, message, context = {}) {
    const logEntry = this._createLogEntry(
      this.logLevels.INFO,
      category,
      event,
      message,
      context
    );

    this._outputLog(logEntry);
  }
}

// Create singleton instance
const logger = new SecurityLogger();

module.exports = {
  SecurityLogger,
  logger,
};
