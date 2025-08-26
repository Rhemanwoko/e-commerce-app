const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function completeOrderTest() {
  console.log("🔍 Complete Order Test (with real products)\n");

  try {
    // Step 1: Register and login as admin to create products
    console.log("1. Registering admin user...");
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Admin",
        email: "admin@test.com",
        password: "password123",
        role: "admin",
      });
      console.log("✅ Admin user registered successfully");
      console.log("Registration response:", registerResponse.status);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already exists")
      ) {
        console.log("⚠️ Admin user already exists");
      } else {
        console.log(
          "❌ Registration failed:",
          error.response?.status,
          error.response?.data
        );
        throw error;
      }
    }

    console.log("2. Logging in as admin...");
    let adminToken, adminId;
    try {
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: "admin@test.com",
        password: "password123",
      });
      adminToken = adminLogin.data.data.token;
      adminId = adminLogin.data.data.user.id;
      console.log("✅ Admin login successful");
      console.log("Admin ID:", adminId);
    } catch (loginError) {
      console.log(
        "❌ Admin login failed:",
        loginError.response?.status,
        loginError.response?.data
      );
      throw loginError;
    }

    // Step 2: Create a brand first
    console.log("\n3. Creating brand...");
    const brandResponse = await axios.post(
      `${BASE_URL}/brands`,
      {
        brandName: "Test Brand",
        brandDescription: "A test brand for orders",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const brandId = brandResponse.data.data._id;
    console.log("✅ Brand created:", brandId);

    // Step 3: Create a product
    console.log("\n4. Creating product...");
    const productResponse = await axios.post(
      `${BASE_URL}/products`,
      {
        productName: "Test Product for Order",
        productDescription: "A test product",
        cost: 25.99,
        brand: brandId,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const productId = productResponse.data.data._id;
    console.log("✅ Product created:", productId);

    // Step 4: Register and login as customer
    console.log("\n5. Registering customer...");
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Customer",
        email: "customer@test.com",
        password: "password123",
        role: "customer",
      });
      console.log("✅ Customer user registered");
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already exists")
      ) {
        console.log("⚠️ Customer user already exists");
      } else {
        throw error;
      }
    }

    console.log("6. Logging in as customer...");
    const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: "customer@test.com",
      password: "password123",
    });
    const customerToken = customerLogin.data.data.token;
    console.log("✅ Customer token obtained");

    // Step 5: Create order with real product
    console.log("\n7. Creating order with real product...");
    const orderData = {
      items: [
        {
          productName: "Test Product for Order",
          productId: productId,
          ownerId: adminId,
          quantity: 2,
          totalCost: 51.98,
        },
      ],
    };

    console.log("Order data:", JSON.stringify(orderData, null, 2));

    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Order created successfully!");
    console.log("Response:", orderResponse.status);
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

completeOrderTest();
