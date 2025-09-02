const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function debugOrderHistory() {
  try {
    console.log("🔍 Debugging order history response structure...\n");

    // Register and login a customer
    const customerData = {
      fullName: "Debug Customer",
      email: `debug_customer_${Date.now()}@test.com`,
      password: "customer123",
      role: "customer",
    };

    await axios.post(`${BASE_URL}/auth/register`, customerData);
    const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: customerData.email,
      password: customerData.password,
    });

    const customerToken = customerLogin.data.data.token;
    console.log("✅ Customer logged in");

    // Test order history endpoint
    const response = await axios.get(`${BASE_URL}/orders/order-history`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    console.log("📋 Full response structure:");
    console.log(JSON.stringify(response.data, null, 2));

    console.log("\n🔍 Checking data access patterns:");
    console.log("response.data:", typeof response.data);
    console.log("response.data.data:", typeof response.data.data);
    console.log(
      "response.data.data.orders:",
      typeof response.data.data?.orders
    );

    if (response.data.data?.orders) {
      console.log(
        "✅ Correct access: response.data.data.orders.length =",
        response.data.data.orders.length
      );
    } else if (response.data.orders) {
      console.log(
        "✅ Correct access: response.data.orders.length =",
        response.data.orders.length
      );
    } else {
      console.log("❌ Orders array not found in expected locations");
    }
  } catch (error) {
    console.log("❌ Error:", error.response?.data || error.message);
  }
}

debugOrderHistory();
