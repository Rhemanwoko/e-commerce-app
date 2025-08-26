const axios = require("axios");

const BASE_URL = "https://e-commerce-app-2jf2.onrender.com";

async function debugOrderCreation() {
  console.log("🔍 Debug Order Creation - Step by Step");
  console.log("=======================================");

  let adminToken = "";
  let customerToken = "";

  try {
    // Step 1: Get Admin Token
    console.log("1️⃣ Getting Admin Token...");
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@example.com",
      password: "adminpass123",
    });
    adminToken = adminLogin.data.data.token;
    console.log("✅ Admin logged in successfully");

    // Step 2: Register Customer
    console.log("\n2️⃣ Getting Customer Token...");
    const customerRegister = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: "Debug Customer",
      email: `debug${Date.now()}@test.com`,
      password: "customer123",
      role: "customer",
    });
    customerToken = customerRegister.data.data.token;
    console.log("✅ Customer registered successfully");

    // Step 3: Test simple product lookup
    console.log("\n3️⃣ Testing product lookup...");
    const testProductIds = [
      "68a2f285e33915ee60b03cea",
      "68a2f284e33915ee60b03ce4",
    ];

    for (const productId of testProductIds) {
      try {
        // Test if we can find the product directly
        const productCheck = await axios.get(`${BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log(`✅ Products endpoint accessible`);
        break;
      } catch (error) {
        console.log(`❌ Product check failed: ${error.message}`);
      }
    }

    // Step 4: Test minimal order creation
    console.log("\n4️⃣ Testing minimal order creation...");

    // First, let's try with just one item and minimal data
    const minimalOrderData = {
      items: [
        {
          productName: "Forum Low",
          productId: "68a2f285e33915ee60b03cea",
          ownerId: "688d81344889e24209614e22",
          quantity: 1,
          totalCost: 100,
        },
      ],
    };

    console.log("📋 Minimal Order Data:");
    console.log(JSON.stringify(minimalOrderData, null, 2));

    try {
      console.log("\n🧪 Attempting order creation...");
      const orderResponse = await axios.post(
        `${BASE_URL}/orders`,
        minimalOrderData,
        {
          headers: {
            Authorization: `Bearer ${customerToken}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("🎉 SUCCESS! Order created:");
      console.log(`✅ Status: ${orderResponse.status}`);
      console.log(`✅ Order ID: ${orderResponse.data.data.order._id}`);
    } catch (error) {
      console.log("❌ Order creation failed with detailed info:");
      console.log(`Status: ${error.response?.status}`);
      console.log(`Status Text: ${error.response?.statusText}`);
      console.log(`Message: ${error.response?.data?.message || error.message}`);

      // Check if it's a timeout
      if (error.code === "ECONNABORTED") {
        console.log("⏰ Request timed out - server may be processing");
      }

      // Check response headers for more info
      if (error.response?.headers) {
        console.log("Response Headers:", error.response.headers);
      }

      // Full error details
      if (error.response?.data) {
        console.log("Full Response Data:");
        console.log(JSON.stringify(error.response.data, null, 2));
      }

      // Step 5: Test if the products actually exist
      console.log("\n5️⃣ Verifying products exist...");
      try {
        const brandsResponse = await axios.get(`${BASE_URL}/brands`);
        const brands = brandsResponse.data.data;
        console.log(`Found ${brands.length} brands`);

        if (brands.length > 0) {
          const firstBrand = brands[0];
          console.log(
            `Testing with brand: ${firstBrand.brandName} (${firstBrand._id})`
          );

          const productsResponse = await axios.get(
            `${BASE_URL}/products/${firstBrand._id}/1/3`
          );
          const products = productsResponse.data.data.products;
          console.log(
            `Found ${products.length} products in ${firstBrand.brandName}`
          );

          if (products.length > 0) {
            const product = products[0];
            console.log("✅ Sample product found:");
            console.log(`   Name: ${product.productName}`);
            console.log(`   ID: ${product._id}`);
            console.log(
              `   Owner: ${
                typeof product.ownerId === "object"
                  ? product.ownerId._id
                  : product.ownerId
              }`
            );
            console.log(`   Cost: $${product.cost}`);

            // Try order creation with this verified product
            console.log("\n6️⃣ Testing with verified product...");
            const verifiedOrderData = {
              items: [
                {
                  productName: product.productName,
                  productId: product._id,
                  ownerId:
                    typeof product.ownerId === "object"
                      ? product.ownerId._id
                      : product.ownerId,
                  quantity: 1,
                  totalCost: product.cost,
                },
              ],
            };

            console.log("📋 Verified Order Data:");
            console.log(JSON.stringify(verifiedOrderData, null, 2));

            const verifiedOrderResponse = await axios.post(
              `${BASE_URL}/orders`,
              verifiedOrderData,
              {
                headers: {
                  Authorization: `Bearer ${customerToken}`,
                  "Content-Type": "application/json",
                },
                timeout: 30000,
              }
            );

            console.log("🎉 SUCCESS with verified product!");
            console.log(
              `✅ Order ID: ${verifiedOrderResponse.data.data.order._id}`
            );
          }
        }
      } catch (verifyError) {
        console.log("❌ Product verification failed:", verifyError.message);
      }
    }
  } catch (error) {
    console.error("❌ Debug test failed:", error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
}

debugOrderCreation();
