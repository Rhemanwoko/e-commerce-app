const axios = require("axios");

const BASE_URL = process.env.API_URL || "http://localhost:3000";

async function debugDeleteTest() {
  console.log("🔍 Debug: Testing DELETE with real product ID\n");

  try {
    // First, get all products to find a real ID
    console.log("1. Getting all products to find a real ID...");
    const getResponse = await axios.get(`${BASE_URL}/products`);
    const products = getResponse.data.data.products;

    if (products.length === 0) {
      console.log("❌ No products found to test deletion");
      return;
    }

    const testProduct = products[0];
    console.log(
      `✅ Found product to test: ${testProduct._id} - "${testProduct.productName}"`
    );
    console.log(`Total products before: ${products.length}\n`);

    // Now try to delete without auth
    console.log("2. Attempting to DELETE without authorization...");
    console.log(`URL: ${BASE_URL}/products/${testProduct._id}`);

    try {
      const deleteResponse = await axios.delete(
        `${BASE_URL}/products/${testProduct._id}`,
        {
          headers: {
            // Explicitly no Authorization header
          },
        }
      );

      console.log("❌ CRITICAL SECURITY ISSUE: Delete succeeded without auth!");
      console.log("Status:", deleteResponse.status);
      console.log("Response:", deleteResponse.data);

      // Check if product count decreased
      const afterResponse = await axios.get(`${BASE_URL}/products`);
      console.log(
        `Products after deletion: ${afterResponse.data.data.products.length}`
      );
    } catch (error) {
      if (error.response) {
        console.log("✅ SECURE: Delete properly blocked");
        console.log("Status:", error.response.status);
        console.log("Response:", error.response.data);
      } else {
        console.log("❌ Network error:", error.message);
      }
    }
  } catch (error) {
    console.log("❌ Error during test:", error.message);
  }
}

debugDeleteTest().catch(console.error);
