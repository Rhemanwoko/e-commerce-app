const axios = require("axios");
const io = require("socket.io-client");

const BASE_URL = "http://localhost:3000";

const testSocketNotifications = async () => {
  console.log("🔌 SIMPLE SOCKET NOTIFICATION TEST");
  console.log("=".repeat(40));

  // Generate unique test data
  const timestamp = Date.now();
  const customerData = {
    fullName: "Test Customer",
    email: `customer${timestamp}@test.com`,
    password: "password123",
    role: "customer",
  };
  const adminData = {
    fullName: "Test Admin",
    email: `admin${timestamp}@test.com`,
    password: "password123",
    role: "admin",
  };

  try {
    // Register users
    console.log("\\n1. Registering users...");
    const customerReg = await axios.post(
      `${BASE_URL}/auth/register`,
      customerData
    );
    const adminReg = await axios.post(`${BASE_URL}/auth/register`, adminData);

    const customerToken = customerReg.data.data.token;
    const adminToken = adminReg.data.data.token;
    const customerId = customerReg.data.data.user._id;
    const adminId = adminReg.data.data.user._id;

    console.log(`   ✅ Customer: ${customerId}`);
    console.log(`   ✅ Admin: ${adminId}`);

    // Create order
    console.log("\\n2. Creating order...");
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    const product = productsResponse.data.data.products[0];

    const orderData = {
      items: [
        {
          productName: product.productName,
          productId: product._id,
          ownerId: adminId,
          quantity: 1,
          totalCost: product.cost || 50.0,
        },
      ],
    };

    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    const orderId = orderResponse.data.data.order._id;
    console.log(`   ✅ Order created: ${orderId}`);

    // Test socket notification
    console.log("\\n3. Testing socket notification...");

    return new Promise((resolve) => {
      let notificationReceived = false;

      console.log("   🔗 Connecting to socket...");
      const socket = io(BASE_URL, {
        auth: { token: customerToken },
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        console.log("   ✅ Socket connected");

        // Wait a bit then update order status
        setTimeout(async () => {
          console.log("   📤 Updating order status...");

          try {
            await axios.put(
              `${BASE_URL}/orders/${orderId}/status`,
              { shippingStatus: "shipped" },
              { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            console.log("   ✅ Order status updated");
          } catch (error) {
            console.log("   ❌ Order update failed:", error.message);
            socket.disconnect();
            resolve(false);
          }
        }, 2000);
      });

      socket.on("notification", (notification) => {
        console.log("   📨 Notification received!");
        console.log("   📋 Title:", notification.title);
        console.log("   📋 Message:", notification.message);

        notificationReceived = true;
        socket.disconnect();

        // Validate notification
        if (
          notification.title === "New shipping status" &&
          notification.message.includes("shipped")
        ) {
          console.log("   ✅ Notification format correct");
          resolve(true);
        } else {
          console.log("   ❌ Notification format incorrect");
          resolve(false);
        }
      });

      socket.on("connect_error", (error) => {
        console.log("   ❌ Connection error:", error.message);
        resolve(false);
      });

      socket.on("disconnect", (reason) => {
        console.log(`   🔌 Disconnected: ${reason}`);
        if (!notificationReceived) {
          setTimeout(() => resolve(false), 1000);
        }
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!notificationReceived) {
          console.log("   ⏰ Test timed out");
          socket.disconnect();
          resolve(false);
        }
      }, 15000);
    });
  } catch (error) {
    console.error(`\\n💥 Test failed: ${error.message}`);
    return false;
  }
};

const runTest = async () => {
  const success = await testSocketNotifications();

  console.log("\\n" + "=".repeat(40));
  if (success) {
    console.log("✅ SOCKET NOTIFICATIONS WORKING!");
  } else {
    console.log("❌ SOCKET NOTIFICATIONS FAILED!");
  }

  process.exit(success ? 0 : 1);
};

runTest();
