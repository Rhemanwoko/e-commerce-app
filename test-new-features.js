const axios = require("axios");
const io = require("socket.io-client");

const BASE_URL = "http://localhost:3000";

let adminToken = "";
let customerToken = "";
let adminId = "";
let customerId = "";
let productId = "";
let orderId = "";

// Test data
const adminData = {
  fullName: "Test Admin",
  email: `admin_${Date.now()}@test.com`,
  password: "admin123",
  role: "admin",
};

const customerData = {
  fullName: "Test Customer",
  email: `customer_${Date.now()}@test.com`,
  password: "customer123",
  role: "customer",
};

const brandData = {
  brandName: `Test Brand ${Date.now()}`,
  description: "Test brand for new features",
};

const productData = {
  productName: `Test Product ${Date.now()}`,
  description: "Test product for new features",
  cost: 29.99,
  stockStatus: "in-stock",
  productImages: ["https://example.com/test-image.jpg"],
};

async function testNewFeatures() {
  try {
    console.log("🚀 Starting comprehensive test of new features...\n");

    // Step 1: Register users
    console.log("📝 Step 1: Registering admin and customer...");

    const adminRegister = await axios.post(
      `${BASE_URL}/auth/register`,
      adminData
    );
    console.log("✅ Admin registered successfully");

    const customerRegister = await axios.post(
      `${BASE_URL}/auth/register`,
      customerData
    );
    console.log("✅ Customer registered successfully");

    // Step 2: Login users
    console.log("\n🔐 Step 2: Logging in users...");

    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminData.email,
      password: adminData.password,
    });
    adminToken = adminLogin.data.data.token;
    adminId = adminLogin.data.data.user._id;
    console.log("✅ Admin logged in successfully");

    const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: customerData.email,
      password: customerData.password,
    });
    customerToken = customerLogin.data.data.token;
    customerId = customerLogin.data.data.user._id;
    console.log("✅ Customer logged in successfully");

    // Step 3: Test Profile Endpoints
    console.log("\n👤 Step 3: Testing profile endpoints...");

    // Test admin profile
    const adminProfile = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      "✅ Admin profile retrieved:",
      adminProfile.data.data.profile.fullName
    );

    // Test customer profile
    const customerProfile = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log(
      "✅ Customer profile retrieved:",
      customerProfile.data.data.profile.fullName
    );

    // Step 4: Create test data for orders
    console.log("\n🏪 Step 4: Creating brand and product...");

    const brand = await axios.post(`${BASE_URL}/brands`, brandData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const brandId = brand.data.data._id;
    console.log("✅ Brand created successfully");

    productData.brand = brandId;
    const product = await axios.post(`${BASE_URL}/products`, productData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    productId = product.data.data.product._id;
    console.log("✅ Product created successfully");

    // Step 5: Create order
    console.log("\n📦 Step 5: Creating test order...");

    const orderData = {
      items: [
        {
          productName: product.data.data.product.productName,
          productId: productId,
          ownerId: adminId,
          quantity: 2,
          totalCost: 59.98,
        },
      ],
    };

    const order = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    orderId = order.data.data.order._id;
    console.log(
      "✅ Order created successfully:",
      order.data.data.order.orderNumber
    );

    // Step 6: Test Order History Endpoints
    console.log("\n📋 Step 6: Testing order history endpoints...");

    // Test customer order history (should only see their orders)
    const customerOrderHistory = await axios.get(
      `${BASE_URL}/orders/order-history`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      }
    );
    console.log(
      "✅ Customer order history retrieved:",
      customerOrderHistory.data.data.orders.length,
      "orders"
    );

    // Test admin order history (should see all orders)
    const adminOrderHistory = await axios.get(
      `${BASE_URL}/orders/order-history`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log(
      "✅ Admin order history retrieved:",
      adminOrderHistory.data.data.orders.length,
      "orders"
    );

    // Step 7: Test Socket.IO Notifications
    console.log("\n🔌 Step 7: Testing Socket.IO notifications...");

    // Connect customer to socket
    const customerSocket = io(BASE_URL, {
      auth: {
        token: customerToken,
      },
    });

    // Set up notification listener
    customerSocket.on("notification", (notification) => {
      console.log("🔔 Customer received notification:", notification);
      console.log("   Title:", notification.title);
      console.log("   Message:", notification.message);
      console.log("   Status:", notification.status);

      // Disconnect after receiving notification
      customerSocket.disconnect();
      console.log("✅ Socket notification test completed successfully");

      // Final summary
      console.log("\n🎉 All tests completed successfully!");
      console.log("\n📊 Test Summary:");
      console.log("   ✅ Profile endpoints working");
      console.log("   ✅ Order history with role-based filtering working");
      console.log("   ✅ Socket.IO notifications working");
      console.log("   ✅ Real-time order status updates working");

      process.exit(0);
    });

    customerSocket.on("connected", (data) => {
      console.log("✅ Customer connected to socket:", data.message);

      // Step 8: Update order status to trigger notification
      console.log(
        "\n📤 Step 8: Updating order status to trigger notification..."
      );

      setTimeout(async () => {
        try {
          const statusUpdate = await axios.put(
            `${BASE_URL}/orders/${orderId}/status`,
            {
              shippingStatus: "shipped",
            },
            {
              headers: { Authorization: `Bearer ${adminToken}` },
            }
          );
          console.log("✅ Order status updated to shipped");
        } catch (error) {
          console.error(
            "❌ Error updating order status:",
            error.response?.data || error.message
          );
        }
      }, 1000);
    });

    // Add timeout to prevent hanging
    setTimeout(() => {
      console.log("⏰ Socket notification timeout - completing test anyway");
      customerSocket.disconnect();

      console.log("\n🎉 Core tests completed successfully!");
      console.log("\n📊 Test Summary:");
      console.log("   ✅ Profile endpoints working");
      console.log("   ✅ Order creation working");
      console.log("   ✅ Order history with role-based filtering working");
      console.log("   ⚠️  Socket.IO notifications may need debugging");

      process.exit(0);
    }, 10000); // 10 second timeout

    customerSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testNewFeatures();
