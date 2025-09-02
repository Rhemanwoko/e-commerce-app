const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { logger } = require("../utils/logger");

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.isInitialized = false;
    console.log(
      "🚀 SOCKET SERVICE: Constructor called - creating new instance"
    );
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server) {
    console.log("🚀 SOCKET SERVICE: Initialize method called");
    console.log("🚀 SOCKET SERVICE: Server object exists:", !!server);
    console.log("🚀 SOCKET SERVICE: Current io state:", this.io);

    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    console.log("🚀 SOCKET SERVICE: Socket.io server created:", !!this.io);
    console.log("🚀 SOCKET SERVICE: Socket.io server type:", typeof this.io);

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        console.log("🔐 SOCKET AUTH DEBUG: Authentication middleware called");
        console.log(
          "🔐 SOCKET AUTH DEBUG: Socket handshake auth:",
          socket.handshake.auth
        );
        console.log(
          "🔐 SOCKET AUTH DEBUG: Socket handshake headers:",
          socket.handshake.headers
        );
        console.log(
          "🔐 SOCKET AUTH DEBUG: Authorization header:",
          socket.handshake.headers.authorization
        );

        // Try multiple ways to extract the token
        let token = null;

        // Method 1: From auth object
        if (socket.handshake.auth && socket.handshake.auth.token) {
          token = socket.handshake.auth.token;
          console.log("🔐 SOCKET AUTH DEBUG: Token found in auth.token");
        }

        // Method 2: From Authorization header
        if (!token && socket.handshake.headers.authorization) {
          const authHeader = socket.handshake.headers.authorization;
          if (authHeader.startsWith("Bearer ")) {
            token = authHeader.replace("Bearer ", "");
            console.log(
              "🔐 SOCKET AUTH DEBUG: Token found in Authorization header"
            );
          }
        }

        // Method 3: From query parameters (fallback)
        if (!token && socket.handshake.query && socket.handshake.query.token) {
          token = socket.handshake.query.token;
          console.log("🔐 SOCKET AUTH DEBUG: Token found in query.token");
        }

        console.log(
          "🔐 SOCKET AUTH DEBUG: Token extracted:",
          token ? `${token.substring(0, 20)}...` : "NO TOKEN"
        );

        if (!token) {
          console.log("🔐 SOCKET AUTH DEBUG: No token provided - FAILING AUTH");
          return next(new Error("Authentication token required"));
        }

        console.log(
          "🔐 SOCKET AUTH DEBUG: JWT_SECRET available:",
          !!process.env.JWT_SECRET
        );
        console.log(
          "🔐 SOCKET AUTH DEBUG: JWT_SECRET length:",
          process.env.JWT_SECRET?.length || 0
        );

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("🔐 SOCKET AUTH DEBUG: Token decoded successfully");
        console.log(
          "🔐 SOCKET AUTH DEBUG: Decoded payload:",
          JSON.stringify(decoded, null, 2)
        );

        socket.userId = decoded.userId || decoded.id; // Support both field names
        socket.userRole = decoded.role;

        console.log(
          "🔐 SOCKET AUTH DEBUG: Socket userId set to:",
          socket.userId
        );
        console.log(
          "🔐 SOCKET AUTH DEBUG: Socket userRole set to:",
          socket.userRole
        );

        if (!socket.userId) {
          console.log("🔐 SOCKET AUTH DEBUG: WARNING - userId is undefined!");
          return next(new Error("User ID not found in token"));
        }

        logger.logInfo(
          decoded.userId || decoded.id,
          "socket_auth_success",
          "Socket authentication successful"
        );

        console.log("🔐 SOCKET AUTH DEBUG: Calling next() - auth successful");
        next();
      } catch (error) {
        console.log(
          "🔐 SOCKET AUTH DEBUG: Authentication failed:",
          error.message
        );
        console.log("🔐 SOCKET AUTH DEBUG: Error stack:", error.stack);
        logger.logSystemError("Socket authentication failed", error);
        next(new Error("Authentication failed"));
      }
    });

    // Handle socket connections
    this.io.on("connection", (socket) => {
      const userId = socket.userId;
      const userRole = socket.userRole;

      console.log("🔗 SOCKET CONNECTION DEBUG: New connection");
      console.log("🔗 SOCKET CONNECTION DEBUG: userId from socket:", userId);
      console.log(
        "🔗 SOCKET CONNECTION DEBUG: userRole from socket:",
        userRole
      );

      // Store user connection
      this.connectedUsers.set(userId, socket.id);

      logger.logInfo(userId, "socket_connected", `User connected via socket`, {
        socketId: socket.id,
        role: userRole,
      });

      // Join user to their personal room
      console.log(`🔗 SOCKET CONNECTION DEBUG: Joining room: user_${userId}`);
      socket.join(`user_${userId}`);

      // Handle disconnection
      socket.on("disconnect", () => {
        this.connectedUsers.delete(userId);
        logger.logInfo(
          userId,
          "socket_disconnected",
          "User disconnected from socket",
          { socketId: socket.id }
        );
      });

      // Send welcome message
      socket.emit("connected", {
        message: "Successfully connected to notification service",
        userId: userId,
        role: userRole,
      });
    });

    this.isInitialized = true;
    console.log("🚀 SOCKET SERVICE: Initialization completed successfully");
    console.log("🚀 SOCKET SERVICE: Final io state:", !!this.io);
    console.log(
      "🚀 SOCKET SERVICE: Connected users map initialized:",
      !!this.connectedUsers
    );
    console.log(
      "🚀 SOCKET SERVICE: isInitialized flag set to:",
      this.isInitialized
    );

    logger.logInfo(
      "system",
      "socket_initialized",
      "Socket.IO service initialized successfully"
    );
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(userId, notification) {
    try {
      console.log(
        `🔔 DEBUG: sendNotificationToUser called with userId: ${userId}`
      );
      console.log(`🔔 DEBUG: Socket service io state: ${this.io}`);
      console.log(`🔔 DEBUG: Socket service io type: ${typeof this.io}`);
      console.log(`🔔 DEBUG: Socket service io exists: ${!!this.io}`);
      console.log(
        `🔔 DEBUG: Socket service isInitialized: ${this.isInitialized}`
      );

      if (!this.io || !this.isInitialized) {
        console.log(
          `🔔 DEBUG: Socket.IO not initialized - this.io is: ${this.io}`
        );
        console.log(
          `🔔 DEBUG: Socket service isInitialized: ${this.isInitialized}`
        );
        console.log(`🔔 DEBUG: Socket service object:`, Object.keys(this));
        logger.logError(
          "system",
          "socket_not_initialized",
          "Socket.IO not initialized"
        );
        return false;
      }

      console.log(`🔔 DEBUG: Sending to room: user_${userId}`);
      console.log(`🔔 DEBUG: Connected users map:`, this.connectedUsers);

      // Send to user's personal room
      this.io.to(`user_${userId}`).emit("notification", notification);

      logger.logInfo(userId, "notification_sent", "Notification sent to user", {
        notification,
      });

      console.log(`🔔 DEBUG: Notification emitted successfully`);
      return true;
    } catch (error) {
      console.log(`🔔 DEBUG: Error sending notification:`, error);
      logger.logError(
        userId,
        "notification_error",
        "Failed to send notification",
        error
      );
      return false;
    }
  }

  /**
   * Send order status update notification
   */
  sendOrderStatusNotification(customerId, newStatus) {
    console.log(
      `🔔 DEBUG: sendOrderStatusNotification called for customer ${customerId}`
    );
    console.log(`🔔 DEBUG: Service status:`, this.getStatus());
    console.log(
      `🔔 DEBUG: Connected users:`,
      Array.from(this.connectedUsers.keys())
    );
    console.log(
      `🔔 DEBUG: Is customer connected?`,
      this.isUserConnected(customerId)
    );

    // If socket service is not ready, log the issue but don't fail
    if (!this.isReady()) {
      console.log(
        `🔔 DEBUG: Socket service not ready - cannot send notification`
      );
      console.log(
        `🔔 DEBUG: isInitialized: ${this.isInitialized}, io exists: ${!!this
          .io}`
      );

      // Log this as a warning but don't throw an error
      logger.logError(
        "system",
        "socket_service_not_ready",
        "Socket service not ready for notification",
        {
          customerId,
          newStatus,
          isInitialized: this.isInitialized,
          ioExists: !!this.io,
        }
      );

      return false;
    }

    const notification = {
      title: "New shipping status",
      message: `Your last order shipping status has been updated to ${newStatus}`,
      type: "order_status_update",
      status: newStatus,
      timestamp: new Date().toISOString(),
    };

    console.log(`🔔 DEBUG: Notification payload:`, notification);
    const result = this.sendNotificationToUser(customerId, notification);
    console.log(`🔔 DEBUG: Notification send result:`, result);

    return result;
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

// Export singleton instance
const socketService = new SocketService();

// Add a method to check if the service is ready
socketService.isReady = function () {
  return this.isInitialized && !!this.io;
};

// Add a method to get status for debugging
socketService.getStatus = function () {
  return {
    isInitialized: this.isInitialized,
    ioExists: !!this.io,
    ioType: typeof this.io,
    connectedUsersCount: this.connectedUsers?.size || 0,
    connectedUsers: Array.from(this.connectedUsers?.keys() || []),
  };
};

console.log("🚀 SOCKET SERVICE: Module loaded, singleton created");

module.exports = socketService;
