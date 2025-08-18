const request = require("supertest");
const mongoose = require("mongoose");
const { app, initializeApp } = require("../../src/app");
const User = require("../../src/models/User");
const Brand = require("../../src/models/Brand");
const Product = require("../../src/models/Product");

describe("Products by Brand Pagination Endpoints", () => {
  let adminUser;
  let testBrand1;
  let testBrand2;

  beforeAll(async () => {
    // Initialize the app
    await initializeApp();

    // Connect to test database
    await mongoose.connect(
      process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/ecommerce_test"
    );
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});

    // Create test admin user
    adminUser = new User({
      fullName: "Admin User",
      email: "admin@test.com",
      password: "hashedpassword123",
      role: "admin",
    });
    await adminUser.save();

    // Create test brands
    testBrand1 = new Brand({ brandName: "Nike" });
    testBrand2 = new Brand({ brandName: "Adidas" });
    await testBrand1.save();
    await testBrand2.save();
  });

  describe("GET /products/:brand/:page/:limit", () => {
    test("should get paginated products for a specific brand", async () => {
      // Create test products for brand1
      const products = [];
      for (let i = 1; i <= 5; i++) {
        products.push(
          new Product({
            productName: `Nike Product ${i}`,
            ownerId: adminUser._id,
            brand: testBrand1._id,
            cost: 100 + i,
            description: `Description for Nike product ${i}`,
            stockStatus: "In Stock",
          })
        );
      }
      await Promise.all(products.map((p) => p.save()));

      // Create products for brand2 (should not appear in results)
      const adidasProduct = new Product({
        productName: "Adidas Product",
        ownerId: adminUser._id,
        brand: testBrand2._id,
        cost: 200,
        description: "Adidas product description",
        stockStatus: "In Stock",
      });
      await adidasProduct.save();

      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/3`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Products retrieved successfully");
      expect(response.body.data.products).toHaveLength(3);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.totalProducts).toBe(5);
      expect(response.body.data.pagination.limit).toBe(3);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPrevPage).toBe(false);

      // Verify all products belong to the correct brand
      response.body.data.products.forEach((product) => {
        expect(product.brand._id).toBe(testBrand1._id.toString());
        expect(product.brand.brandName).toBe("Nike");
        expect(product.ownerId).toBeDefined();
        expect(product.ownerId.fullName).toBe("Admin User");
      });
    });

    test("should get second page of paginated products", async () => {
      // Create 5 test products
      const products = [];
      for (let i = 1; i <= 5; i++) {
        products.push(
          new Product({
            productName: `Product ${i}`,
            ownerId: adminUser._id,
            brand: testBrand1._id,
            cost: 100 + i,
            description: `Description ${i}`,
            stockStatus: "In Stock",
          })
        );
      }
      await Promise.all(products.map((p) => p.save()));

      const response = await request(app)
        .get(`/products/${testBrand1._id}/2/3`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2); // Remaining products on page 2
      expect(response.body.data.pagination.currentPage).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(false);
      expect(response.body.data.pagination.hasPrevPage).toBe(true);
    });

    test("should return empty results for brand with no products", async () => {
      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/10`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(0);
      expect(response.body.data.pagination.totalProducts).toBe(0);
      expect(response.body.data.pagination.totalPages).toBe(0);
    });

    test("should fail with invalid brand ID format", async () => {
      const response = await request(app)
        .get("/products/invalid-id/1/10")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid brand ID format");
    });

    test("should fail with non-existent brand ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/products/${fakeId}/1/10`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Brand not found");
    });

    test("should fail with invalid page parameter", async () => {
      const response = await request(app)
        .get(`/products/${testBrand1._id}/0/10`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Page must be a positive number");
    });

    test("should fail with invalid page parameter (non-numeric)", async () => {
      const response = await request(app)
        .get(`/products/${testBrand1._id}/abc/10`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Page must be a positive number");
    });

    test("should fail with invalid limit parameter (too small)", async () => {
      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/0`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Limit must be between 1 and 100");
    });

    test("should fail with invalid limit parameter (too large)", async () => {
      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/101`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Limit must be between 1 and 100");
    });

    test("should fail with invalid limit parameter (non-numeric)", async () => {
      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/abc`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Limit must be between 1 and 100");
    });

    test("should populate brand and owner information correctly", async () => {
      const product = new Product({
        productName: "Test Product",
        ownerId: adminUser._id,
        brand: testBrand1._id,
        cost: 150,
        description: "Test product description",
        stockStatus: "In Stock",
        productImages: ["https://example.com/image1.jpg"],
      });
      await product.save();

      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/10`)
        .expect(200);

      expect(response.body.data.products).toHaveLength(1);

      const returnedProduct = response.body.data.products[0];
      expect(returnedProduct.brand).toBeDefined();
      expect(returnedProduct.brand._id).toBe(testBrand1._id.toString());
      expect(returnedProduct.brand.brandName).toBe("Nike");

      expect(returnedProduct.ownerId).toBeDefined();
      expect(returnedProduct.ownerId._id).toBe(adminUser._id.toString());
      expect(returnedProduct.ownerId.fullName).toBe("Admin User");
      expect(returnedProduct.ownerId.email).toBe("admin@test.com");

      // Verify all product fields are present
      expect(returnedProduct.productName).toBe("Test Product");
      expect(returnedProduct.cost).toBe(150);
      expect(returnedProduct.description).toBe("Test product description");
      expect(returnedProduct.stockStatus).toBe("In Stock");
      expect(returnedProduct.productImages).toEqual([
        "https://example.com/image1.jpg",
      ]);
    });

    test("should sort products by creation date (newest first)", async () => {
      // Create products with slight delays to ensure different timestamps
      const product1 = new Product({
        productName: "First Product",
        ownerId: adminUser._id,
        brand: testBrand1._id,
        cost: 100,
        description: "First product",
        stockStatus: "In Stock",
      });
      await product1.save();

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      const product2 = new Product({
        productName: "Second Product",
        ownerId: adminUser._id,
        brand: testBrand1._id,
        cost: 200,
        description: "Second product",
        stockStatus: "In Stock",
      });
      await product2.save();

      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/10`)
        .expect(200);

      expect(response.body.data.products).toHaveLength(2);
      // Newest should be first
      expect(response.body.data.products[0].productName).toBe("Second Product");
      expect(response.body.data.products[1].productName).toBe("First Product");
    });

    test("should handle maximum limit correctly", async () => {
      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/100`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.limit).toBe(100);
    });

    test("should work without authentication (public endpoint)", async () => {
      const product = new Product({
        productName: "Public Product",
        ownerId: adminUser._id,
        brand: testBrand1._id,
        cost: 100,
        description: "Public product description",
        stockStatus: "In Stock",
      });
      await product.save();

      const response = await request(app)
        .get(`/products/${testBrand1._id}/1/10`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });
  });
});
