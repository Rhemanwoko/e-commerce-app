const axios = require("axios");

const BASE_URL = "https://e-commerce-app-2jf2.onrender.com";

// Sample data for testing
const BRANDS = [
  "Nike",
  "Adidas",
  "Apple",
  "Samsung",
  "Sony",
  "Microsoft",
  "Google",
  "Amazon",
  "Tesla",
  "BMW",
  "Mercedes",
  "Audi",
  "Toyota",
  "Honda",
  "Ford",
];

const PRODUCT_TEMPLATES = {
  Nike: [
    {
      name: "Air Max 270",
      price: 150,
      description: "Comfortable running shoes with Air Max technology",
    },
    {
      name: "Air Force 1",
      price: 90,
      description: "Classic basketball shoes with timeless style",
    },
    {
      name: "React Infinity Run",
      price: 160,
      description: "Premium running shoes for long distances",
    },
    {
      name: "Blazer Mid",
      price: 100,
      description: "Vintage basketball shoes with modern comfort",
    },
    {
      name: "Dunk Low",
      price: 110,
      description: "Iconic skateboarding shoes with street style",
    },
    {
      name: "Air Jordan 1",
      price: 170,
      description: "Legendary basketball shoes with premium materials",
    },
    {
      name: "Pegasus 38",
      price: 130,
      description: "Versatile running shoes for daily training",
    },
    {
      name: "Cortez",
      price: 70,
      description: "Classic retro running shoes with heritage design",
    },
  ],
  Adidas: [
    {
      name: "Ultraboost 22",
      price: 180,
      description: "Energy-returning running shoes with Boost technology",
    },
    {
      name: "Stan Smith",
      price: 80,
      description: "Iconic tennis shoes with minimalist design",
    },
    {
      name: "Gazelle",
      price: 90,
      description: "Vintage-inspired sneakers with suede upper",
    },
    {
      name: "NMD R1",
      price: 140,
      description: "Modern street shoes with responsive cushioning",
    },
    {
      name: "Superstar",
      price: 85,
      description: "Classic shell-toe shoes with three stripes",
    },
    {
      name: "Yeezy Boost 350",
      price: 220,
      description: "Premium lifestyle shoes with Boost sole",
    },
    {
      name: "Continental 80",
      price: 100,
      description: "Retro tennis shoes with vintage appeal",
    },
  ],
  Apple: [
    {
      name: "iPhone 15 Pro",
      price: 999,
      description: "Latest flagship smartphone with A17 Pro chip",
    },
    {
      name: "MacBook Air M2",
      price: 1199,
      description: "Lightweight laptop with M2 chip performance",
    },
    {
      name: 'iPad Pro 12.9"',
      price: 1099,
      description: "Professional tablet with M2 chip and Liquid Retina display",
    },
    {
      name: "Apple Watch Series 9",
      price: 399,
      description: "Advanced smartwatch with health monitoring",
    },
    {
      name: "AirPods Pro 2",
      price: 249,
      description: "Premium wireless earbuds with active noise cancellation",
    },
    {
      name: "Mac Studio",
      price: 1999,
      description: "Compact desktop computer for professionals",
    },
    {
      name: "Studio Display",
      price: 1599,
      description: "27-inch 5K Retina display for creative work",
    },
  ],
  Samsung: [
    {
      name: "Galaxy S24 Ultra",
      price: 1199,
      description: "Premium Android smartphone with S Pen",
    },
    {
      name: "Galaxy Tab S9",
      price: 799,
      description: "High-performance Android tablet for productivity",
    },
    {
      name: "Galaxy Watch 6",
      price: 329,
      description: "Advanced smartwatch with health tracking",
    },
    {
      name: "Galaxy Buds2 Pro",
      price: 229,
      description: "Premium wireless earbuds with ANC",
    },
    {
      name: "Neo QLED 4K TV",
      price: 1499,
      description: "65-inch smart TV with quantum dot technology",
    },
    {
      name: "Galaxy Book3 Pro",
      price: 1349,
      description: "Lightweight laptop for professionals",
    },
  ],
  Sony: [
    {
      name: "PlayStation 5",
      price: 499,
      description: "Next-generation gaming console with 4K gaming",
    },
    {
      name: "WH-1000XM5",
      price: 399,
      description: "Industry-leading noise canceling headphones",
    },
    {
      name: "A7 IV Camera",
      price: 2499,
      description: "Full-frame mirrorless camera for professionals",
    },
    {
      name: "BRAVIA XR TV",
      price: 1799,
      description: "75-inch 4K HDR smart TV with cognitive intelligence",
    },
    {
      name: "WF-1000XM4",
      price: 279,
      description: "Premium wireless earbuds with noise cancellation",
    },
    {
      name: "FX3 Cinema Camera",
      price: 3899,
      description: "Professional cinema camera for filmmakers",
    },
  ],
};

