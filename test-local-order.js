const axios = require("axios");

const BASE_URL = "http://localhost:3000"; // Local development server

async function testLocalOrderCreation() {
  console.log("🏠 Testing Order Creation Locally");
  console.log("==================================");

  let adminToken = "";
  let customerToken = "";

  try {
    // Step 1: Register Admin
    console.log("1️⃣ Registering Admin...");
    try {
      const adminRegister = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Local Admin",
        email: `localadmin${Date.now()}@test.com`,
        password: "admin123",
        role: "admin",
      });
      adminToken = adminRegister.data.data.token;
      console.log("✅ Admin registered successfully");
    } catch (error) {
      console.log("❌ Admin registration failed:", error.message);
      return;
    }

    // Step 2: Register Customer
    console.log("\n2️⃣ Registering Customer...");
    try {
      const customerRegister = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Local Customer",
        email: `localcustomer${Date.now()}@test.com`,
        password: "customer123",
        role: "customer",
      });
      customerToken = customerRegister.data.data.token;
      console.log("✅ Customer registered successfully");
    } catch (error) {
      console.log("❌ Customer registration failed:", error.message);
      return;
    }

    // Step 3: Create test brand and products
    console.log("\n3️⃣ Creating test data...");

    // Create brand with unique name
    let brandId;
    const uniqueBrandName = `LocalTestBrand_${Date.now()}`;

    try {
      const brandResponse = await axios.post(
        `${BASE_URL}/brands`,
        { brandName: uniqueBrandName },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      brandId = brandResponse.data.data._id;
      console.log(`✅ Created brand: ${uniqueBrandName} (${brandId})`);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already exists")
      ) {
        // If brand exists, get existing brands and use the first one
        console.log("⚠️ Brand creation failed, using existing brand...");
        const brandsResponse = await axios.get(`${BASE_URL}/brands`);
        const existingBrand = brandsResponse.data.data[0];
        brandId = existingBrand._id;
        console.log(
          `✅ Using existing brand: ${existingBrand.brandName} (${brandId})`
        );
      } else {
        throw error;
      }
    }

    // Create products
    const products = [];
    for (let i = 1; i <= 2; i++) {
      const productResponse = await axios.post(
        `${BASE_URL}/products`,
        {
          productName: `Local Test Product ${i}`,
          brand: brandId,
          cost: 99.99 * i,
          description: `Test product ${i} for local order creation`,
          stockStatus: "In Stock",
          productImages: [`https://example.com/product${i}.jpg`],
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      // Debug: Log the actual response structure
      console.log(
        `Product ${i} Response:`,
        JSON.stringify(productResponse.data, null, 2)
      );

      const productData = productResponse.data.data.product;

      // Extract ObjectId from populated ownerId field
      const ownerId =
        typeof productData.ownerId === "object" && productData.ownerId._id
          ? productData.ownerId._id
          : productData.ownerId;

      products.push({
        id: productData._id,
        name: productData.productName,
        cost: productData.cost,
        ownerId: ownerId,
      });
      console.log(
        `✅ Created product: ${productData.productName} (ID: ${productData._id}, Owner: ${ownerId})`
      );
    }

    // Step 4: Test Order Creation
    console.log("\n4️⃣ Testing Order Creation...");

    const orderData = {
      items: [
        {
          productName: products[0].name,
          productId: products[0].id,
          ownerId: products[0].ownerId,
          quantity: 1,
          totalCost: products[0].cost,
        },
        {
          productName: products[1].name,
          productId: products[1].id,
          ownerId: products[1].ownerId,
          quantity: 2,
          totalCost: products[1].cost * 2,
        },
      ],
    };

    console.log("📋 Local Order Data:");
    console.log(JSON.stringify(orderData, null, 2));

    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("\n🎉 LOCAL ORDER CREATION SUCCESSFUL!");
    console.log("====================================");
    console.log(`✅ Status: ${orderResponse.status}`);
    console.log(`✅ Order ID: ${orderResponse.data.data.order._id}`);
    console.log(
      `✅ Order Number: ${orderResponse.data.data.order.orderNumber}`
    );
    console.log(
      `✅ Total Amount: $${orderResponse.data.data.order.totalAmount}`
    );

    console.log("\n🎯 CONCLUSION:");
    console.log("===============");
    console.log("✅ Order creation works locally");
    console.log("❌ Production server has issues");
    console.log("🔧 Check Render logs and environment variables");
  } catch (error) {
    console.log("\n❌ LOCAL TEST FAILED!");
    console.log("======================");
    console.log(`Status: ${error.response?.status || "Unknown"}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);

    if (error.response?.data?.errors) {
      console.log("Validation Errors:");
      error.response.data.errors.forEach((err) => {
        console.log(`  • ${err.msg} (${err.param})`);
      });
    }
  }
}

console.log("🚨 IMPORTANT: Make sure your local server is running first!");
console.log("Run: npm run dev or node server.js\n");

testLocalOrderCreation();
