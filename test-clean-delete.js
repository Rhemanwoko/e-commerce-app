const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testCleanDelete() {
  console.log("🧹 Testing DELETE with absolutely no auth headers\n");

  try {
    // Get a real product ID
    const getResponse = await axios.get(`${BASE_URL}/products`);
    const products = getResponse.data.data.products;

    if (products.length === 0) {
      console.log("❌ No products to test");
      return;
    }

    const productId = products[0]._id;
    console.log(`Testing with product ID: ${productId}\n`);

    // Try DELETE with explicitly empty headers
    const response = await axios({
      method: "DELETE",
      url: `${BASE_URL}/products/${productId}`,
      headers: {
        // Explicitly no Authorization header
      },
      validateStatus: () => true, // Don't throw on 4xx/5xx
    });

    console.log(`Status: ${response.status}`);
    console.log("Response:", response.data);

    if (response.status === 401) {
      console.log("✅ SECURE: Properly blocked unauthorized delete");
    } else if (response.status === 200) {
      console.log("❌ SECURITY ISSUE: Delete succeeded without auth!");
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

testCleanDelete();
