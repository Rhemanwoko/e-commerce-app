const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function debugOrderCreation() {
  try {
    console.log("🔍 Debugging order creation issue...\n");

    // Create test customer
    const customerData = {
      fullName: "Debug Customer",
      email: `debug_customer_${Date.now()}@test.com`,
      password: "customer123",
      role: "customer",
    };

    const adminData = {
      fullName: "Debug Admin",
      email: `debug_admin_${Date.now()}@test.com`,
      password: "admin123",
      role: "admin",
    };

    // Register users
    console.log("1. Registering users...");
    await axios.post(`${BASE_URL}/auth/register`, customerData);
    await axios.post(`${BASE_URL}/auth/register`, adminData);
    console.log("✅ Users registered");

    // Login and check token data
    console.log("\n2. Logging in and checking token data...");
    const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: customerData.email,
      password: customerData.password,
    });

    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminData.email,
      password: adminData.password,
    });

    console.log("Customer login response:", {
      role: customerLogin.data.data.user.role,
      id: customerLogin.data.data.user._id,
    });

    console.log("Admin login response:", {
      role: adminLogin.data.data.user.role,
      id: adminLogin.data.data.user._id,
    });

    const customerToken = customerLogin.data.data.token;
    const adminToken = adminLogin.data.data.token;
    const adminId = adminLogin.data.data.user._id;

    // Test profile endpoints to verify authentication
    console.log("\n3. Testing profile endpoints...");
    const customerProfile = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log(
      "Customer profile role:",
      customerProfile.data.data.profile.role
    );

    // Create brand and product
    console.log("\n4. Creating test brand and product...");
    const brand = await axios.post(
      `${BASE_URL}/brands`,
      {
        brandName: `Debug Brand ${Date.now()}`,
        description: "Debug brand",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    const product = await axios.post(
      `${BASE_URL}/products`,
      {
        productName: `Debug Product ${Date.now()}`,
        description: "Debug product",
        cost: 25.99,
        stockStatus: "in-stock",
        productImages: ["https://example.com/debug.jpg"],
        brand: brand.data.data._id,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log("✅ Brand and product created");
    console.log(
      "Product response structure:",
      JSON.stringify(product.data, null, 2)
    );

    // Try to create order with detailed error logging
    console.log("\n5. Attempting to create order...");
    const orderData = {
      items: [
        {
          productName: product.data.data.product.productName,
          productId: product.data.data.product._id,
          ownerId: adminId,
          quantity: 1,
          totalCost: 25.99,
        },
      ],
    };

    console.log("Order data:", JSON.stringify(orderData, null, 2));
    console.log(
      "Customer token (first 50 chars):",
      customerToken.substring(0, 50) + "..."
    );

    try {
      const order = await axios.post(`${BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      console.log("✅ Order created successfully!");
      console.log("Order ID:", order.data.data.order._id);
    } catch (orderError) {
      console.log("❌ Order creation failed:");
      console.log("Status:", orderError.response?.status);
      console.log("Error:", orderError.response?.data);

      // Check if it's an authorization issue
      if (orderError.response?.status === 403) {
        console.log("\n🔍 Authorization debugging:");
        console.log('- Customer role should be "customer"');
        console.log('- Route allows ["customer"] roles');
        console.log("- Check if JWT token contains correct role");
      }
    }
  } catch (error) {
    console.error("❌ Debug failed:", error.response?.data || error.message);
  }
}

debugOrderCreation();
