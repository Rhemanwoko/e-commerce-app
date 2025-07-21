const app = require('./src/app');
const { connectDB, disconnectDB } = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Start server function
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed.');
        
        try {
          await disconnectDB();
          console.log('Database connection closed.');
          process.exit(0);
        } catch (error) {
          console.error('Error during database disconnection:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };