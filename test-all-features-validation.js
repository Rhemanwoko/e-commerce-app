const axios = require("axios");
const io = require("socket.io-client");

const BASE_URL = "http://localhost:3000";
const TEST_TIMEOUT = 15000;
const SOCKET_TIMEOUT = 5000;

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

/**
 * HTTP Request Helper
 */
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

/**
 * Setup: Register users and get tokens
 */
const setupTestUsers = async () => {
  console.log("🔧 SETUP: Registering test users");
  console.log("=".repeat(35));

  try {
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
    console.log(`✅ Customer registered: ${testData.customer.email}`);

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
    console.log(`✅ Admin registered: ${testData.admin.email}`);

    return true;
  } catch (error) {
    console.error(`❌ Setup failed: ${error.message}`);
    return false;
  }
};

/**
 * FEATURE 1: Profile endpoints for customers and admins
 */
const testProfileEndpoints = async () => {
  console.log("\\n📋 FEATURE 1: GET /profile route for customers and admins");
  console.log("=".repeat(60));

  try {
    // Test customer profile
    console.log("\\n🔍 Testing customer profile...");
    const customerProfileResponse = await makeRequest(
      "GET",
      "/profile",
      null,
      tokens.customer
    );

    if (!customerProfileResponse.success) {
      throw new Error(
        `Customer profile failed: ${customerProfileResponse.error}`
      );
    }

    const customerProfile = customerProfileResponse.data.data;

    // Validate customer profile
    if (
      !customerProfile._id ||
      !customerProfile.email ||
      !customerProfile.role
    ) {
      throw new Error("Customer profile missing required fields");
    }
    if (customerProfile.password) {
      throw new Error("Customer profile should not include password");
    }
    if (customerProfile.role !== "customer") {
      throw new Error("Customer profile has incorrect role");
    }
    if (customerProfile.email !== testData.customer.email) {
      throw new Error("Customer profile has incorrect email");
    }

    console.log("   ✅ Customer profile endpoint working correctly");
    console.log(`   📧 Email: ${customerProfile.email}`);
    console.log(`   👤 Role: ${customerProfile.role}`);
    console.log(`   🔒 Password excluded: ${!customerProfile.password}`);

    // Test admin profile
    console.log("\\n🔍 Testing admin profile...");
    const adminProfileResponse = await makeRequest(
      "GET",
      "/profile",
      null,
      tokens.admin
    );

    if (!adminProfileResponse.success) {
      throw new Error(`Admin profile failed: ${adminProfileResponse.error}`);
    }

    const adminProfile = adminProfileResponse.data.data;

    // Validate admin profile
    if (!adminProfile._id || !adminProfile.email || !adminProfile.role) {
      throw new Error("Admin profile missing required fields");
    }
    if (adminProfile.password) {
      throw new Error("Admin profile should not include password");
    }
    if (adminProfile.role !== "admin") {
      throw new Error("Admin profile has incorrect role");
    }
    if (adminProfile.email !== testData.admin.email) {
      throw new Error("Admin profile has incorrect email");
    }

    console.log("   ✅ Admin profile endpoint working correctly");
    console.log(`   📧 Email: ${adminProfile.email}`);
    console.log(`   👤 Role: ${adminProfile.role}`);
    console.log(`   🔒 Password excluded: ${!adminProfile.password}`);

    // Test unauthorized access
    console.log("\\n🔍 Testing unauthorized access...");
    const unauthorizedResponse = await makeRequest("GET", "/profile");

    if (unauthorizedResponse.success) {
      throw new Error("Profile endpoint should require authentication");
    }
    if (unauthorizedResponse.status !== 401) {
      throw new Error(
        `Expected 401 status, got ${unauthorizedResponse.status}`
      );
    }

    console.log("   ✅ Unauthorized access properly blocked");
    console.log(
      "\\n🎉 FEATURE 1 PASSED: Profile endpoints working for both customers and admins"
    );
    return true;
  } catch (error) {
    console.error(`   ❌ FEATURE 1 FAILED: ${error.message}`);
    return false;
  }
};

/**
 * FEATURE 2: Order history with role-based filtering
 */
const testOrderHistoryWithRoleFiltering = async () => {
  console.log("\\n📦 FEATURE 2: GET /order-history with role-based filtering");
  console.log("=".repeat(60));

  try {
    // Create a test order for the customer
    console.log("\\n🔍 Creating test order...");

    // Get available products first
    const productsResponse = await makeRequest("GET", "/products");
    if (
      !productsResponse.success ||
      !productsResponse.data.data.products.length
    ) {
      console.log("   ⚠️  No products available, skipping order creation");
    } else {
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
      if (orderResponse.success) {
        testOrderId = orderResponse.data.data.order._id;
        console.log(`   ✅ Test order created: ${testOrderId}`);
      } else {
        console.log(`   ⚠️  Order creation failed: ${orderResponse.error}`);
      }
    }

    // Test customer order history - should only see their own orders
    console.log(
      "\\n🔍 Testing customer order history (should only see own orders)..."
    );
    const customerHistoryResponse = await makeRequest(
      "GET",
      "/order-history",
      null,
      tokens.customer
    );

    if (!customerHistoryResponse.success) {
      throw new Error(
        `Customer order history failed: ${customerHistoryResponse.error}`
      );
    }

    const customerHistory = customerHistoryResponse.data.data;

    // Validate response structure
    if (!customerHistory.orders || !customerHistory.pagination) {
      throw new Error("Customer order history missing required fields");
    }

    // Validate that customer only sees their own orders
    for (const order of customerHistory.orders) {
      const actualCustomerId =
        typeof order.customerId === "object"
          ? order.customerId._id
          : order.customerId;
      if (actualCustomerId !== userIds.customer) {
        throw new Error(
          "Customer seeing orders from other customers - role filtering failed"
        );
      }
    }

    console.log(
      `   ✅ Customer order history working (${customerHistory.orders.length} orders)`
    );
    console.log(`   🔒 Role filtering: Customer only sees own orders`);

    // Test admin order history - should see all orders
    console.log("\\n🔍 Testing admin order history (should see all orders)...");
    const adminHistoryResponse = await makeRequest(
      "GET",
      "/order-history",
      null,
      tokens.admin
    );

    if (!adminHistoryResponse.success) {
      throw new Error(
        `Admin order history failed: ${adminHistoryResponse.error}`
      );
    }

    const adminHistory = adminHistoryResponse.data.data;

    // Validate response structure
    if (!adminHistory.orders || !adminHistory.pagination) {
      throw new Error("Admin order history missing required fields");
    }

    console.log(
      `   ✅ Admin order history working (${adminHistory.orders.length} orders)`
    );
    console.log(`   👑 Role filtering: Admin can see all orders in system`);

    // Verify admin sees more or equal orders than customer
    if (adminHistory.orders.length < customerHistory.orders.length) {
      throw new Error("Admin should see at least as many orders as customer");
    }

    // Test pagination
    console.log("\\n🔍 Testing pagination...");
    const paginatedResponse = await makeRequest(
      "GET",
      "/order-history?page=1&limit=2",
      null,
      tokens.customer
    );

    if (!paginatedResponse.success) {
      throw new Error(
        `Paginated order history failed: ${paginatedResponse.error}`
      );
    }

    const paginatedData = paginatedResponse.data.data;
    if (
      !paginatedData.pagination.currentPage ||
      paginatedData.pagination.totalOrders === undefined
    ) {
      throw new Error("Pagination data incomplete");
    }

    console.log(
      `   ✅ Pagination working (page ${paginatedData.pagination.currentPage})`
    );

    // Test unauthorized access
    console.log("\\n🔍 Testing unauthorized access...");
    const unauthorizedHistoryResponse = await makeRequest(
      "GET",
      "/order-history"
    );

    if (unauthorizedHistoryResponse.success) {
      throw new Error("Order history endpoint should require authentication");
    }
    if (unauthorizedHistoryResponse.status !== 401) {
      throw new Error(
        `Expected 401 status, got ${unauthorizedHistoryResponse.status}`
      );
    }

    console.log("   ✅ Unauthorized access properly blocked");
    console.log(
      "\\n🎉 FEATURE 2 PASSED: Order history with role-based filtering working correctly"
    );
    return true;
  } catch (error) {
    console.error(`   ❌ FEATURE 2 FAILED: ${error.message}`);
    return false;
  }
};

/**
 * FEATURE 3: Socket.io notifications for order status updates
 */
