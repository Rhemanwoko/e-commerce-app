const axios = require("axios");
const io = require("socket.io-client");

const BASE_URL = "http://localhost:3000";

const testSocketConnection = async () => {
  console.log("🔌 SOCKET CONNECTION TEST");
  console.log("=".repeat(30));

  try {
    // Register a user
    const timestamp = Date.now();
    const userData = {
      fullName: "Test User",
      email: `user${timestamp}@test.com`,
      password: "password123",
      role: "customer",
    };

    console.log("\\n1. Registering user...");
    const regResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
    const token = regResponse.data.data.token;
    const userId = regResponse.data.data.user._id;

    console.log(`   ✅ User registered: ${userId}`);

    // Test socket connection
    console.log("\\n2. Testing socket connection...");

    return new Promise((resolve) => {
      const socket = io(BASE_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      let connectionReceived = false;

      socket.on("connect", () => {
        console.log("   ✅ Socket connected");
        console.log(`   📋 Socket ID: ${socket.id}`);
      });

      socket.on("connected", (data) => {
        console.log("   📨 Connected event received:");
        console.log(`   👤 User ID: ${data.userId || "not provided"}`);
        console.log(`   👤 Role: ${data.role}`);
        console.log(`   📋 Message: ${data.message}`);

        connectionReceived = true;

        // Test sending a custom event to see if the socket is working
        console.log("\\n3. Testing custom event...");
        socket.emit("test", { message: "Hello from client" });

        setTimeout(() => {
          socket.disconnect();
          resolve(true);
        }, 2000);
      });

      socket.on("connect_error", (error) => {
        console.log("   ❌ Connection error:", error.message);
        resolve(false);
      });

      socket.on("disconnect", (reason) => {
        console.log(`   🔌 Disconnected: ${reason}`);
        if (!connectionReceived) {
          resolve(false);
        }
      });

      // Timeout
      setTimeout(() => {
        if (!connectionReceived) {
          console.log("   ⏰ Connection test timed out");
          socket.disconnect();
          resolve(false);
        }
      }, 10000);
    });
  } catch (error) {
    console.error(`\\n💥 Test failed: ${error.message}`);
    return false;
  }
};

const runTest = async () => {
  const success = await testSocketConnection();

  console.log("\\n" + "=".repeat(30));
  if (success) {
    console.log("✅ SOCKET CONNECTION WORKING!");
  } else {
    console.log("❌ SOCKET CONNECTION FAILED!");
  }

  process.exit(success ? 0 : 1);
};

runTest();
