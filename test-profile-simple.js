const axios = require("axios");

const BASE_URL = "http://localhost:3000";

// Test data with unique timestamps to avoid conflicts
const timestamp = Date.now();
const testCustomer = {
  fullName: "Test Customer",
  email: `testcustomer${timestamp}@example.com`,
  password: "password123",
  role: "customer",
};

const testAdmin = {
  fullName: "Test Admin",
  email: `testadmin${timestamp}@example.com`,
  password: "password123",
  role: "admin",
};

let customerToken = "";
let adminToken = "";

/**
 * Helper function to make authenticated requests
 */
const makeRequest = async (method, url, data = null, token = null) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {},
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

const runSimpleTest = async () => {
  console.log("🚀 Testing Profile & Order History Features");
  console.log("=".repeat(50));

  try {
    // Step 1: Register users
    console.log("\n1️⃣ Registering test users...");
    const customerReg = await makeRequest(
      "POST",
      "/auth/register",
      testCustomer
    );
    const adminReg = await makeRequest("POST", "/auth/register", testAdmin);

    if (!customerReg.success || !adminReg.success) {
      throw new Error("User registration failed");
    }

    customerToken = customerReg.data.token;
    adminToken = adminReg.data.token;
    console.log("   ✅ Users registered successfully");

    // Step 2: Test profile endpoints
    console.log("\n2️⃣ Testing profile endpoints...");

    // Test customer profile
    const customerProfile = await makeRequest(
      "GET",
      "/profile",
      null,
      customerToken
    );
    if (!customerProfile.success) {
      throw new Error("Customer profile failed");
    }
    if (customerProfile.data.password) {
      throw new Error("Password should not be in profile response");
    }
    console.log("   ✅ Customer profile endpoint working");

    // Test admin profile
    const adminProfile = await makeRequest("GET", "/profile", null, adminToken);
    if (!adminProfile.success) {
      throw new Error("Admin profile failed");
    }
    if (adminProfile.data.password) {
      throw new Error("Password should not be in admin profile response");
    }
    console.log("   ✅ Admin profile endpoint working");

    // Test unauthorized access
    const unauthorizedProfile = await makeRequest("GET", "/profile");
    if (unauthorizedProfile.success) {
      throw new Error("Profile should require authentication");
    }
    console.log("   ✅ Profile authentication working");

    // Step 3: Test order history endpoints
    console.log("\n3️⃣ Testing order history endpoints...");

    // Test customer order history
    const customerHistory = await makeRequest(
      "GET",
      "/order-history",
      null,
      customerToken
    );
    if (!customerHistory.success) {
      throw new Error("Customer order history failed");
    }
    console.log(
      `   ✅ Customer order history working (${customerHistory.data.orders.length} orders)`
    );

    // Test admin order history
    const adminHistory = await makeRequest(
      "GET",
      "/order-history",
      null,
      adminToken
    );
    if (!adminHistory.success) {
      throw new Error("Admin order history failed");
    }
    console.log(
      `   ✅ Admin order history working (${adminHistory.data.orders.length} orders)`
    );

    // Test unauthorized access
    const unauthorizedHistory = await makeRequest("GET", "/order-history");
    if (unauthorizedHistory.success) {
      throw new Error("Order history should require authentication");
    }
    console.log("   ✅ Order history authentication working");

    // Step 4: Test pagination
    console.log("\n4️⃣ Testing pagination...");
    const paginatedHistory = await makeRequest(
      "GET",
      "/order-history?page=1&limit=5",
      null,
      customerToken
    );
    if (!paginatedHistory.success) {
      throw new Error("Paginated order history failed");
    }
    if (!paginatedHistory.data.pagination) {
      throw new Error("Pagination data missing");
    }
    console.log("   ✅ Order history pagination working");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 ALL CORE FEATURES WORKING!");
    console.log("   ✅ Profile endpoints implemented");
    console.log("   ✅ Order history endpoints implemented");
    console.log("   ✅ Authentication working");
    console.log("   ✅ Pagination working");
    console.log("\n✨ User Profile & Order History features are functional!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
};

runSimpleTest();
