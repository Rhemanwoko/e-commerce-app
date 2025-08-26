const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testServerStatus() {
  console.log("🔍 Testing server status and order endpoint...\n");

  try {
    // Test health endpoint
    console.log("1. Testing health endpoint...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check:", healthResponse.status, healthResponse.data);

    // Test if server is responding
    console.log("\n2. Testing basic server response...");
    const basicResponse = await axios.get(`${BASE_URL}/`);
    console.log("✅ Basic response:", basicResponse.status);

    // Register a test user
    console.log("\n3. Registering test user...");
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: "Debug Test User",
      email: "debug@test.com",
      password: "password123",
      role: "customer",
    });
    console.log("✅ User registered:", registerResponse.status);

    // Login to get token
    console.log("\n4. Logging in...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "debug@test.com",
      password: "password123",
    });
    const token = loginResponse.data.data.token;
    console.log("✅ Login successful, token obtained");

    // Try to access orders endpoint with invalid data to trigger validation
    console.log("\n5. Testing orders endpoint with invalid data...");
    try {
      const invalidOrderResponse = await axios.post(
        `${BASE_URL}/orders`,
        {
          items: [], // Invalid - empty items
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.log(
        "Expected validation error:",
        error.response?.status,
        error.response?.data
      );
    }

    // Try to access orders endpoint with minimal valid data
    console.log("\n6. Testing orders endpoint with minimal data...");
    try {
      const minimalOrderResponse = await axios.post(
        `${BASE_URL}/orders`,
        {
          items: [
            {
              productName: "Test Product",
              productId: "507f1f77bcf86cd799439011", // Valid ObjectId format
              ownerId: "507f1f77bcf86cd799439012", // Valid ObjectId format
              quantity: 1,
              totalCost: 10.0,
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(
        "✅ Order creation response:",
        minimalOrderResponse.status,
        minimalOrderResponse.data
      );
    } catch (error) {
      console.log("❌ Order creation error:");
      console.log("Status:", error.response?.status);
      console.log("Error data:", JSON.stringify(error.response?.data, null, 2));
      console.log("Error message:", error.message);
    }
  } catch (error) {
    console.error("❌ Server test failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.log(
        "\n🚨 Server is not running! Please start the server with: npm start"
      );
    }
  }
}

testServerStatus();
