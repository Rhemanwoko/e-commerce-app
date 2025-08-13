/**
 * Quick test script to verify authentication security is working
 * This script tests the key security fixes we implemented
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testAuthenticationSecurity() {
  console.log("🔒 Testing Authentication Security...\n");

  try {
    // Test 1: Try to create product without token
    console.log("Test 1: Creating product without authentication token...");
    try {
      const response = await axios.post(`${BASE_URL}/products`, {
        productName: "Test Product",
        cost: 99.99,
        description: "This should fail without auth",
        stockStatus: "in-stock",
      });
      console.log(
        "❌ SECURITY ISSUE: Product creation succeeded without token!"
      );
      console.log("Response:", response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(
          "✅ PASS: Product creation properly rejected without token"
        );
        console.log("Error Code:", error.response.data.errorCode);
        console.log("Message:", error.response.data.message);
      } else {
        console.log("❓ Unexpected error:", error.message);
      }
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: Try to delete product without token
    console.log("Test 2: Deleting product without authentication token...");
    try {
      const response = await axios.delete(
        `${BASE_URL}/products/507f1f77bcf86cd799439011`
      );
      console.log(
        "❌ SECURITY ISSUE: Product deletion succeeded without token!"
      );
      console.log("Response:", response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(
          "✅ PASS: Product deletion properly rejected without token"
        );
        console.log("Error Code:", error.response.data.errorCode);
        console.log("Message:", error.response.data.message);
      } else {
        console.log("❓ Unexpected error:", error.message);
      }
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 3: Try with invalid token
    console.log("Test 3: Creating product with invalid token...");
    try {
      const response = await axios.post(
        `${BASE_URL}/products`,
        {
          productName: "Test Product",
          cost: 99.99,
          description: "This should fail with invalid token",
          stockStatus: "in-stock",
        },
        {
          headers: {
            Authorization: "Bearer invalid-token-here",
          },
        }
      );
      console.log(
        "❌ SECURITY ISSUE: Product creation succeeded with invalid token!"
      );
      console.log("Response:", response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(
          "✅ PASS: Product creation properly rejected with invalid token"
        );
        console.log("Error Code:", error.response.data.errorCode);
        console.log("Message:", error.response.data.message);
      } else {
        console.log("❓ Unexpected error:", error.message);
      }
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 4: Check health endpoint
    console.log("Test 4: Checking health endpoint...");
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log("✅ Health endpoint accessible");
      console.log("Status:", response.data.status);
      console.log("Ready:", response.data.ready);
      console.log("Components:", Object.keys(response.data.components || {}));
    } catch (error) {
      console.log("❌ Health endpoint failed:", error.message);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 5: Check public endpoint (GET products)
    console.log("Test 5: Checking public endpoint (GET products)...");
    try {
      const response = await axios.get(`${BASE_URL}/products`);
      console.log("✅ Public endpoint accessible");
      console.log("Products count:", response.data.data?.count || 0);
    } catch (error) {
      console.log("❌ Public endpoint failed:", error.message);
    }

    console.log("\n🎉 Authentication security test completed!");
    console.log("\n📝 Summary:");
    console.log(
      "- Protected endpoints should reject requests without valid tokens"
    );
    console.log("- Error responses should include proper error codes");
    console.log("- Public endpoints should remain accessible");
    console.log("- Health endpoint should show system status");
  } catch (error) {
    console.error("Test failed with error:", error.message);
  }
}

// Run the test if server is available
async function runTest() {
  try {
    // Check if server is running
    await axios.get(`${BASE_URL}/health`);
    await testAuthenticationSecurity();
  } catch (error) {
    console.log("❌ Server is not running or not accessible at", BASE_URL);
    console.log("Please start your server with: npm run dev");
    console.log("Then run this test again with: node test-auth-security.js");
  }
}

runTest();
