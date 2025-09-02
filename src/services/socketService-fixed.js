const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { logger } = require("../utils/logger");

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.isInitialized = false;
    console.log("🚀 SOCKET SERVICE FIXED: Constructor called");
  }

  initialize(server) {
    console.log("🚀 SOCKET SERVICE FIXED: Initialize called");

    if (this.isInitialized) {
      console.log("🚀 SOCKET SERVICE FIXED: Already initialized");
      return;
    }

    try {
      this.io = new Server(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
          credentials: true,
        },
      });

      console.log("🚀 SOCKET SERVICE FIXED: Socket.IO server created");

      // Simple authentication middleware
      this.io.use(async (socket, next) => {
        try {
          const token =
            socket.handshake.auth.token ||
            socket.handshake.headers.authorization?.replace("Bearer ", "");

          if (!token) {
            return next(new Error("Authentication token required"));
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.userId || decoded.id;
          socket.userRole = decoded.role;

          console.log(
            `🚀 SOCKET SERVICE FIXED: User authenticated: ${socket.userId}`
          );
          next();
        } catch (error) {
          console.log(`🚀 SOCKET SERVICE FIXED: Auth failed: ${error.message}`);
          next(new Error("Authentication failed"));
        }
      });

      // Handle connections
      this.io.on("connection", (socket) => {
        const userId = socket.userId;
        const userRole = socket.userRole;

        console.log(`🚀 SOCKET SERVICE FIXED: User connected: ${userId}`);

        this.connectedUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);

        socket.emit("connected", {
          message: "Successfully connected to notification service",
          userId: userId,
          role: userRole,
        });

        socket.on("disconnect", () => {
          this.connectedUsers.delete(userId);
          console.log(`🚀 SOCKET SERVICE FIXED: User disconnected: ${userId}`);
        });
      });

      this.isInitialized = true;
      console.log("🚀 SOCKET SERVICE FIXED: Initialization completed");
    } catch (error) {
      console.log("🚀 SOCKET SERVICE FIXED: Initialization failed:", error);
      throw error;
    }
  }

  sendNotificationToUser(userId, notification) {
    console.log(`🚀 SOCKET SERVICE FIXED: Sending notification to ${userId}`);

    if (!this.io || !this.isInitialized) {
      console.log("🚀 SOCKET SERVICE FIXED: Service not ready");
      return false;
    }

    try {
      this.io.to(`user_${userId}`).emit("notification", notification);
      console.log("🚀 SOCKET SERVICE FIXED: Notification sent successfully");
      return true;
    } catch (error) {
      console.log(
        "🚀 SOCKET SERVICE FIXED: Error sending notification:",
        error
      );
      return false;
    }
  }

  sendOrderStatusNotification(customerId, newStatus) {
    console.log(
      `🚀 SOCKET SERVICE FIXED: Sending order notification to ${customerId}`
    );

    const notification = {
      title: "New shipping status",
      message: `Your last order shipping status has been updated to ${newStatus}`,
      type: "order_status_update",
      status: newStatus,
      timestamp: new Date().toISOString(),
    };

    return this.sendNotificationToUser(customerId, notification);
  }

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      ioExists: !!this.io,
      connectedUsersCount: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.keys()),
    };
  }

  isReady() {
    return this.isInitialized && !!this.io;
  }
}

// Export singleton instance
const socketService = new SocketService();
console.log("🚀 SOCKET SERVICE FIXED: Module loaded, singleton created");

module.exports = socketService;
