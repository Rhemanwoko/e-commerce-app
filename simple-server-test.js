const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testBasicEndpoints() {
  try {
    console.log("🔍 Testing basic server functionality...\n");

    // Test health endpoint
    console.log("1. Testing health endpoint...");
    const health = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check:", health.data.status);

    // Test registration
    console.log("\n2. Testing user registration...");
    const testUser = {
      fullName: "Test User",
      email: `test_${Date.now()}@example.com`,
      password: "test123",
      role: "customer",
    };

    const register = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log("✅ Registration successful");

    // Test login
    console.log("\n3. Testing user login...");
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    const token = login.data.data.token;
    console.log("✅ Login successful");

    // Test profile endpoint
    console.log("\n4. Testing profile endpoint...");
    const profile = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Profile retrieved:", profile.data.data.profile.fullName);

    console.log("\n🎉 All basic tests passed! Server is working correctly.");
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error.response?.data?.message || error.message
    );
    if (error.code === "ECONNREFUSED") {
      console.error("💡 Server is not running. Start it with: npm run dev");
    }
  }
}

testBasicEndpoints();
