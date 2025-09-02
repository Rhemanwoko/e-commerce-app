// Debug script to test socket service initialization
const socketService = require("./src/services/socketService");
const http = require("http");

console.log("🔍 SOCKET SERVICE INITIALIZATION DEBUG");
console.log("=".repeat(45));

console.log("\n1. Checking socket service before initialization...");
console.log(`   Socket service exists: ${!!socketService}`);
console.log(
  `   Socket service methods:`,
  Object.getOwnPropertyNames(socketService)
);
console.log(`   Socket service io property: ${socketService.io}`);
console.log(
  `   Socket service connectedUsers: ${
    socketService.connectedUsers?.size || "undefined"
  }`
);

console.log("\n2. Creating HTTP server...");
const server = http.createServer();
console.log(`   HTTP server created: ${!!server}`);

console.log("\n3. Initializing socket service...");
try {
  socketService.initialize(server);
  console.log(`   ✅ Socket service initialization completed`);
  console.log(
    `   Socket service io property after init: ${!!socketService.io}`
  );
  console.log(`   Socket service io type: ${typeof socketService.io}`);

  if (socketService.io) {
    console.log(`   Socket.io engine: ${!!socketService.io.engine}`);
    console.log(`   Socket.io sockets: ${!!socketService.io.sockets}`);
  }
} catch (error) {
  console.log(`   ❌ Socket service initialization failed: ${error.message}`);
  console.log(`   Error stack: ${error.stack}`);
}

console.log("\n4. Testing notification sending...");
const testResult = socketService.sendNotificationToUser("test-user", {
  title: "Test",
  message: "Test message",
});
console.log(`   Notification send result: ${testResult}`);

console.log("\n5. Final state check...");
console.log(`   Socket service io exists: ${!!socketService.io}`);
console.log(
  `   Connected users count: ${socketService.getConnectedUsersCount()}`
);

process.exit(0);
