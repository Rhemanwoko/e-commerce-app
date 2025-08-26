const axios = require("axios");
const mongoose = require("mongoose");

const BASE_URL = "http://localhost:3000";

async function testOrderCreation() {
  console.log("🔍 Simple Order Creation Test\n");

  try {
    // Register and login
    console.log("1. Registering user...");
    await axios
      .post(`${BASE_URL}/auth/register`, {
        fullName: "Simple Test User",
        email: "simple@test.com",
        password: "password123",
        role: "customer",
      })

      .catch(() => {}); // Ignore if user exists

    console.log("2. Logging in...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "simple@test.com",
      password: "password123",
    });
    const token = loginResponse.data.data.token;
    console.log("✅ Token obtained");

    // Test with valid ObjectIds
    console.log("\n3. Testing with valid ObjectIds...");
    const validProductId = new mongoose.Types.ObjectId().toString();
    const validOwnerId = new mongoose.Types.ObjectId().toString();

    console.log("Product ID:", validProductId);
    console.log("Owner ID:", validOwnerId);

    const orderData = {
      items: [
        {
          productName: "Test Product",
          productId: validProductId,
          ownerId: validOwnerId,
          quantity: 1,
          totalCost: 25.99,
        },
      ],
    };

    console.log("\n4. Order data:", JSON.stringify(orderData, null, 2));

    const response = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Order created successfully!");
    console.log("Response:", response.status, response.data);
  } catch (error) {
    console.log("❌ Test failed:");
    console.log("Status:", error.response?.status);
    console.log("Error:", JSON.stringify(error.response?.data, null, 2));

    if (error.code === "ECONNREFUSED") {
      console.log("\n🚨 Server is not running! Start with: npm start");
    }
  }
}

testOrderCreation();
