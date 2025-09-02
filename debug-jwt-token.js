const axios = require("axios");
const jwt = require("jsonwebtoken");

const BASE_URL = "http://localhost:3000";

const debugJWTToken = async () => {
  console.log("🔍 JWT TOKEN DEBUG");
  console.log("=".repeat(25));

  try {
    // Register a user
    const timestamp = Date.now();
    const userData = {
      fullName: "Test User",
      email: `user${timestamp}@test.com`,
      password: "password123",
      role: "customer",
    };

    console.log("\\n1. Registering user...");
    const regResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
    const token = regResponse.data.data.token;
    const userId = regResponse.data.data.user._id;

    console.log(`   ✅ User registered: ${userId}`);
    console.log(`   🔑 Token: ${token.substring(0, 50)}...`);

    // Decode the token to see its structure
    console.log("\\n2. Decoding token...");
    try {
      const decoded = jwt.decode(token);
      console.log("   📋 Decoded token payload:");
      console.log(JSON.stringify(decoded, null, 2));

      // Check what fields are available
      console.log("\\n3. Token field analysis:");
      console.log(`   userId: ${decoded.userId || "NOT FOUND"}`);
      console.log(`   id: ${decoded.id || "NOT FOUND"}`);
      console.log(`   role: ${decoded.role || "NOT FOUND"}`);
      console.log(`   email: ${decoded.email || "NOT FOUND"}`);
    } catch (decodeError) {
      console.log("   ❌ Token decode failed:", decodeError.message);
    }

    // Verify the token
    console.log("\\n4. Verifying token...");
    try {
      const verified = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      console.log("   ✅ Token verification successful");
      console.log("   📋 Verified payload:");
      console.log(JSON.stringify(verified, null, 2));
    } catch (verifyError) {
      console.log("   ❌ Token verification failed:", verifyError.message);
    }
  } catch (error) {
    console.error(`\\n💥 Debug failed: ${error.message}`);
  }
};

debugJWTToken();
