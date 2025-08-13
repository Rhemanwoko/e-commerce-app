const mongoose = require("mongoose");
const { generateToken, verifyToken } = require("./jwt");
const { logger } = require("./logger");
const User = require("../models/User");

/**
 * Health check system for validating critical system components
 * Performs self-tests to ensure authentication and database systems are working
 */
class HealthChecker {
  constructor() {
    this.startTime = Date.now();
    this.systemStatus = {
      overall: "unknown",
      components: {
        authentication: "unknown",
        database: "unknown",
        jwt: "unknown",
      },
      lastCheck: null,
      uptime: 0,
    };
  }

  /**
   * Validate JWT system by generating and verifying a test token
   * @returns {Object} Validation result
   */
  async validateJWTSystem() {
    try {
      // Test token generation
      const testPayload = {
        userId: "test-user-id",
        email: "test@example.com",
        role: "admin",
      };

      const token = generateToken(testPayload);

      if (!token || typeof token !== "string") {
        throw new Error("Token generation failed - invalid token returned");
      }

      // Test token verification
      const decoded = verifyToken(`Bearer ${token}`);

      if (!decoded || decoded.userId !== testPayload.userId) {
        throw new Error("Token verification failed - invalid decoded payload");
      }

      logger.logInfo(
        "system",
        "jwt_health_check",
        "JWT system validation passed"
      );

      return {
        status: "healthy",
        message: "JWT system is working correctly",
        details: {
          tokenGeneration: "success",
          tokenVerification: "success",
        },
      };
    } catch (error) {
      logger.logSystemError("JWT system validation failed", error);

      return {
        status: "unhealthy",
        message: "JWT system validation failed",
        error: error.message,
        details: {
          tokenGeneration: error.message.includes("generation")
            ? "failed"
            : "unknown",
          tokenVerification: error.message.includes("verification")
            ? "failed"
            : "unknown",
        },
      };
    }
  }

  /**
   * Validate database connectivity
   * @returns {Object} Validation result
   */
  async validateDatabaseConnection() {
    try {
      // Check mongoose connection state
      const connectionState = mongoose.connection.readyState;
      const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      };

      if (connectionState !== 1) {
        throw new Error(
          `Database not connected. State: ${states[connectionState]}`
        );
      }

      // Test database operation
      await mongoose.connection.db.admin().ping();

      logger.logInfo(
        "system",
        "db_health_check",
        "Database connectivity validation passed"
      );

      return {
        status: "healthy",
        message: "Database connection is working correctly",
        details: {
          connectionState: states[connectionState],
          ping: "success",
        },
      };
    } catch (error) {
      logger.logSystemError("Database connectivity validation failed", error);

      return {
        status: "unhealthy",
        message: "Database connectivity validation failed",
        error: error.message,
        details: {
          connectionState: mongoose.connection.readyState,
          ping: "failed",
        },
      };
    }
  }

  /**
   * Validate User model operations
   * @returns {Object} Validation result
   */
  async validateUserModel() {
    try {
      // Test basic model operations without creating actual data
      const userCount = await User.countDocuments();

      // Verify model schema is accessible
      const userSchema = User.schema;
      if (!userSchema) {
        throw new Error("User model schema not accessible");
      }

      // Check required fields are defined
      const requiredFields = ["fullName", "email", "password", "role"];
      const schemaFields = Object.keys(userSchema.paths);

      const missingFields = requiredFields.filter(
        (field) => !schemaFields.includes(field)
      );
      if (missingFields.length > 0) {
        throw new Error(
          `User model missing required fields: ${missingFields.join(", ")}`
        );
      }

      logger.logInfo(
        "system",
        "user_model_health_check",
        "User model validation passed"
      );

      return {
        status: "healthy",
        message: "User model is working correctly",
        details: {
          documentCount: userCount,
          schemaFields: schemaFields.length,
          requiredFields: "present",
        },
      };
    } catch (error) {
      logger.logSystemError("User model validation failed", error);

      return {
        status: "unhealthy",
        message: "User model validation failed",
        error: error.message,
        details: {
          documentCount: "unknown",
          schemaFields: "unknown",
          requiredFields: "unknown",
        },
      };
    }
  }

  /**
   * Perform comprehensive system health check
   * @returns {Object} Complete system status
   */
  async performHealthCheck() {
    try {
      logger.logInfo(
        "system",
        "health_check_start",
        "Starting comprehensive health check"
      );

      // Run all validation checks
      const [jwtResult, dbResult, userModelResult] = await Promise.all([
        this.validateJWTSystem(),
        this.validateDatabaseConnection(),
        this.validateUserModel(),
      ]);

      // Update component statuses
      this.systemStatus.components.jwt = jwtResult.status;
      this.systemStatus.components.database = dbResult.status;
      this.systemStatus.components.authentication = userModelResult.status;

      // Determine overall system status
      const componentStatuses = Object.values(this.systemStatus.components);
      const unhealthyComponents = componentStatuses.filter(
        (status) => status === "unhealthy"
      );

      if (unhealthyComponents.length === 0) {
        this.systemStatus.overall = "healthy";
      } else if (unhealthyComponents.length === componentStatuses.length) {
        this.systemStatus.overall = "unhealthy";
      } else {
        this.systemStatus.overall = "degraded";
      }

      // Update metadata
      this.systemStatus.lastCheck = new Date().toISOString();
      this.systemStatus.uptime = Math.floor(
        (Date.now() - this.startTime) / 1000
      );

      const healthCheckResult = {
        status: this.systemStatus.overall,
        timestamp: this.systemStatus.lastCheck,
        uptime: this.systemStatus.uptime,
        components: {
          jwt: jwtResult,
          database: dbResult,
          authentication: userModelResult,
        },
      };

      logger.logInfo(
        "system",
        "health_check_complete",
        `Health check completed - Status: ${this.systemStatus.overall}`,
        {
          overall: this.systemStatus.overall,
          components: this.systemStatus.components,
        }
      );

      return healthCheckResult;
    } catch (error) {
      logger.logSystemError("Health check failed", error);

      this.systemStatus.overall = "unhealthy";
      this.systemStatus.lastCheck = new Date().toISOString();

      return {
        status: "unhealthy",
        timestamp: this.systemStatus.lastCheck,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        error: "Health check system failure",
        message: error.message,
      };
    }
  }

  /**
   * Get current system status without running new checks
   * @returns {Object} Current system status
   */
  getSystemStatus() {
    return {
      ...this.systemStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Check if system is ready to handle requests
   * @returns {boolean} True if system is ready
   */
  isSystemReady() {
    return (
      this.systemStatus.overall === "healthy" ||
      this.systemStatus.overall === "degraded"
    );
  }

  /**
   * Perform startup validation
   * @returns {Object} Startup validation result
   */
  async performStartupValidation() {
    try {
      logger.logInfo(
        "system",
        "startup_validation",
        "Starting system startup validation"
      );

      const healthResult = await this.performHealthCheck();

      if (healthResult.status === "unhealthy") {
        const error = new Error(
          "System startup validation failed - critical components unhealthy"
        );
        logger.logStartupValidation({
          success: false,
          error: error.message,
          details: healthResult,
        });
        throw error;
      }

      logger.logStartupValidation({
        success: true,
        status: healthResult.status,
        components: this.systemStatus.components,
      });

      return {
        success: true,
        status: healthResult.status,
        message: "System startup validation completed successfully",
        details: healthResult,
      };
    } catch (error) {
      logger.logStartupValidation({ success: false, error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const healthChecker = new HealthChecker();

module.exports = {
  HealthChecker,
  healthChecker,
};
