const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Import configuration and utilities
const { validateEnvironment } = require("./config/environment");
const { SecurityValidator } = require("./config/security");
const {
  addRequestId,
  addResponseMethods,
} = require("./utils/responseFormatter");
const { healthChecker } = require("./utils/healthCheck");
const { logger } = require("./utils/logger");

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const brandRoutes = require("./routes/brandRoutes");
const orderRoutes = require("./routes/orders");

// Import middleware
const { errorHandler, notFound } = require("./middleware/errorHandler");

// System ready state
let isSystemReady = false;

/**
 * Initialize the application with validation and configuration
 */
async function initializeApp() {
  try {
    logger.logInfo(
      "system",
      "app_init_start",
      "Starting application initialization"
    );

    // Step 1: Validate environment
    validateEnvironment();

    // Step 2: Perform startup validation
    await healthChecker.performStartupValidation();

    // Step 3: Mark system as ready
    isSystemReady = true;

    logger.logInfo(
      "system",
      "app_init_complete",
      "Application initialization completed successfully"
    );

    return true;
  } catch (error) {
    logger.logSystemError("Application initialization failed", error);

    // In production, we might want to exit the process
    if (process.env.NODE_ENV === "production") {
      logger.logSystemError(
        "Critical startup failure in production - exiting",
        error
      );
      process.exit(1);
    }

    throw error;
  }
}

// Create Express app
const app = express();

// System readiness check middleware
app.use((req, res, next) => {
  // Allow health check endpoint even when system is not ready
  if (req.path === "/health") {
    return next();
  }

  if (!isSystemReady) {
    return res.status(503).json({
      success: false,
      message: "System is not ready. Please try again later.",
      statusCode: 503,
      timestamp: new Date().toISOString(),
    });
  }

  next();
});

// Request tracking middleware
app.use(addRequestId);
app.use(addResponseMethods);

// Security middleware with enhanced configuration
app.use(helmet(SecurityValidator.getSecurityHeaders()));

// CORS configuration with security validation
app.use(cors(SecurityValidator.getCORSConfig()));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enhanced health check endpoint
app.get("/health", async (req, res) => {
  try {
    const healthStatus = await healthChecker.performHealthCheck();
    const systemStatus = healthChecker.getSystemStatus();

    const response = {
      success: true,
      message: "Health check completed",
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: systemStatus.uptime,
      ready: isSystemReady,
      components: healthStatus.components,
      statusCode:
        healthStatus.status === "healthy"
          ? 200
          : healthStatus.status === "degraded"
          ? 200
          : 503,
    };

    const statusCode = response.statusCode;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.logSystemError("Health check endpoint error", error);

    res.status(500).json({
      success: false,
      message: "Health check failed",
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      ready: false,
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
      statusCode: 500,
    });
  }
});

// API routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/brands", brandRoutes);
app.use("/orders", orderRoutes);

// Handle undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = { app, initializeApp };