async function populateTestData() {
  console.log("🚀 Populating Database with Test Data for Pagination");
  console.log("============================================================");

  let adminToken = "";
  const createdBrands = {};
  let totalProductsCreated = 0;

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
      // Try to register if login fails
      const adminRegister = await axios.post(`${BASE_URL}/auth/register`, {
        fullName: "Test Admin",
        email: `admin${Date.now()}@test.com`,
        password: "admin123",
        role: "admin",
      });
      adminToken = adminRegister.data.data.token;
      console.log("✅ Admin registered successfully");
    }

    // Step 2: Create Brands
    console.log("\n2️⃣ Creating Brands...");
    for (const brandName of BRANDS) {
      try {
        const brandResponse = await axios.post(
          `${BASE_URL}/brands`,
          {
            brandName: brandName,
          },
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        createdBrands[brandName] = brandResponse.data.data._id;
        console.log(
          `✅ Created brand: ${brandName} (ID: ${brandResponse.data.data._id})`
        );

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        if (
          error.response?.status === 400 &&
          error.response?.data?.message?.includes("already exists")
        ) {
          // Brand already exists, get its ID
          const brandsResponse = await axios.get(`${BASE_URL}/brands`);
          const existingBrand = brandsResponse.data.data.find(
            (b) => b.brandName === brandName
          );
          if (existingBrand) {
            createdBrands[brandName] = existingBrand._id;
            console.log(
              `ℹ️ Brand already exists: ${brandName} (ID: ${existingBrand._id})`
            );
          }
        } else {
          console.log(`❌ Failed to create brand ${brandName}:`, error.message);
        }
      }
    }

    // Step 3: Create Products for Each Brand
    console.log("\n3️⃣ Creating Products...");
    for (const [brandName, products] of Object.entries(PRODUCT_TEMPLATES)) {
      const brandId = createdBrands[brandName];
      if (!brandId) {
        console.log(`⚠️ Skipping products for ${brandName} - brand not found`);
        continue;
      }

      console.log(`\n📦 Creating products for ${brandName}...`);

      for (const product of products) {
        try {
          const productResponse = await axios.post(
            `${BASE_URL}/products`,
            {
              productName: product.name,
              brand: brandId,
              cost: product.price,
              description: product.description,
              stockStatus: "In Stock",
              productImages: [
                `https://example.com/${brandName.toLowerCase()}-${product.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}.jpg`,
              ],
            },
            {
              headers: { Authorization: `Bearer ${adminToken}` },
            }
          );

          totalProductsCreated++;
          console.log(`  ✅ Created: ${product.name} - $${product.price}`);

          // Small delay to avoid overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 150));
        } catch (error) {
          console.log(
            `  ❌ Failed to create ${product.name}:`,
            error.response?.data?.message || error.message
          );
        }
      }
    }

    // Step 4: Create Additional Products for Better Pagination Testing
    console.log("\n4️⃣ Creating Additional Products for Pagination Testing...");
    const additionalProducts = [
      { brand: "Nike", name: "Air Max 90", price: 120 },
      { brand: "Nike", name: "Air Max 95", price: 170 },
      { brand: "Nike", name: "Air Max 97", price: 160 },
      { brand: "Nike", name: "Air Max Plus", price: 150 },
      { brand: "Adidas", name: "Samba", price: 90 },
      { brand: "Adidas", name: "Campus", price: 85 },
      { brand: "Adidas", name: "Forum Low", price: 100 },
      { brand: "Apple", name: "Mac Mini M2", price: 599 },
      { brand: "Apple", name: 'iMac 24"', price: 1299 },
      { brand: "Samsung", name: "Galaxy A54", price: 449 },
      { brand: "Samsung", name: "Galaxy Z Fold5", price: 1799 },
    ];

    for (const product of additionalProducts) {
      const brandId = createdBrands[product.brand];
      if (!brandId) continue;

      try {
        await axios.post(
          `${BASE_URL}/products`,
          {
            productName: product.name,
            brand: brandId,
            cost: product.price,
            description: `Additional ${product.brand} product for pagination testing`,
            stockStatus: "In Stock",
            productImages: [
              `https://example.com/${product.brand.toLowerCase()}-${product.name
                .toLowerCase()
                .replace(/\s+/g, "-")}.jpg`,
            ],
          },
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        totalProductsCreated++;
        console.log(
          `  ✅ Created additional: ${product.name} (${product.brand})`
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.log(
          `  ❌ Failed to create additional ${product.name}:`,
          error.message
        );
      }
    }

    // Step 5: Display Summary and Test Instructions
    console.log(
      "\n============================================================"
    );
    console.log("🎉 DATA POPULATION COMPLETE!");
    console.log("============================================================");
    console.log(`✅ Brands created: ${Object.keys(createdBrands).length}`);
    console.log(`✅ Products created: ${totalProductsCreated}`);

    console.log("\n📋 PAGINATION TEST EXAMPLES:");
    console.log("============================================================");

    // Show some example pagination URLs
    const topBrands = Object.entries(createdBrands).slice(0, 5);
    for (const [brandName, brandId] of topBrands) {
      console.log(`\n🏷️ ${brandName} (ID: ${brandId}):`);
      console.log(
        `   Page 1 (5 items): GET ${BASE_URL}/products/${brandId}/1/5`
      );
      console.log(
        `   Page 2 (5 items): GET ${BASE_URL}/products/${brandId}/2/5`
      );
      console.log(
        `   Page 1 (3 items): GET ${BASE_URL}/products/${brandId}/1/3`
      );
    }

    console.log("\n🧪 POSTMAN TESTING STEPS:");
    console.log("============================================================");
    console.log("1. GET /brands - See all available brands");
    console.log("2. Copy a brand ID from the response");
    console.log("3. GET /products/{brandId}/1/5 - First page, 5 items");
    console.log("4. GET /products/{brandId}/2/5 - Second page, 5 items");
    console.log("5. GET /products/{brandId}/1/3 - First page, 3 items");
    console.log("6. Check pagination metadata in responses");

    console.log("\n🔍 WHAT TO LOOK FOR:");
    console.log("============================================================");
    console.log("• currentPage: Current page number");
    console.log("• totalPages: Total number of pages");
    console.log("• totalProducts: Total products for this brand");
    console.log("• hasNextPage: Boolean if more pages exist");
    console.log("• hasPrevPage: Boolean if previous pages exist");
    console.log("• limit: Items per page");
    console.log("• Brand information populated in each product");
  } catch (error) {
    console.error("\n❌ Population failed:", error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, error.response.data);
    }
  }
}

populateTestData();