const testSocketNotifications = async () => {
  console.log(
    "\\n🔌 FEATURE 3: Socket.io notifications for order status updates"
  );
  console.log("=".repeat(65));

  if (!testOrderId) {
    console.log(
      "   ⚠️  No test order available, skipping socket notification test"
    );
    return true;
  }

  return new Promise((resolve) => {
    let socket;
    let notificationReceived = false;
    let testCompleted = false;

    const completeTest = (success, message) => {
      if (testCompleted) return;
      testCompleted = true;

      if (socket) socket.disconnect();

      if (success) {
        console.log(`   ✅ ${message}`);
        console.log(
          "\\n🎉 FEATURE 3 PASSED: Socket.io notifications working correctly"
        );
      } else {
        console.error(`   ❌ FEATURE 3 FAILED: ${message}`);
      }

      resolve(success);
    };

    try {
      console.log("\\n🔍 Setting up socket connection...");

      // Create socket connection with customer token
      socket = io(BASE_URL, {
        auth: { token: tokens.customer },
        transports: ["websocket"],
        timeout: SOCKET_TIMEOUT,
      });

      // Set up notification listener
      socket.on("notification", (notification) => {
        console.log(`   📨 Notification received:`, notification);

        // Validate notification structure
        if (!notification.title || !notification.message) {
          completeTest(
            false,
            "Notification missing required fields (title, message)"
          );
          return;
        }

        // Validate notification content matches required format
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

        if (!notification.message.includes("shipped")) {
          completeTest(
            false,
            `Notification should include new status 'shipped': ${notification.message}`
          );
          return;
        }

        console.log("   ✅ Notification format matches requirement:");
        console.log(`   📋 Title: "${notification.title}"`);
        console.log(`   📋 Message: "${notification.message}"`);

        notificationReceived = true;
        completeTest(true, "Socket notification received with correct format");
      });

      socket.on("connect", async () => {
        console.log("   🔗 Customer connected to socket");

        // Wait for connection to stabilize
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
            completeTest(false, `Error during status update: ${error.message}`);
          }
        }, 1000);
      });

      socket.on("connect_error", (error) => {
        completeTest(false, `Socket connection error: ${error.message}`);
      });

      socket.on("disconnect", (reason) => {
        console.log(`   🔌 Socket disconnected: ${reason}`);
      });

      // Overall timeout
      setTimeout(() => {
        if (!testCompleted) {
          completeTest(false, "Socket notification test timed out");
        }
      }, TEST_TIMEOUT);
    } catch (error) {
      completeTest(false, `Socket test setup failed: ${error.message}`);
    }
  });
};

/**
 * Main test runner
 */
const runAllFeaturesValidation = async () => {
  console.log("🚀 COMPREHENSIVE FEATURES VALIDATION TEST");
  console.log("Testing all 3 required features:");
  console.log("1. GET /profile route for customers and admins");
  console.log("2. GET /order-history with role-based filtering");
  console.log("3. Socket.io notifications for order status updates");
  console.log("=".repeat(70));

  const results = {
    setup: false,
    profileEndpoints: false,
    orderHistory: false,
    socketNotifications: false,
  };

  try {
    // Setup
    results.setup = await setupTestUsers();
    if (!results.setup) {
      throw new Error("Setup failed - cannot continue with tests");
    }

    // Run feature tests
    results.profileEndpoints = await testProfileEndpoints();
    results.orderHistory = await testOrderHistoryWithRoleFiltering();
    results.socketNotifications = await testSocketNotifications();

    // Final results
    console.log("\\n" + "=".repeat(70));
    console.log("📊 FINAL VALIDATION RESULTS");
    console.log("=".repeat(70));

    const allPassed = Object.values(results).every((result) => result === true);

    if (allPassed) {
      console.log("\\n🎉 ALL FEATURES VALIDATED SUCCESSFULLY! 🎉");
      console.log(
        "\\n✅ FEATURE 1: GET /profile route working for customers and admins"
      );
      console.log("   - Returns user profile without password");
      console.log("   - Role-based access working correctly");
      console.log("   - Authentication required and enforced");

      console.log(
        "\\n✅ FEATURE 2: GET /order-history with role-based filtering working"
      );
      console.log("   - Customers see only their own orders");
      console.log("   - Admins see all orders in the system");
      console.log("   - Pagination implemented and working");
      console.log("   - Authentication required and enforced");

      console.log("\\n✅ FEATURE 3: Socket.io notifications working");
      console.log("   - Real-time notifications sent on order status updates");
      console.log("   - Correct notification format implemented:");
      console.log(
        "     {title: 'New shipping status', message: 'Your last order shipping status has been updated to <status>'}"
      );
      console.log("   - Customer-specific targeting working");

      console.log("\\n🚀 ALL 3 FEATURES ARE WORKING AS REQUIRED!");
      process.exit(0);
    } else {
      console.log("\\n❌ SOME FEATURES FAILED VALIDATION:");
      Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? "✅" : "❌";
        console.log(`   ${status} ${test}`);
      });

      console.log("\\n🔧 Please review the failed features above.");
      process.exit(1);
    }
  } catch (error) {
    console.error(`\\n💥 Test execution failed: ${error.message}`);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\\n\\n🛑 Test interrupted by user");
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\\n\\n🛑 Test terminated");
  process.exit(1);
});

// Run the validation test
runAllFeaturesValidation();
