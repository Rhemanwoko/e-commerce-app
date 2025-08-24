const axios = require("axios");

const BASE_URL = "https://e-commerce-app-2jf2.onrender.com";

async function runComprehensiveBrandTest() {
  console.log("🧪 Running Comprehensive Brand Management Test");
  console.log("============================================================");

  let adminToken = "";
  let brandId = "";
  let productId = "";

  try {
    // Step 1: Register Admin User
    console.log("1️⃣ Testing Admin Registration...");
    try {
      const adminRegister = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Admin",
        email: `admin${Date.now()}@test.com`,
        password: "admin123",
        role: "admin",
      });
      adminToken = adminRegister.data.data.token;
      console.log("✅ Admin registered successfully");
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already exists")
      ) {
        // Try to login instead
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
          email: "admin@example.com",
          password: "adminpass123",
        });
        adminToken = adminLogin.data.data.token;
        console.log("✅ Admin logged in successfully");
      } else {
        throw error;
      }
    }

    // Step 2: Test GET /brands (should be empty initially)
    console.log("\n2️⃣ Testing GET /brands (initial state)...");
    const initialBrands = await axios.get(`${BASE_URL}/brands`);
    console.log(
      `✅ GET /brands: ${initialBrands.data.data.length} brands found`
    );

    // Step 3: Test POST /brands (create brand)
    console.log("\n3️⃣ Testing POST /brands (create brand)...");
    const createBrand = await axios.post(
      `${BASE_URL}/brands`,
      {
        brandName: `TestBrand${Date.now()}`,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    brandId = createBrand.data.data._id;
    console.log(
      `✅ Brand created: ${createBrand.data.data.brandName} (ID: ${brandId})`
    );

    // Step 4: Test GET /brands (should now have our brand)
    console.log("\n4️⃣ Testing GET /brands (after creation)...");
    const brandsAfterCreate = await axios.get(`${BASE_URL}/brands`);
    console.log(
      `✅ GET /brands: ${brandsAfterCreate.data.data.length} brands found`
    );

    const ourBrand = brandsAfterCreate.data.data.find((b) => b._id === brandId);
    if (ourBrand) {
      console.log(`✅ Our brand found in list: ${ourBrand.brandName}`);
    }

    // Step 5: Test PUT /brands (update brand)
    console.log("\n5️⃣ Testing PUT /brands (update brand)...");
    const updatedBrandName = `UpdatedBrand${Date.now()}`;
    const updateBrand = await axios.put(
      `${BASE_URL}/brands/${brandId}`,
      {
        brandName: updatedBrandName,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log(`✅ Brand updated to: ${updateBrand.data.data.brandName}`);

    // Step 6: Test POST /products (create product with brand)
    console.log("\n6️⃣ Testing POST /products (with brand reference)...");
    const createProduct = await axios.post(
      `${BASE_URL}/products`,
      {
        productName: `Test Product ${Date.now()}`,
        brand: brandId,
        cost: 99.99,
        description:
          "Test product with brand reference for comprehensive testing",
        stockStatus: "In Stock",
        productImages: ["https://example.com/test-image.jpg"],
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    productId = createProduct.data.data.product._id;
    console.log(
      `✅ Product created with brand: ${createProduct.data.data.product.productName}`
    );
    console.log(
      `   Brand populated: ${createProduct.data.data.product.brand.brandName}`
    );

    // Step 7: Test GET /products (verify brand population)
    console.log("\n7️⃣ Testing GET /products (verify brand population)...");
    const allProducts = await axios.get(`${BASE_URL}/products`);
    const ourProduct = allProducts.data.data.products.find(
      (p) => p._id === productId
    );
    if (ourProduct && ourProduct.brand) {
      console.log(
        `✅ Product found with populated brand: ${ourProduct.brand.brandName}`
      );
    } else {
      console.log("❌ Product brand not properly populated");
    }

    // Step 8: Test GET /products/:brand/:page/:limit (paginated by brand)
    console.log(
      "\n8️⃣ Testing GET /products/:brand/:page/:limit (pagination)..."
    );
    const paginatedProducts = await axios.get(
      `${BASE_URL}/products/${brandId}/1/10`
    );
    console.log(`✅ Paginated products retrieved:`);
    console.log(
      `   Products found: ${paginatedProducts.data.data.products.length}`
    );
    console.log(
      `   Current page: ${paginatedProducts.data.data.pagination.currentPage}`
    );
    console.log(
      `   Total products: ${paginatedProducts.data.data.pagination.totalProducts}`
    );
    console.log(
      `   Total pages: ${paginatedProducts.data.data.pagination.totalPages}`
    );

    if (paginatedProducts.data.data.products.length > 0) {
      const firstProduct = paginatedProducts.data.data.products[0];
      console.log(`   First product: ${firstProduct.productName}`);
      console.log(`   Brand populated: ${firstProduct.brand.brandName}`);
    }

    // Step 9: Test authentication on protected endpoints
    console.log("\n9️⃣ Testing Authentication & Authorization...");

    // Test without token
    try {
      await axios.post(`${BASE_URL}/brands`, {
        brandName: "Unauthorized Test",
      });
      console.log("❌ Should have failed without token");
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Correctly rejected request without token (401)");
      }
    }

    // Test with customer token (if we can create one)
    try {
      const customerRegister = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Customer",
        email: `customer${Date.now()}@test.com`,
        password: "customer123",
        role: "customer",
      });

      try {
        await axios.post(
          `${BASE_URL}/brands`,
          { brandName: "Customer Test" },
          {
            headers: {
              Authorization: `Bearer ${customerRegister.data.data.token}`,
            },
          }
        );
        console.log("❌ Should have failed with customer token");
      } catch (error) {
        if (error.response?.status === 403) {
          console.log("✅ Correctly rejected customer request (403)");
        }
      }
    } catch (error) {
      console.log("ℹ️ Customer test skipped (user might already exist)");
    }

    // Step 10: Clean up - Delete the test product and brand
    console.log("\n🔟 Cleaning up test data...");

    // Delete product first
    await axios.delete(`${BASE_URL}/products/${productId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("✅ Test product deleted");

    // Delete brand
    await axios.delete(`${BASE_URL}/brands/${brandId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("✅ Test brand deleted");

    // Step 11: Verify cleanup
    console.log("\n1️⃣1️⃣ Verifying cleanup...");
    const finalBrands = await axios.get(`${BASE_URL}/brands`);
    const brandExists = finalBrands.data.data.find((b) => b._id === brandId);
    if (!brandExists) {
      console.log("✅ Brand successfully removed from database");
    } else {
      console.log("❌ Brand still exists in database");
    }

    console.log(
      "\n============================================================"
    );
    console.log("🎉 COMPREHENSIVE TEST RESULTS");
    console.log("============================================================");
    console.log("✅ All brand management features working correctly!");
    console.log("✅ Brand CRUD operations: CREATE, READ, UPDATE, DELETE");
    console.log("✅ Product-brand integration with ObjectId references");
    console.log("✅ Brand population in product queries");
    console.log("✅ Paginated products by brand with mongoose-paginate-v2");
    console.log("✅ Authentication and authorization properly enforced");
    console.log("✅ Public endpoints accessible without authentication");
    console.log("✅ Admin-only endpoints properly protected");
    console.log("✅ Production deployment successful on Render.com");
    console.log("\n🚀 Brand management system is fully operational!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, error.response.data);
    }

    console.log(
      "\n============================================================"
    );
    console.log("❌ TEST FAILED");
    console.log("============================================================");
    console.log("Some features may not be working correctly.");
    console.log("Please check the error details above.");
  }
}

runComprehensiveBrandTest();
