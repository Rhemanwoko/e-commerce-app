// Test the production API deployment
const https = require("https");
const http = require("http");

const BASE_URL = "https://e-commerce-app-2jf2.onrender.com";

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? https : http;

    const req = client.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log("🏥 Testing Health Check...");
  try {
    const response = await makeRequest(`${BASE_URL}/health`);

    if (response.statusCode === 200) {
      console.log("✅ Health Check: PASSED");
      console.log("   Status:", response.statusCode);
      console.log("   Message:", response.data.message);
      console.log("   Timestamp:", response.data.timestamp);
      return true;
    } else {
      console.log("❌ Health Check: FAILED");
      console.log("   Status:", response.statusCode);
      console.log("   Response:", response.data);
      return false;
    }
  } catch (error) {
    console.log("❌ Health Check: ERROR");
    console.log("   Error:", error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log("\n🔐 Testing User Registration...");
  try {
    const userData = JSON.stringify({
      fullName: "Test Admin",
      email: "testadmin@example.com",
      password: "testpass123",
      role: "admin",
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": userData.length,
      },
      body: userData,
    };

    const response = await makeRequest(`${BASE_URL}/auth/register`, options);

    if (response.statusCode === 201) {
      console.log("✅ User Registration: PASSED");
      console.log("   Status:", response.statusCode);
      console.log("   User ID:", response.data.data.user._id);
      console.log("   User Role:", response.data.data.user.role);
      console.log("   Token Length:", response.data.data.token.length);
      return response.data.data.token;
    } else {
      console.log("❌ User Registration: FAILED");
      console.log("   Status:", response.statusCode);
      console.log("   Response:", response.data);
      return null;
    }
  } catch (error) {
    console.log("❌ User Registration: ERROR");
    console.log("   Error:", error.message);
    return null;
  }
}

async function testGetProducts() {
  console.log("\n🛍️ Testing Get Products...");
  try {
    const response = await makeRequest(`${BASE_URL}/products`);

    if (response.statusCode === 200) {
      console.log("✅ Get Products: PASSED");
      console.log("   Status:", response.statusCode);
      console.log("   Products Count:", response.data.data.count);
      console.log(
        "   Products Array Length:",
        response.data.data.products.length
      );
      return true;
    } else {
      console.log("❌ Get Products: FAILED");
      console.log("   Status:", response.statusCode);
      console.log("   Response:", response.data);
      return false;
    }
  } catch (error) {
    console.log("❌ Get Products: ERROR");
    console.log("   Error:", error.message);
    return false;
  }
}

async function testCreateProduct(token) {
  console.log("\n📦 Testing Create Product...");
  try {
    const productData = JSON.stringify({
      productName: "Test Product",
      cost: 99.99,
      productImages: ["https://example.com/test.jpg"],
      description: "This is a test product created via API testing",
      stockStatus: "In Stock",
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Length": productData.length,
      },
      body: productData,
    };

    const response = await makeRequest(`${BASE_URL}/products`, options);

    if (response.statusCode === 201) {
      console.log("✅ Create Product: PASSED");
      console.log("   Status:", response.statusCode);
      console.log("   Product ID:", response.data.data.product._id);
      console.log("   Product Name:", response.data.data.product.productName);
      console.log("   Owner ID:", response.data.data.product.ownerId._id);
      return response.data.data.product._id;
    } else {
      console.log("❌ Create Product: FAILED");
      console.log("   Status:", response.statusCode);
      console.log("   Response:", response.data);
      return null;
    }
  } catch (error) {
    console.log("❌ Create Product: ERROR");
    console.log("   Error:", error.message);
    return null;
  }
}

async function testDeleteProduct(token, productId) {
  console.log("\n🗑️ Testing Delete Product...");
  try {
    const options = {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await makeRequest(
      `${BASE_URL}/products/${productId}`,
      options
    );

    if (response.statusCode === 200) {
      console.log("✅ Delete Product: PASSED");
      console.log("   Status:", response.statusCode);
      console.log("   Message:", response.data.message);
      return true;
    } else {
      console.log("❌ Delete Product: FAILED");
      console.log("   Status:", response.statusCode);
      console.log("   Response:", response.data);
      return false;
    }
  } catch (error) {
    console.log("❌ Delete Product: ERROR");
    console.log("   Error:", error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Testing E-commerce API at:", BASE_URL);
  console.log("=".repeat(60));

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Health Check
  totalTests++;
  if (await testHealthCheck()) passedTests++;

  // Test 2: User Registration
  totalTests++;
  const token = await testUserRegistration();
  if (token) passedTests++;

  // Test 3: Get Products
  totalTests++;
  if (await testGetProducts()) passedTests++;

  // Test 4: Create Product (if we have a token)
  if (token) {
    totalTests++;
    const productId = await testCreateProduct(token);
    if (productId) {
      passedTests++;

      // Test 5: Delete Product (if we created one)
      totalTests++;
      if (await testDeleteProduct(token, productId)) passedTests++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);

  if (passedTests === totalTests) {
    console.log("\n🎉 ALL TESTS PASSED! Your API is working perfectly!");
    console.log("\n🔗 Your API is live at:", BASE_URL);
    console.log(
      "\n📮 You can now use the Postman collection to test all endpoints."
    );
  } else {
    console.log("\n⚠️ Some tests failed. Check the logs above for details.");
  }

  console.log("\n🛠️ Next Steps:");
  console.log(
    "1. Import the updated Postman collection (postman_collection_v2.json)"
  );
  console.log(
    "2. Import the production environment (postman_environment_production.json)"
  );
  console.log('3. Select "Production (Render)" environment in Postman');
  console.log("4. Test all endpoints using the Postman collection");
}

// Run the tests
runTests().catch(console.error);
