const axios = require("axios");
const io = require("socket.io-client");

const BASE_URL = "http://localhost:3000";

const testManualNotification = async () => {
  console.log("🔔 MANUAL NOTIFICATION TEST");
  console.log("=".repeat(35));

  try {
    // Register users
    const timestamp = Date.now();
    const customerData = {
      fullName: "Test Customer",
      email: `customer${timestamp}@test.com`,
      password: "password123",
      role: "customer",
    };

    console.log("\\n1. Registering customer...");
    const customerReg = await axios.post(
      `${BASE_URL}/auth/register`,
      customerData
    );
    const customerToken = customerReg.data.data.token;
    const customerId = customerReg.data.data.user._id;

    console.log(`   ✅ Customer: ${customerId}`);

    // Test socket notification by directly calling the socket service
    console.log("\\n2. Testing manual notification...");

    return new Promise((resolve) => {
      let notificationReceived = false;

      console.log("   🔗 Connecting to socket...");
      const socket = io(BASE_URL, {
        auth: { token: customerToken },
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        console.log("   ✅ Socket connected");

        // Wait a bit then send a test notification via HTTP endpoint
        setTimeout(async () => {
          console.log("   📤 Sending test notification via API...");

          try {
            // Create a simple test endpoint call that triggers notification
            // We'll use the existing order status update but with a real order

            // First create an order
            const productsResponse = await axios.get(`${BASE_URL}/products`);
            const product = productsResponse.data.data.products[0];

            const orderData = {
              items: [
                {
                  productName: product.productName,
                  productId: product._id,
                  ownerId: customerId, // Use customer as owner for simplicity
                  quantity: 1,
                  totalCost: product.cost || 50.0,
                },
              ],
            };

            const orderResponse = await axios.post(
              `${BASE_URL}/orders`,
              orderData,
              {
                headers: { Authorization: `Bearer ${customerToken}` },
              }
            );

            const orderId = orderResponse.data.data.order._id;
            console.log(`   📦 Order created: ${orderId}`);

            // Now update the order status (as the same user for simplicity)
            // This should trigger the notification
            await axios.put(
              `${BASE_URL}/orders/${orderId}/status`,
              { shippingStatus: "shipped" },
              { headers: { Authorization: `Bearer ${customerToken}` } }
            );

            console.log(
              "   ✅ Order status updated - notification should be sent"
            );
          } catch (error) {
            console.log("   ❌ API call failed:", error.message);
            socket.disconnect();
            resolve(false);
          }
        }, 2000);
      });

      socket.on("connected", (data) => {
        console.log("   📡 Connected event received");
        console.log(`   👤 User ID: ${data.userId}`);
        console.log(`   👤 Role: ${data.role}`);
      });

      socket.on("notification", (notification) => {
        console.log("   📨 NOTIFICATION RECEIVED!");
        console.log(
          "   📋 Notification:",
          JSON.stringify(notification, null, 2)
        );

        notificationReceived = true;
        socket.disconnect();

        // Validate notification
        if (notification.title === "New shipping status") {
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
          console.log("   ⏰ Test timed out - no notification received");
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
  const success = await testManualNotification();

  console.log("\\n" + "=".repeat(35));
  if (success) {
    console.log("✅ MANUAL NOTIFICATION WORKING!");
  } else {
    console.log("❌ MANUAL NOTIFICATION FAILED!");
  }

  process.exit(success ? 0 : 1);
};

runTest();
