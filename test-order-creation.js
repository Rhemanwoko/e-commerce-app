const axios = require("axios");

const BASE_URL = "https://e-commerce-app-2jf2.onrender.com";
// For local testing, use: const BASE_URL = "http://localhost:3000";

async function testOrderCreation() {
  console.log("🧪 Testing POST Order Endpoint");
  console.log("===============================");

  let adminToken = "";
  let customerToken = "";
  const productData = [];

  try {
    // Step 1: Get Admin Token
    console.log("1️⃣ Getting Admin Token...");
    try {
      const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: "admin@example.com",
        password: "adminpass123",
      });
      adminToken = adminLogin.data.data.token;
      console.log("✅ Admin logged in successfully");
    } catch (error) {
      // Try to register admin if login fails
      const adminRegister = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Admin",
        email: `admin${Date.now()}@test.com`,
        password: "admin123",
        role: "admin",
      });
      adminToken = adminRegister.data.data.token;
      console.log("✅ Admin registered successfully");
    }

    // Step 2: Register/Login Customer
    console.log("\n2️⃣ Getting Customer Token...");
    try {
      const customerRegister = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Customer",
        email: `customer${Date.now()}@test.com`,
        password: "customer123",
        role: "customer",
      });
      customerToken = customerRegister.data.data.token;
      console.log("✅ Customer registered successfully");
    } catch (error) {
      console.log(
        "❌ Customer registration failed:",
        error.response?.data?.message || error.message
      );
      return;
    }

    // Step 3: Get real products
    console.log("\n3️⃣ Fetching real products...");
    const brandsResponse = await axios.get(`${BASE_URL}/brands`);
    const brands = brandsResponse.data.data;
    console.log(`✅ Found ${brands.length} brands`);

    // Get products from first available brand
    for (const brand of brands.slice(0, 3)) {
      try {
        const productsResponse = await axios.get(
          `${BASE_URL}/products/${brand._id}/1/5`
        );
        const products = productsResponse.data.data.products;

        console.log(
          `📦 Brand: ${brand.brandName} - ${products.length} products`
        );

        for (const product of products.slice(0, 2)) {
          // Extract the actual ObjectId from ownerId (it might be populated)
          let ownerId;
          if (typeof product.ownerId === "object" && product.ownerId._id) {
            ownerId = product.ownerId._id; // Extract ObjectId from populated field
          } else if (typeof product.ownerId === "string") {
            ownerId = product.ownerId; // Already a string ObjectId
          } else {
            ownerId = brand._id; // Fallback to brand ID
          }

          productData.push({
            productName: product.productName,
            productId: product._id,
            ownerId: ownerId,
            cost: product.cost,
            brand: brand.brandName,
          });
          console.log(
            `  • ${product.productName} - $${product.cost} (Owner: ${ownerId})`
          );
        }

        if (productData.length >= 2) break; // We have enough products
      } catch (error) {
        console.log(`❌ Failed to fetch products for ${brand.brandName}`);
      }
    }

    if (productData.length < 2) {
      console.log(
        "❌ Not enough products found. Running populate script first..."
      );

      // Try to create some test data
      try {
        // Create a test brand
        const brandResponse = await axios.post(
          `${BASE_URL}/brands`,
          { brandName: "TestBrand" },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        const brandId = brandResponse.data.data._id;
        console.log("✅ Created test brand");

        // Create test products
        const testProducts = [
          { name: "Test Product 1", price: 99.99 },
          { name: "Test Product 2", price: 149.99 },
        ];

        for (const testProduct of testProducts) {
          const productResponse = await axios.post(
            `${BASE_URL}/products`,
            {
              productName: testProduct.name,
              brand: brandId,
              cost: testProduct.price,
              description: "Test product for order creation",
              stockStatus: "In Stock",
              productImages: ["https://example.com/test.jpg"],
            },
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );

          productData.push({
            productName: testProduct.name,
            productId: productResponse.data.data._id,
            ownerId: brandId,
            cost: testProduct.price,
            brand: "TestBrand",
          });
          console.log(`✅ Created test product: ${testProduct.name}`);
        }
      } catch (error) {
        console.log(
          "❌ Failed to create test data:",
          error.response?.data?.message || error.message
        );
        return;
      }
    }

    // Step 4: Test Order Creation
    console.log("\n4️⃣ Testing Order Creation...");
    console.log("================================");

    const orderData = {
      items: [
        {
          productName: productData[0].productName,
          productId: productData[0].productId,
          ownerId: productData[0].ownerId,
          quantity: 1,
          totalCost: productData[0].cost,
        },
        {
          productName: productData[1].productName,
          productId: productData[1].productId,
          ownerId: productData[1].ownerId,
          quantity: 2,
          totalCost: productData[1].cost * 2,
        },
      ],
    };

    console.log("📋 Order Data:");
    console.log(JSON.stringify(orderData, null, 2));

    try {
      const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${customerToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("\n🎉 ORDER CREATION SUCCESSFUL!");
      console.log("===============================");
      console.log(`✅ Status: ${orderResponse.status}`);
      console.log(`✅ Order ID: ${orderResponse.data.data.order._id}`);
      console.log(
        `✅ Order Number: ${orderResponse.data.data.order.orderNumber}`
      );
      console.log(
        `✅ Total Amount: $${orderResponse.data.data.order.totalAmount}`
      );
      console.log(
        `✅ Shipping Status: ${orderResponse.data.data.order.shippingStatus}`
      );
      console.log(
        `✅ Items Count: ${orderResponse.data.data.order.items.length}`
      );

      // Step 5: Test Admin Order Retrieval
      console.log("\n5️⃣ Testing Admin Order Retrieval...");
      const orderId = orderResponse.data.data.order._id;

      try {
        const getOrderResponse = await axios.get(
          `${BASE_URL}/orders/${orderId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log("✅ Admin can retrieve order successfully");
        console.log(
          `✅ Retrieved order: ${getOrderResponse.data.data.order.orderNumber}`
        );
      } catch (error) {
        console.log(
          "❌ Admin order retrieval failed:",
          error.response?.data?.message || error.message
        );
      }

      console.log("\n🎯 POSTMAN COLLECTION DATA:");
      console.log("============================");
      console.log("Copy this JSON for your Postman 'Create Order' request:");
      console.log(JSON.stringify(orderData, null, 2));
    } catch (error) {
      console.log("\n❌ ORDER CREATION FAILED!");
      console.log("==========================");
      console.log(`Status: ${error.response?.status || "Unknown"}`);
      console.log(`Message: ${error.response?.data?.message || error.message}`);

      if (error.response?.data?.errors) {
        console.log("Validation Errors:");
        error.response.data.errors.forEach((err) => {
          console.log(`  • ${err.msg} (${err.param})`);
        });
      }

      if (error.response?.data) {
        console.log(
          "Full Response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, error.response.data);
    }
  }
}

// Run the test
testOrderCreation();
