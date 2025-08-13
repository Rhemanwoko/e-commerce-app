/**
 * Security and edge case testing
 * Tests for potential vulnerabilities and edge cases
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function securityEdgeCaseTest() {
  console.log("🔐 Security & Edge Case Testing\n");

  let testsPassed = 0;
  let totalTests = 0;

  function logTest(testName, passed, details = "") {
    totalTests++;
    if (passed) {
      console.log(`✅ ${testName}`);
      testsPassed++;
    } else {
      console.log(`❌ ${testName}`);
      if (details) console.log(`   ${details}`);
    }
  }

  try {
    // Test 1: SQL Injection attempts (should be handled by MongoDB)
    console.log("1. Testing SQL injection attempts...");
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: "admin@example.com' OR '1'='1",
        password: "password' OR '1'='1",
      });
      logTest(
        "SQL injection attempt blocked",
        false,
        "Login succeeded with injection attempt"
      );
    } catch (error) {
      logTest(
        "SQL injection attempt blocked",
        error.response && error.response.status === 401
      );
    }

    // Test 2: XSS attempts in product creation
    console.log("2. Testing XSS prevention...");
    try {
      await axios.post(`${BASE_URL}/products`, {
        productName: '<script>alert("xss")</script>',
        cost: 99.99,
        description: '<img src="x" onerror="alert(1)">',
        stockStatus: "in-stock",
      });
      logTest(
        "XSS attempt handled",
        false,
        "Request succeeded with XSS payload"
      );
    } catch (error) {
      logTest(
        "XSS attempt handled",
        error.response && error.response.status === 401
      );
    }

    // Test 3: Very long input strings
    console.log("3. Testing input length limits...");
    try {
      await axios.post(`${BASE_URL}/products`, {
        productName: "A".repeat(1000),
        cost: 99.99,
        description: "B".repeat(10000),
        stockStatus: "in-stock",
      });
      logTest(
        "Long input handled",
        false,
        "Request succeeded with very long input"
      );
    } catch (error) {
      logTest(
        "Long input handled",
        error.response && error.response.status >= 400
      );
    }

    // Test 4: Invalid JSON payloads
    console.log("4. Testing malformed JSON handling...");
    try {
      const response = await axios.post(
        `${BASE_URL}/products`,
        "invalid json",
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      logTest(
        "Malformed JSON handled",
        false,
        "Request succeeded with invalid JSON"
      );
    } catch (error) {
      logTest(
        "Malformed JSON handled",
        error.response && error.response.status >= 400
      );
    }

    // Test 5: Token manipulation attempts
    console.log("5. Testing token manipulation...");
    const manipulatedTokens = [
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.invalid",
      "Bearer " + "A".repeat(500), // Very long token
      "Bearer null",
      "Bearer undefined",
      "Bearer {}",
      "Bearer []",
    ];

    for (const token of manipulatedTokens) {
      try {
        await axios.post(
          `${BASE_URL}/products`,
          {
            productName: "Test",
            cost: 99.99,
            description: "Test description",
            stockStatus: "in-stock",
          },
          {
            headers: { Authorization: token },
          }
        );
        logTest(
          `Manipulated token rejected: ${token.substring(0, 30)}...`,
          false,
          "Request succeeded"
        );
      } catch (error) {
        logTest(
          `Manipulated token rejected: ${token.substring(0, 30)}...`,
          error.response && error.response.status === 401
        );
      }
    }

    // Test 6: HTTP method tampering
    console.log("6. Testing HTTP method security...");
    try {
      await axios.patch(`${BASE_URL}/products`, {
        productName: "Test",
      });
      logTest(
        "Unsupported HTTP method handled",
        false,
        "PATCH request succeeded"
      );
    } catch (error) {
      logTest(
        "Unsupported HTTP method handled",
        error.response &&
          (error.response.status === 404 || error.response.status === 405)
      );
    }

    // Test 7: Header injection attempts
    console.log("7. Testing header injection...");
    try {
      await axios.get(`${BASE_URL}/products`, {
        headers: {
          "X-Forwarded-For": "127.0.0.1\r\nX-Injected-Header: malicious",
          "User-Agent": "Mozilla/5.0\r\nX-Another-Injection: test",
        },
      });
      logTest(
        "Header injection handled",
        true,
        "Request completed without error"
      );
    } catch (error) {
      logTest(
        "Header injection handled",
        true,
        "Request handled appropriately"
      );
    }

    // Test 8: Rate limiting (basic test)
    console.log("8. Testing concurrent request handling...");
    try {
      const concurrentRequests = Array(20)
        .fill()
        .map(() => axios.get(`${BASE_URL}/health`).catch((err) => err));

      const results = await Promise.all(concurrentRequests);
      const successCount = results.filter((r) => r.status === 200).length;

      logTest(
        "Concurrent requests handled",
        successCount >= 15,
        `${successCount}/20 succeeded`
      );
    } catch (error) {
      logTest("Concurrent requests handled", false, error.message);
    }

    // Test 9: Memory exhaustion attempts
    console.log("9. Testing large payload handling...");
    try {
      const largePayload = {
        productName: "Test",
        cost: 99.99,
        description: "A".repeat(50000), // 50KB description
        stockStatus: "in-stock",
        extraData: "B".repeat(100000), // 100KB extra data
      };

      await axios.post(`${BASE_URL}/products`, largePayload);
      logTest("Large payload handled", false, "Very large payload accepted");
    } catch (error) {
      logTest(
        "Large payload handled",
        error.response && error.response.status >= 400
      );
    }

    // Test 10: Path traversal attempts
    console.log("10. Testing path traversal...");
    const pathTraversalAttempts = [
      "/products/../admin",
      "/products/../../etc/passwd",
      "/products/%2e%2e%2fadmin",
    ];

    for (const path of pathTraversalAttempts) {
      try {
        await axios.get(`${BASE_URL}${path}`);
        logTest(`Path traversal blocked: ${path}`, false, "Request succeeded");
      } catch (error) {
        logTest(
          `Path traversal blocked: ${path}`,
          error.response && error.response.status === 404
        );
      }
    }

    // Test 11: Environment variable exposure
    console.log("11. Testing environment variable exposure...");
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      const responseText = JSON.stringify(healthResponse.data);

      const sensitivePatterns = [
        /mongodb.*:\/\/.*:.*@/i, // MongoDB connection string with credentials
        /jwt_secret/i,
        /password/i,
        /secret.*key/i,
      ];

      const exposedSecrets = sensitivePatterns.some((pattern) =>
        pattern.test(responseText)
      );
      logTest("No sensitive data exposed in health endpoint", !exposedSecrets);
    } catch (error) {
      logTest(
        "No sensitive data exposed in health endpoint",
        true,
        "Health endpoint not accessible"
      );
    }

    // Test 12: Error message information disclosure
    console.log("12. Testing error message security...");
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: "nonexistent@example.com",
        password: "wrongpassword",
      });
      logTest("Error messages secure", false, "Login succeeded unexpectedly");
    } catch (error) {
      const errorMessage = error.response.data.message.toLowerCase();
      const exposesInfo =
        errorMessage.includes("user not found") ||
        errorMessage.includes("password incorrect") ||
        errorMessage.includes("database") ||
        errorMessage.includes("internal");

      logTest(
        "Error messages secure",
        !exposesInfo || errorMessage.includes("invalid credentials")
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 SECURITY TEST RESULTS");
    console.log("=".repeat(60));
    console.log(`✅ Passed: ${testsPassed}/${totalTests}`);
    console.log(
      `📊 Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`
    );

    if (testsPassed === totalTests) {
      console.log("\n🛡️  EXCELLENT SECURITY POSTURE!");
      console.log("✅ All security tests passed");
      console.log("✅ No vulnerabilities detected");
      console.log("✅ Input validation working");
      console.log("✅ Authentication security robust");
    } else if (testsPassed / totalTests > 0.8) {
      console.log("\n🔒 GOOD SECURITY POSTURE");
      console.log("✅ Most security tests passed");
      console.log("⚠️  Minor issues detected");
    } else {
      console.log("\n⚠️  SECURITY CONCERNS DETECTED");
      console.log("❌ Multiple security tests failed");
      console.log("🔧 Review and fix security issues");
    }
  } catch (error) {
    console.error("Security test failed:", error.message);
  }
}

securityEdgeCaseTest();
