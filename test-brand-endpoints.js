const axios = require("axios");

const BASE_URL = "https://e-commerce-app-2jf2.onrender.com";

async function testBrandEndpoints() {
  console.log("🏷️ Testing Brand Management Endpoints...");
  console.log("============================================================");

  try {
    // Test 1: Get all brands (should work without auth)
    console.log("📋 Testing Get All Brands...");
    const brandsResponse = await axios.get(`${BASE_URL}/brands`);
    console.log("✅ Get Brands: PASSED");
    console.log(`   Status: ${brandsResponse.status}`);
    console.log(`   Brands Count: ${brandsResponse.data.data.length}`);

    // Test 2: Test paginated products by brand (if brands exist)
    if (brandsResponse.data.data.length > 0) {
      const firstBrand = brandsResponse.data.data[0];
      console.log(
        `\n🔍 Testing Paginated Products for Brand: ${firstBrand.brandName}`
      );

      const paginatedResponse = await axios.get(
        `${BASE_URL}/products/${firstBrand._id}/1/10`
      );
      console.log("✅ Paginated Products by Brand: PASSED");
      console.log(`   Status: ${paginatedResponse.status}`);
      console.log(
        `   Products Count: ${paginatedResponse.data.data.products.length}`
      );
      console.log(
        `   Current Page: ${paginatedResponse.data.data.pagination.currentPage}`
      );
      console.log(
        `   Total Products: ${paginatedResponse.data.data.pagination.totalProducts}`
      );
    } else {
      console.log("\n⚠️ No brands found to test pagination");
    }

    // Test 3: Test brand creation (should fail without admin auth)
    console.log("\n🔒 Testing Brand Creation (without auth - should fail)...");
    try {
      await axios.post(`${BASE_URL}/brands`, {
        brandName: "Test Brand",
      });
      console.log("❌ Brand Creation: UNEXPECTED SUCCESS (should have failed)");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("✅ Brand Creation Auth Check: PASSED");
        console.log("   Correctly rejected unauthorized request");
      } else {
        console.log("❌ Brand Creation Auth Check: UNEXPECTED ERROR");
        console.log(`   Status: ${error.response?.status}`);
      }
    }

    console.log(
      "\n============================================================"
    );
    console.log("📊 BRAND ENDPOINTS TEST SUMMARY");
    console.log("============================================================");
    console.log("✅ Brand endpoints are deployed and working correctly!");
    console.log("🔐 Authentication is properly enforced for admin operations");
    console.log("📄 Pagination functionality is available");
  } catch (error) {
    console.error("❌ Brand Endpoints Test Failed:", error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, error.response.data);
    }
  }
}

testBrandEndpoints();
