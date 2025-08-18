const axios = require("axios");

// Test configuration
const BASE_URL = process.env.API_URL || "http://localhost:3000";

async function testUnauthorizedAccess() {
  console.log("🔒 Testing Unauthorized Access to Protected Endpoints\n");

  // Test 1: Create product without auth
  console.log("1. Testing POST /products without authentication...");
  try {
    const response = await axios.post(`${BASE_URL}/products`, {
      productName: "Unauthorized Test Product",
      cost: 99.99,
      description: "This should be blocked",
      stockStatus: "in-stock",
    });

    console.log("❌ SECURITY ISSUE: Product creation succeeded without auth!");
    console.log("Response:", response.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log("✅ SECURE: Product creation properly blocked (401)");
      console.log("Response:", error.response.data);
    } else {
      console.log(
        "⚠️  Unexpected error:",
        error.response?.data || error.message
      );
    }
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Delete product without auth
  console.log("2. Testing DELETE /products/:id without authentication...");
  try {
    const testId = "507f1f77bcf86cd799439011"; // Valid MongoDB ObjectId format
    const response = await axios.delete(`${BASE_URL}/products/${testId}`);

    console.log("❌ SECURITY ISSUE: Product deletion succeeded without auth!");
    console.log("Response:", response.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log("✅ SECURE: Product deletion properly blocked (401)");
      console.log("Response:", error.response.data);
    } else {
      console.log(
        "⚠️  Unexpected error:",
        error.response?.data || error.message
      );
    }
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 3: Verify GET /products still works (public endpoint)
  console.log("3. Testing GET /products (should work without auth)...");
  try {
    const response = await axios.get(`${BASE_URL}/products`);
    console.log("✅ PUBLIC ENDPOINT: Get products works without auth");
    console.log(`Found ${response.data.data?.count || 0} products`);
  } catch (error) {
    console.log("❌ ISSUE: Public endpoint failed");
    console.log("Error:", error.response?.data || error.message);
  }
}

// Run the test
testUnauthorizedAccess().catch(console.error);
