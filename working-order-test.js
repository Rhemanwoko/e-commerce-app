const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function workingOrderTest() {
  console.log("🔍 Working Order Test (using existing users)\n");

  try {
    // Step 1: Try to login with existing users or create new ones with unique emails
    console.log(
      "1. Attempting to login with existing admin or create new one..."
    );
    let adminToken, adminId;

    // Try different admin credentials that might exist
    const adminCredentials = [
      { email: "admin@test.com", password: "password123" },
      { email: "admin@example.com", password: "password123" },
      { email: "test@admin.com", password: "password123" },
    ];

    let adminLoginSuccess = false;

    for (const cred of adminCredentials) {
      try {
        console.log(`Trying admin login with ${cred.email}...`);
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, cred);
        adminToken = adminLogin.data.data.token;
        adminId = adminLogin.data.data.user._id;
        console.log("✅ Admin login successful with existing user");
        console.log("Admin ID:", adminId);
        adminLoginSuccess = true;
        break;
      } catch (error) {
        console.log(`❌ Failed with ${cred.email}`);
      }
    }

    // If no existing admin works, create a new one with unique email
    if (!adminLoginSuccess) {
      console.log("Creating new admin with unique email...");
      const uniqueEmail = `admin${Date.now()}@test.com`;

      await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Admin",
        email: uniqueEmail,
        password: "password123",
        role: "admin",
      });
      console.log("✅ New admin registered");

      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: uniqueEmail,
        password: "password123",
      });
      adminToken = adminLogin.data.data.token;
      adminId = adminLogin.data.data.user._id;
      console.log("✅ New admin login successful");
      console.log("Admin ID from login:", adminId);
    }

    // Step 2: Create a brand
    console.log("\n2. Creating brand...");
    const brandResponse = await axios.post(
      `${BASE_URL}/brands`,
      {
        brandName: `Test Brand ${Date.now()}`,
        brandDescription: "A test brand for orders",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const brandId = brandResponse.data.data._id;
    console.log("✅ Brand created:", brandId);

    // Step 3: Create a product
    console.log("\n3. Creating product...");
    const productResponse = await axios.post(
      `${BASE_URL}/products`,
      {
        productName: `Test Product ${Date.now()}`,
        brand: brandId,
        cost: 25.99,
        description:
          "A comprehensive test product for order creation testing with detailed specifications and features",
        stockStatus: "in-stock",
        productImages: [],
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const productId = productResponse.data.data.product._id;
    console.log("✅ Product created:", productId);
    console.log(
      "Product response structure:",
      JSON.stringify(productResponse.data, null, 2)
    );

    // Step 4: Create customer
    console.log("\n4. Creating customer...");
    const uniqueCustomerEmail = `customer${Date.now()}@test.com`;

    await axios.post(`${BASE_URL}/auth/register`, {
      fullName: "Test Customer",
      email: uniqueCustomerEmail,
      password: "password123",
      role: "customer",
    });
    console.log("✅ Customer registered");

    const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: uniqueCustomerEmail,
      password: "password123",
    });
    const customerToken = customerLogin.data.data.token;
    console.log("✅ Customer login successful");

    // Step 5: Create order with real product
    console.log("\n5. Creating order with real product...");
    const orderData = {
      items: [
        {
          productName: `Test Product ${Date.now()}`,
          productId: productId,
          ownerId: adminId,
          quantity: 2,
          totalCost: 51.98,
        },
      ],
    };

    console.log("Debug - Admin ID:", adminId);
    console.log("Debug - Product ID:", productId);
    console.log("Order data:", JSON.stringify(orderData, null, 2));

    console.log("\n🔍 Attempting order creation...");
    console.log(
      "Check server console for detailed error logs from order controller..."
    );

    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ ORDER CREATED SUCCESSFULLY!");
    console.log("Response status:", orderResponse.status);
    console.log("Order details:", JSON.stringify(orderResponse.data, null, 2));
  } catch (error) {
    console.log("❌ Test failed:");
    console.log("Status:", error.response?.status);
    console.log("Error:", JSON.stringify(error.response?.data, null, 2));

    if (error.code === "ECONNREFUSED") {
      console.log("\n🚨 Server is not running! Start with: npm start");
    }
  }
}

workingOrderTest();
