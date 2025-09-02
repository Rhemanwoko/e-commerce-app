const axios = require("axios");
const io = require("socket.io-client");

const BASE_URL = "http://localhost:3000";
const SOCKET_TIMEOUT = 10000; // Increased timeout

// Generate unique test data
const timestamp = Date.now();
const testData = {
  customer: {
    fullName: "Test Customer",
    email: `customer${timestamp}@test.com`,
    password: "password123",
    role: "customer",
  },
  admin: {
    fullName: "Test Admin",
    email: `admin${timestamp}@test.com`,
    password: "password123",
    role: "admin",
  },
};

let tokens = { customer: null, admin: null };
let userIds = { customer: null, admin: null };
let testOrderId = null;

const makeRequest = async (method, endpoint, data = null, token = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  };

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        data: error.response.data,
        status: error.response.status,
        error: error.response.data.message || error.message,
      };
    }
    return { success: false, error: error.message, status: 0 };
  }
};

const debugSocketNotifications = async () => {
  console.log("🔌 DEBUG: Socket.io Notifications");
  console.log("=".repeat(40));

  try {
    // Setup users
    console.log("\\n1. Setting up test users...");

    // Register customer
    const customerRegResponse = await makeRequest(
      "POST",
      "/auth/register",
      testData.customer
    );
    if (!customerRegResponse.success) {
      throw new Error(
        `Customer registration failed: ${customerRegResponse.error}`
      );
    }
    tokens.customer = customerRegResponse.data.data.token;
    userIds.customer = customerRegResponse.data.data.user._id;
    console.log(
      `   ✅ Customer: ${testData.customer.email} (ID: ${userIds.customer})`
    );

    // Register admin
    const adminRegResponse = await makeRequest(
      "POST",
      "/auth/register",
      testData.admin
    );
    if (!adminRegResponse.success) {
      throw new Error(`Admin registration failed: ${adminRegResponse.error}`);
    }
    tokens.admin = adminRegResponse.data.data.token;
    userIds.admin = adminRegResponse.data.data.user._id;
    console.log(`   ✅ Admin: ${testData.admin.email} (ID: ${userIds.admin})`);

    // Create test order
    console.log("\\n2. Creating test order...");
    const productsResponse = await makeRequest("GET", "/products");
    if (
      !productsResponse.success ||
      !productsResponse.data.data.products.length
    ) {
      throw new Error("No products available");
    }

    const product = productsResponse.data.data.products[0];
    const orderData = {
      items: [
        {
          productName: product.productName,
          productId: product._id,
          ownerId: userIds.admin,
          quantity: 1,
          totalCost: product.cost || 50.0,
        },
      ],
    };

    const orderResponse = await makeRequest(
      "POST",
      "/orders",
      orderData,
      tokens.customer
    );
    if (!orderResponse.success) {
      throw new Error(`Order creation failed: ${orderResponse.error}`);
    }
    testOrderId = orderResponse.data.data.order._id;
    console.log(`   ✅ Order created: ${testOrderId}`);

    // Test socket notification
    console.log("\\n3. Testing socket notification...");

    return new Promise((resolve) => {
      let socket;
      let notificationReceived = false;
      let testCompleted = false;

      const completeTest = (success, message) => {
        if (testCompleted) return;
        testCompleted = true;

        if (socket) {
          socket.disconnect();
        }

        console.log(`   ${success ? "✅" : "❌"} ${message}`);
        resolve(success);
      };

      try {
        console.log("   🔗 Connecting customer to socket...");

        // Create socket connection with customer token
        socket = io(BASE_URL, {
          auth: { token: tokens.customer },
          transports: ["websocket"],
          timeout: SOCKET_TIMEOUT,
        });

        // Set up event listeners
        socket.on("connected", (data) => {
          console.log("   📡 Connected event received:", data);
        });

        socket.on("notification", (notification) => {
          console.log(
            "   📨 Notification received:",
            JSON.stringify(notification, null, 2)
          );

          // Validate notification structure
          if (!notification.title || !notification.message) {
            completeTest(false, "Notification missing required fields");
            return;
          }

          // Validate notification content
          if (notification.title !== "New shipping status") {
            completeTest(
              false,
              `Expected title 'New shipping status', got '${notification.title}'`
            );
            return;
          }

          const expectedMessagePattern =
            /Your last order shipping status has been updated to \w+/;
          if (!expectedMessagePattern.test(notification.message)) {
            completeTest(
              false,
              `Notification message format incorrect: ${notification.message}`
            );
            return;
          }

          notificationReceived = true;
          completeTest(
            true,
            "Socket notification received with correct format"
          );
        });

        socket.on("connect", async () => {
          console.log("   🔗 Socket connected successfully");

          // Wait a moment for connection to stabilize
          setTimeout(async () => {
            try {
              console.log(
                "   📤 Updating order status to trigger notification..."
              );

              // Update order status to trigger notification
              const statusUpdateResponse = await makeRequest(
                "PUT",
                `/orders/${testOrderId}/status`,
                { shippingStatus: "shipped" },
                tokens.admin
              );

              if (!statusUpdateResponse.success) {
                completeTest(
                  false,
                  `Order status update failed: ${statusUpdateResponse.error}`
                );
                return;
              }

              console.log("   ✅ Order status updated successfully");
              console.log("   ⏳ Waiting for notification...");

              // Wait for notification
              setTimeout(() => {
                if (!notificationReceived && !testCompleted) {
                  completeTest(
                    false,
                    "No notification received within timeout period"
                  );
                }
              }, SOCKET_TIMEOUT);
            } catch (error) {
              completeTest(
                false,
                `Error during status update: ${error.message}`
              );
            }
          }, 2000); // Increased wait time
        });

        socket.on("connect_error", (error) => {
          console.log("   ❌ Socket connection error:", error.message);
          completeTest(false, `Socket connection error: ${error.message}`);
        });

        socket.on("disconnect", (reason) => {
          console.log(`   🔌 Socket disconnected: ${reason}`);
        });

        socket.on("error", (error) => {
          console.log("   ❌ Socket error:", error);
          completeTest(false, `Socket error: ${error}`);
        });

        // Overall timeout
        setTimeout(() => {
          if (!testCompleted) {
            completeTest(false, "Socket notification test timed out");
          }
        }, SOCKET_TIMEOUT + 5000);
      } catch (error) {
        completeTest(false, `Socket test setup failed: ${error.message}`);
      }
    });
  } catch (error) {
    console.error(`\\n💥 Debug failed: ${error.message}`);
    return false;
  }
};

const runDebug = async () => {
  const success = await debugSocketNotifications();

  console.log("\\n" + "=".repeat(40));
  console.log("📊 SOCKET DEBUG SUMMARY");
  console.log("=".repeat(40));

  if (success) {
    console.log("✅ SOCKET NOTIFICATIONS WORKING CORRECTLY");
  } else {
    console.log("❌ SOCKET NOTIFICATIONS FAILED");
  }

  process.exit(success ? 0 : 1);
};

runDebug();
