const axios = require("axios");

const BASE_URL = "http://localhost:3000";

// Generate unique test data
const timestamp = Date.now();
const testData = {
  customer1: {
    fullName: "Customer One",
    email: `customer1_${timestamp}@test.com`,
    password: "password123",
    role: "customer",
  },
  customer2: {
    fullName: "Customer Two",
    email: `customer2_${timestamp}@test.com`,
    password: "password123",
    role: "customer",
  },
  admin: {
    fullName: "Test Admin",
    email: `admin_${timestamp}@test.com`,
    password: "password123",
    role: "admin",
  },
};

let tokens = { customer1: null, customer2: null, admin: null };
let userIds = { customer1: null, customer2: null, admin: null };

const makeRequest = async (method, endpoint, data = null, token = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  };

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        data: error.response.data,
        status: error.response.status,
        error: error.response.data.message || error.message,
      };
    }
    return { success: false, error: error.message, status: 0 };
  }
};

const debugOrderHistoryFiltering = async () => {
  console.log("🔍 DEBUG: Order History Role-based Filtering");
  console.log("=".repeat(50));

  try {
    // Register users
    console.log("\\n1. Registering test users...");

    for (const [key, userData] of Object.entries(testData)) {
      const response = await makeRequest("POST", "/auth/register", userData);
      if (!response.success) {
        throw new Error(`${key} registration failed: ${response.error}`);
      }
      tokens[key] = response.data.data.token;
      userIds[key] = response.data.data.user._id;
      console.log(`   ✅ ${key}: ${userData.email} (ID: ${userIds[key]})`);
    }

    // Create orders for different customers
    console.log("\\n2. Creating orders for different customers...");

    // Get a product first
    const productsResponse = await makeRequest("GET", "/products");
    if (
      !productsResponse.success ||
      !productsResponse.data.data.products.length
    ) {
      throw new Error("No products available");
    }

    const product = productsResponse.data.data.products[0];
    console.log(
      `   Using product: ${product.productName} (ID: ${product._id})`
    );

    // Create order for customer1
    const order1Data = {
      items: [
        {
          productName: product.productName,
          productId: product._id,
          ownerId: userIds.admin,
          quantity: 1,
          totalCost: product.cost || 50.0,
        },
      ],
    };

    const order1Response = await makeRequest(
      "POST",
      "/orders",
      order1Data,
      tokens.customer1
    );
    if (!order1Response.success) {
      throw new Error(
        `Customer1 order creation failed: ${order1Response.error}`
      );
    }
    console.log(
      `   ✅ Order created for customer1: ${order1Response.data.data.order._id}`
    );

    // Create order for customer2
    const order2Data = {
      items: [
        {
          productName: product.productName,
          productId: product._id,
          ownerId: userIds.admin,
          quantity: 2,
          totalCost: (product.cost || 50.0) * 2,
        },
      ],
    };

    const order2Response = await makeRequest(
      "POST",
      "/orders",
      order2Data,
      tokens.customer2
    );
    if (!order2Response.success) {
      throw new Error(
        `Customer2 order creation failed: ${order2Response.error}`
      );
    }
    console.log(
      `   ✅ Order created for customer2: ${order2Response.data.data.order._id}`
    );

    // Test customer1 order history
    console.log("\\n3. Testing customer1 order history...");
    const customer1HistoryResponse = await makeRequest(
      "GET",
      "/order-history",
      null,
      tokens.customer1
    );

    if (!customer1HistoryResponse.success) {
      throw new Error(
        `Customer1 order history failed: ${customer1HistoryResponse.error}`
      );
    }

    const customer1History = customer1HistoryResponse.data.data;
    console.log(
      `   📊 Customer1 sees ${customer1History.orders.length} orders`
    );

    // Check if customer1 only sees their own orders
    let customer1SeeingOwnOrdersOnly = true;
    for (const order of customer1History.orders) {
      const actualCustomerId =
        typeof order.customerId === "object"
          ? order.customerId._id
          : order.customerId;
      console.log(`   📋 Order ${order._id}: customerId = ${actualCustomerId}`);
      console.log(`   👤 Expected customerId: ${userIds.customer1}`);

      if (actualCustomerId !== userIds.customer1) {
        customer1SeeingOwnOrdersOnly = false;
        console.log(`   ❌ Customer1 seeing order from different customer!`);
        console.log(`   🔍 Order customerId: ${actualCustomerId}`);
        console.log(`   🔍 Customer1 ID: ${userIds.customer1}`);
        console.log(`   🔍 Customer2 ID: ${userIds.customer2}`);
      }
    }

    if (customer1SeeingOwnOrdersOnly) {
      console.log(`   ✅ Customer1 only sees own orders`);
    } else {
      console.log(
        `   ❌ Customer1 seeing orders from other customers - FILTERING FAILED`
      );
    }

    // Test customer2 order history
    console.log("\\n4. Testing customer2 order history...");
    const customer2HistoryResponse = await makeRequest(
      "GET",
      "/order-history",
      null,
      tokens.customer2
    );

    if (!customer2HistoryResponse.success) {
      throw new Error(
        `Customer2 order history failed: ${customer2HistoryResponse.error}`
      );
    }

    const customer2History = customer2HistoryResponse.data.data;
    console.log(
      `   📊 Customer2 sees ${customer2History.orders.length} orders`
    );

    // Check if customer2 only sees their own orders
    let customer2SeeingOwnOrdersOnly = true;
    for (const order of customer2History.orders) {
      const actualCustomerId =
        typeof order.customerId === "object"
          ? order.customerId._id
          : order.customerId;
      console.log(`   📋 Order ${order._id}: customerId = ${actualCustomerId}`);
      console.log(`   👤 Expected customerId: ${userIds.customer2}`);

      if (actualCustomerId !== userIds.customer2) {
        customer2SeeingOwnOrdersOnly = false;
        console.log(`   ❌ Customer2 seeing order from different customer!`);
      }
    }

    if (customer2SeeingOwnOrdersOnly) {
      console.log(`   ✅ Customer2 only sees own orders`);
    } else {
      console.log(
        `   ❌ Customer2 seeing orders from other customers - FILTERING FAILED`
      );
    }

    // Test admin order history
    console.log("\\n5. Testing admin order history...");
    const adminHistoryResponse = await makeRequest(
      "GET",
      "/order-history",
      null,
      tokens.admin
    );

    if (!adminHistoryResponse.success) {
      throw new Error(
        `Admin order history failed: ${adminHistoryResponse.error}`
      );
    }

    const adminHistory = adminHistoryResponse.data.data;
    console.log(`   📊 Admin sees ${adminHistory.orders.length} orders`);
    console.log(`   👑 Admin should see all orders in system`);

    // Summary
    console.log("\\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));

    if (customer1SeeingOwnOrdersOnly && customer2SeeingOwnOrdersOnly) {
      console.log("✅ ROLE-BASED FILTERING WORKING CORRECTLY");
      console.log("   - Customer1 only sees own orders");
      console.log("   - Customer2 only sees own orders");
      console.log(
        `   - Admin sees all orders (${adminHistory.orders.length} total)`
      );
    } else {
      console.log("❌ ROLE-BASED FILTERING FAILED");
      console.log("   - Customers are seeing orders from other customers");
      console.log("   - This indicates a bug in the filtering logic");
    }
  } catch (error) {
    console.error(`\\n💥 Debug failed: ${error.message}`);
    process.exit(1);
  }
};

debugOrderHistoryFiltering();
