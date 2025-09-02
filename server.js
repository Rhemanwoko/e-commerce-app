const { app, initializeApp } = require("./src/app");
const { connectDB, disconnectDB } = require("./config/database");
const { logger } = require("./src/utils/logger");
const socketService = require("./src/services/socketService-fixed");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// Start server function with comprehensive validation
const startServer = async () => {
  try {
    logger.logInfo("system", "server_start", "Starting server initialization");

    // Step 1: Connect to database
    logger.logInfo("system", "db_connect", "Connecting to database...");
    await connectDB();
    logger.logInfo(
      "system",
      "db_connect_success",
      "Database connected successfully"
    );

    // Step 2: Initialize application (includes environment validation and health checks)
    logger.logInfo("system", "app_init", "Initializing application...");
    await initializeApp();
    logger.logInfo(
      "system",
      "app_init_success",
      "Application initialized successfully"
    );

    // Step 3: Start HTTP server
    const server = app.listen(PORT, () => {
      logger.logInfo(
        "system",
        "server_ready",
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
      logger.logInfo(
        "system",
        "server_ready",
        `📊 Health check available at: http://localhost:${PORT}/health`
      );
    });

    // Step 4: Initialize Socket.IO
    logger.logInfo("system", "socket_init", "Initializing Socket.IO...");
    try {
      socketService.initialize(server);
      logger.logInfo(
        "system",
        "socket_ready",
        "🔌 Socket.IO initialized for real-time notifications"
      );
    } catch (socketError) {
      logger.logSystemError("Socket.IO initialization failed", socketError);
      // Don't exit - continue without socket functionality
    }

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.logInfo(
        "system",
        "shutdown_start",
        `Received ${signal}. Starting graceful shutdown...`
      );

      server.close(async () => {
        logger.logInfo("system", "server_closed", "HTTP server closed");

        try {
          await disconnectDB();
          logger.logInfo("system", "db_closed", "Database connection closed");
          logger.logInfo(
            "system",
            "shutdown_complete",
            "Graceful shutdown completed"
          );
          process.exit(0);
        } catch (error) {
          logger.logSystemError("Error during database disconnection", error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.logSystemError(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.logSystemError("Uncaught Exception", error);
      gracefulShutdown("uncaughtException");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.logSystemError("Unhandled Rejection", new Error(reason), {
        promise: promise.toString(),
      });
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.logSystemError("Failed to start server", error);

    // If it's an environment validation error, provide helpful message
    if (
      error.message.includes("JWT_SECRET") ||
      error.message.includes("environment")
    ) {
      logger.logSystemError(
        "Environment configuration error. Please check your .env file"
      );
    }

    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
