const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testProductCreation() {
  console.log("🔍 Simple Product Creation Test");
  console.log("================================");

  try {
    // Step 1: Register Admin
    console.log("1️⃣ Registering Admin...");
    const adminRegister = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: "Debug Admin",
      email: `debugadmin${Date.now()}@test.com`,
      password: "admin123",
      role: "admin",
    });
    const adminToken = adminRegister.data.data.token;
    console.log("✅ Admin registered successfully");

    // Step 2: Create Brand
    console.log("\n2️⃣ Creating Brand...");
    const brandResponse = await axios.post(
      `${BASE_URL}/brands`,
      { brandName: `DebugBrand_${Date.now()}` },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const brandId = brandResponse.data.data._id;
    console.log("✅ Brand created:", brandId);
    console.log("Brand Response Structure:");
    console.log(JSON.stringify(brandResponse.data, null, 2));

    // Step 3: Create Product
    console.log("\n3️⃣ Creating Product...");
    const productResponse = await axios.post(
      `${BASE_URL}/products`,
      {
        productName: "Debug Test Product",
        brand: brandId,
        cost: 99.99,
        description: "Test product for debugging API response",
        stockStatus: "In Stock",
        productImages: ["https://example.com/debug.jpg"],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    console.log("\n📋 FULL PRODUCT RESPONSE:");
    console.log("==========================");
    console.log(JSON.stringify(productResponse.data, null, 2));

    console.log("\n🔍 RESPONSE ANALYSIS:");
    console.log("=====================");
    console.log("Response status:", productResponse.status);
    console.log("Response.data exists:", !!productResponse.data);
    console.log("Response.data.data exists:", !!productResponse.data.data);
    console.log("Response.data keys:", Object.keys(productResponse.data));

    if (productResponse.data.data) {
      console.log(
        "Response.data.data keys:",
        Object.keys(productResponse.data.data)
      );
      console.log("Product ID:", productResponse.data.data._id);
      console.log("Product Name:", productResponse.data.data.productName);
      console.log("Product Cost:", productResponse.data.data.cost);
      console.log("Product Owner:", productResponse.data.data.ownerId);
    }
  } catch (error) {
    console.log("❌ Test failed:", error.message);
    if (error.response) {
      console.log("Error Status:", error.response.status);
      console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

console.log("🚨 Make sure your local server is running: npm run dev\n");
testProductCreation();
