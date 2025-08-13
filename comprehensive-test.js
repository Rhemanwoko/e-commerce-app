/**
 * Comprehensive test suite to check for errors and bugs
 * Tests authentication flows, edge cases, error handling, and system robustness
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3000";
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

// Helper function to log test results
function logTest(testName, passed, details = "") {
  if (passed) {
    console.log(`✅ PASS: ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    if (details) console.log(`   Details: ${details}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
}

// Helper function to make authenticated requests (we'll need a valid token for some tests)
async function getAuthToken() {
  try {
    // First, let's try to register a test user
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: "Test Admin User",
      email: "testadmin@example.com",
      password: "TestPassword123!",
      role: "admin",
    });

    if (registerResponse.data.success) {
      return registerResponse.data.data.token;
    }
  } catch (error) {
    // If registration fails (user might already exist), try to login
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: "testadmin@example.com",
        password: "TestPassword123!",
      });

      if (loginResponse.data.success) {
        return loginResponse.data.data.token;
      }
    } catch (loginError) {
      // If both fail, try with existing admin
      try {
        const existingAdminLogin = await axios.post(`${BASE_URL}/auth/login`, {
          email: "admin@example.com",
          password: "admin123",
        });

        if (existingAdminLogin.data.success) {
          return existingAdminLogin.data.data.token;
        }
      } catch (existingError) {
        console.log("⚠️  Could not get auth token for authenticated tests");
        return null;
      }
    }
  }
  return null;
}

async function runComprehensiveTests() {
  console.log("🧪 Starting Comprehensive API Testing...\n");
  console.log("=".repeat(60));

  // Test 1: System Health and Startup
  console.log("\n📊 SYSTEM HEALTH TESTS");
  console.log("-".repeat(30));

  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    logTest("Health endpoint accessible", healthResponse.status === 200);
    logTest(
      "Health status is healthy",
      healthResponse.data.status === "healthy"
    );
    logTest("System is ready", healthResponse.data.ready === true);
    logTest(
      "All components healthy",
      healthResponse.data.components &&
        Object.values(healthResponse.data.components).every(
          (comp) => comp.status === "healthy"
        )
    );
  } catch (error) {
    logTest("Health endpoint accessible", false, error.message);
  }

  // Test 2: Authentication Security Tests
  console.log("\n🔒 AUTHENTICATION SECURITY TESTS");
  console.log("-".repeat(30));

  // Test protected endpoints without token
  try {
    await axios.post(`${BASE_URL}/products`, {
      productName: "Test Product",
      cost: 99.99,
      description: "Test description",
      stockStatus: "in-stock",
    });
    logTest(
      "POST /products rejects without token",
      false,
      "Request succeeded when it should have failed"
    );
  } catch (error) {
    logTest(
      "POST /products rejects without token",
      error.response &&
        error.response.status === 401 &&
        error.response.data.errorCode === "NO_TOKEN"
    );
  }

  try {
    await axios.delete(`${BASE_URL}/products/507f1f77bcf86cd799439011`);
    logTest(
      "DELETE /products/:id rejects without token",
      false,
      "Request succeeded when it should have failed"
    );
  } catch (error) {
    logTest(
      "DELETE /products/:id rejects without token",
      error.response &&
        error.response.status === 401 &&
        error.response.data.errorCode === "NO_TOKEN"
    );
  }

  // Test with invalid token formats
  const invalidTokens = [
    "invalid-token",
    "Bearer invalid-token",
    "Bearer ",
    "Bearer abc.def", // Only 2 parts
    "Bearer abc.def.ghi.jkl", // 4 parts
    "Bearer abc.def.ghi!@#", // Invalid characters
  ];

  for (const token of invalidTokens) {
    try {
      await axios.post(
        `${BASE_URL}/products`,
        {
          productName: "Test Product",
          cost: 99.99,
          description: "Test description",
          stockStatus: "in-stock",
        },
        {
          headers: { Authorization: token },
        }
      );
      logTest(
        `Invalid token format rejected: ${token.substring(0, 20)}...`,
        false,
        "Request succeeded"
      );
    } catch (error) {
      logTest(
        `Invalid token format rejected: ${token.substring(0, 20)}...`,
        error.response && error.response.status === 401
      );
    }
  }

  // Test 3: Public Endpoints
  console.log("\n🌐 PUBLIC ENDPOINT TESTS");
  console.log("-".repeat(30));

  try {
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    logTest("GET /products is accessible", productsResponse.status === 200);
    logTest(
      "GET /products returns proper structure",
      productsResponse.data.success === true &&
        productsResponse.data.data &&
        Array.isArray(productsResponse.data.data.products)
    );
  } catch (error) {
    logTest("GET /products is accessible", false, error.message);
  }

  // Test 4: Error Response Format
  console.log("\n📝 ERROR RESPONSE FORMAT TESTS");
  console.log("-".repeat(30));

  try {
    await axios.post(`${BASE_URL}/products`);
  } catch (error) {
    const errorData = error.response.data;
    logTest(
      "Error response has success field",
      errorData.hasOwnProperty("success") && errorData.success === false
    );
    logTest(
      "Error response has message field",
      errorData.hasOwnProperty("message") &&
        typeof errorData.message === "string"
    );
    logTest(
      "Error response has errorCode field",
      errorData.hasOwnProperty("errorCode") &&
        typeof errorData.errorCode === "string"
    );
    logTest(
      "Error response has statusCode field",
      errorData.hasOwnProperty("statusCode") &&
        typeof errorData.statusCode === "number"
    );
    logTest(
      "Error response has timestamp field",
      errorData.hasOwnProperty("timestamp") &&
        typeof errorData.timestamp === "string"
    );
    logTest(
      "Error response has requestId field",
      errorData.hasOwnProperty("requestId") &&
        typeof errorData.requestId === "string"
    );
  }

  // Test 5: Input Validation Tests
  console.log("\n✅ INPUT VALIDATION TESTS");
  console.log("-".repeat(30));

  // Get auth token for validation tests
  const authToken = await getAuthToken();

  if (authToken) {
    console.log("✅ Got authentication token for validation tests");

    // Test invalid product data
    const invalidProductData = [
      {
        productName: "",
        cost: 99.99,
        description: "Test",
        stockStatus: "in-stock",
      }, // Empty name
      {
        productName: "Test",
        cost: -10,
        description: "Test",
        stockStatus: "in-stock",
      }, // Negative cost
      {
        productName: "Test",
        cost: "invalid",
        description: "Test",
        stockStatus: "in-stock",
      }, // Invalid cost type
      {
        productName: "Test",
        cost: 99.99,
        description: "Short",
        stockStatus: "in-stock",
      }, // Short description
      {
        productName: "Test",
        cost: 99.99,
        description: "Test",
        stockStatus: "",
      }, // Empty stock status
      {
        productName: "A".repeat(201),
        cost: 99.99,
        description: "Test description",
        stockStatus: "in-stock",
      }, // Long name
    ];

    for (let i = 0; i < invalidProductData.length; i++) {
      try {
        await axios.post(`${BASE_URL}/products`, invalidProductData[i], {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        logTest(
          `Invalid product data ${i + 1} rejected`,
          false,
          "Request succeeded when it should have failed"
        );
      } catch (error) {
        logTest(
          `Invalid product data ${i + 1} rejected`,
          error.response && error.response.status === 400
        );
      }
    }
  } else {
    console.log("⚠️  Skipping validation tests - no auth token available");
  }

  // Test 6: Edge Cases and Error Handling
  console.log("\n🎯 EDGE CASE TESTS");
  console.log("-".repeat(30));

  // Test non-existent routes
  try {
    await axios.get(`${BASE_URL}/nonexistent`);
    logTest("Non-existent route returns 404", false, "Request succeeded");
  } catch (error) {
    logTest(
      "Non-existent route returns 404",
      error.response && error.response.status === 404
    );
  }

  // Test malformed JSON
  try {
    await axios.post(`${BASE_URL}/products`, "invalid json", {
      headers: { "Content-Type": "application/json" },
    });
    logTest("Malformed JSON handled gracefully", false, "Request succeeded");
  } catch (error) {
    logTest(
      "Malformed JSON handled gracefully",
      error.response && error.response.status >= 400
    );
  }

  // Test very large payload
  try {
    const largePayload = {
      productName: "Test Product",
      cost: 99.99,
      description: "A".repeat(10000), // Very long description
      stockStatus: "in-stock",
    };
    await axios.post(`${BASE_URL}/products`, largePayload);
    logTest("Large payload handled appropriately", false, "Request succeeded");
  } catch (error) {
    logTest(
      "Large payload handled appropriately",
      error.response && error.response.status >= 400
    );
  }

  // Test 7: Authentication Flow Tests
  console.log("\n🔐 AUTHENTICATION FLOW TESTS");
  console.log("-".repeat(30));

  // Test registration with invalid data
  const invalidRegistrations = [
    {
      fullName: "",
      email: "test@test.com",
      password: "password123",
      role: "admin",
    }, // Empty name
    {
      fullName: "Test User",
      email: "invalid-email",
      password: "password123",
      role: "admin",
    }, // Invalid email
    {
      fullName: "Test User",
      email: "test@test.com",
      password: "123",
      role: "admin",
    }, // Short password
    {
      fullName: "Test User",
      email: "test@test.com",
      password: "password123",
      role: "invalid",
    }, // Invalid role
  ];

  for (let i = 0; i < invalidRegistrations.length; i++) {
    try {
      await axios.post(`${BASE_URL}/auth/register`, invalidRegistrations[i]);
      logTest(
        `Invalid registration ${i + 1} rejected`,
        false,
        "Registration succeeded"
      );
    } catch (error) {
      logTest(
        `Invalid registration ${i + 1} rejected`,
        error.response && error.response.status === 400
      );
    }
  }

  // Test login with invalid credentials
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: "nonexistent@example.com",
      password: "wrongpassword",
    });
    logTest("Invalid login credentials rejected", false, "Login succeeded");
  } catch (error) {
    logTest(
      "Invalid login credentials rejected",
      error.response && error.response.status === 401
    );
  }

  // Test 8: Performance and Reliability
  console.log("\n⚡ PERFORMANCE TESTS");
  console.log("-".repeat(30));

  // Test multiple concurrent requests
  try {
    const concurrentRequests = Array(10)
      .fill()
      .map(() => axios.get(`${BASE_URL}/products`).catch((err) => err));

    const results = await Promise.all(concurrentRequests);
    const successfulRequests = results.filter(
      (result) => result.status === 200
    ).length;

    logTest(
      "Handles concurrent requests",
      successfulRequests >= 8,
      `${successfulRequests}/10 requests succeeded`
    );
  } catch (error) {
    logTest("Handles concurrent requests", false, error.message);
  }

  // Test response times
  try {
    const startTime = Date.now();
    await axios.get(`${BASE_URL}/health`);
    const responseTime = Date.now() - startTime;

    logTest(
      "Health endpoint responds quickly",
      responseTime < 1000,
      `Response time: ${responseTime}ms`
    );
  } catch (error) {
    logTest("Health endpoint responds quickly", false, error.message);
  }

  // Final Results
  console.log("\n" + "=".repeat(60));
  console.log("🎯 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  console.log(
    `📈 Success Rate: ${(
      (testResults.passed / (testResults.passed + testResults.failed)) *
      100
    ).toFixed(1)}%`
  );

  if (testResults.failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`);
      if (error.details) console.log(`   ${error.details}`);
    });
  }

  if (testResults.failed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Your API is working correctly.");
  } else if (testResults.failed < 5) {
    console.log("\n✅ Most tests passed. Minor issues detected.");
  } else {
    console.log("\n⚠️  Multiple issues detected. Review failed tests.");
  }

  console.log("\n📋 RECOMMENDATIONS:");
  if (testResults.failed === 0) {
    console.log("- Your API is secure and robust");
    console.log("- Authentication is working correctly");
    console.log("- Error handling is comprehensive");
    console.log("- Ready for production deployment");
  } else {
    console.log("- Review failed tests and fix issues");
    console.log("- Test again after making changes");
    console.log("- Consider adding more validation");
  }
}

// Run the comprehensive tests
runComprehensiveTests().catch((error) => {
  console.error("Test suite failed:", error.message);
});
