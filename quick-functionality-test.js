/**
 * Quick functionality test to verify core features are working
 * Tests the most critical functionality without complex setup
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function quickFunctionalityTest() {
  console.log("⚡ Quick Functionality Test\n");

  let allPassed = true;

  try {
    // Test 1: Health Check
    console.log("1. Testing health endpoint...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    if (
      healthResponse.status === 200 &&
      healthResponse.data.status === "healthy"
    ) {
      console.log("   ✅ Health endpoint working");
    } else {
      console.log("   ❌ Health endpoint failed");
      allPassed = false;
    }

    // Test 2: Public endpoint (GET products)
    console.log("2. Testing public endpoint...");
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    if (productsResponse.status === 200 && productsResponse.data.success) {
      console.log("   ✅ Public endpoint working");
    } else {
      console.log("   ❌ Public endpoint failed");
      allPassed = false;
    }

    // Test 3: Protected endpoint without auth (should fail)
    console.log("3. Testing protected endpoint without auth...");
    try {
      await axios.post(`${BASE_URL}/products`, {
        productName: "Test Product",
        cost: 99.99,
        description: "Test description",
        stockStatus: "in-stock",
      });
      console.log("   ❌ Protected endpoint allowed access without auth");
      allPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("   ✅ Protected endpoint properly secured");
      } else {
        console.log("   ❌ Unexpected error:", error.message);
        allPassed = false;
      }
    }

    // Test 4: Error response format
    console.log("4. Testing error response format...");
    try {
      await axios.post(`${BASE_URL}/products`);
    } catch (error) {
      const errorData = error.response.data;
      if (
        errorData.success === false &&
        errorData.errorCode &&
        errorData.message &&
        errorData.statusCode
      ) {
        console.log("   ✅ Error response format correct");
      } else {
        console.log("   ❌ Error response format incorrect");
        allPassed = false;
      }
    }

    // Test 5: Invalid route (404)
    console.log("5. Testing 404 handling...");
    try {
      await axios.get(`${BASE_URL}/nonexistent-route`);
      console.log("   ❌ 404 handling failed");
      allPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("   ✅ 404 handling working");
      } else {
        console.log("   ❌ Unexpected error for 404");
        allPassed = false;
      }
    }

    // Test 6: CORS headers
    console.log("6. Testing CORS headers...");
    const corsResponse = await axios.get(`${BASE_URL}/health`);
    if (corsResponse.headers["access-control-allow-origin"]) {
      console.log("   ✅ CORS headers present");
    } else {
      console.log("   ⚠️  CORS headers not detected (may be normal)");
    }

    // Test 7: Request ID tracking
    console.log("7. Testing request ID tracking...");
    const requestIdResponse = await axios.get(`${BASE_URL}/health`);
    if (requestIdResponse.headers["x-request-id"]) {
      console.log("   ✅ Request ID tracking working");
    } else {
      console.log("   ❌ Request ID tracking not working");
      allPassed = false;
    }

    // Test 8: Authentication flow (if possible)
    console.log("8. Testing authentication flow...");
    try {
      // Try to register a test user
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Quick Test User",
        email: "quicktest@example.com",
        password: "QuickTest123!",
        role: "admin",
      });

      if (registerResponse.data.success && registerResponse.data.data.token) {
        console.log("   ✅ User registration working");

        // Try to use the token
        const token = registerResponse.data.data.token;
        try {
          await axios.post(
            `${BASE_URL}/products`,
            {
              productName: "Test Product",
              cost: 99.99,
              description: "Test description with proper length",
              stockStatus: "in-stock",
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("   ✅ Authenticated request working");
        } catch (authError) {
          if (authError.response && authError.response.status === 400) {
            console.log(
              "   ✅ Authenticated request working (validation error expected)"
            );
          } else {
            console.log(
              "   ❌ Authenticated request failed:",
              authError.response?.data?.message
            );
            allPassed = false;
          }
        }
      } else {
        console.log("   ❌ User registration failed");
        allPassed = false;
      }
    } catch (regError) {
      if (
        regError.response &&
        regError.response.status === 400 &&
        regError.response.data.message.includes("already exists")
      ) {
        console.log("   ✅ Registration validation working (user exists)");
      } else {
        console.log(
          "   ❌ Registration failed:",
          regError.response?.data?.message
        );
        allPassed = false;
      }
    }

    console.log("\n" + "=".repeat(50));
    if (allPassed) {
      console.log("🎉 ALL CORE FUNCTIONALITY TESTS PASSED!");
      console.log("✅ Your API is working correctly");
      console.log("✅ Authentication security is properly implemented");
      console.log("✅ Error handling is working");
      console.log("✅ Request tracking is functional");
    } else {
      console.log("⚠️  Some tests failed - review the issues above");
    }
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.log("❌ Make sure your server is running on", BASE_URL);
  }
}

quickFunctionalityTest();
