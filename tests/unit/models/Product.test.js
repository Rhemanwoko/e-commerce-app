const Product = require("../../../src/models/Product");
const User = require("../../../src/models/User");
const Brand = require("../../../src/models/Brand");
const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
} = require("../../setup/testDb");

describe("Product Model", () => {
  let testUser;
  let testBrand;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create a test user for ownerId reference
    testUser = new User({
      fullName: "Test Owner",
      email: "owner@example.com",
      password: "password123",
      role: "admin",
    });
    await testUser.save();

    // Create a test brand for brand reference
    testBrand = new Brand({
      brandName: "Test Brand",
    });
    await testBrand.save();
  });

  describe("Product Creation", () => {
    it("should create a valid product", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        brand: testBrand._id,
        cost: 99.99,
        productImages: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
        description: "This is a test product description",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.productName).toBe(productData.productName);
      expect(savedProduct.ownerId.toString()).toBe(testUser._id.toString());
      expect(savedProduct.cost).toBe(productData.cost);
      expect(savedProduct.productImages).toEqual(productData.productImages);
      expect(savedProduct.description).toBe(productData.description);
      expect(savedProduct.stockStatus).toBe(productData.stockStatus);
      expect(savedProduct.createdAt).toBeDefined();
      expect(savedProduct.updatedAt).toBeDefined();
    });

    it("should create product with empty images array by default", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        cost: 50.0,
        description: "Product without images",
        stockStatus: "Available",
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.productImages).toEqual([]);
    });
  });

  describe("Product Validation", () => {
    it("should require productName", async () => {
      const productData = {
        ownerId: testUser._id,
        brand: testBrand._id,
        cost: 99.99,
        description: "Test description",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow("Product name is required");
    });

    it("should require ownerId", async () => {
      const productData = {
        productName: "Test Product",
        brand: testBrand._id,
        cost: 99.99,
        description: "Test description",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow("Owner ID is required");
    });

    it("should require brand", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        cost: 99.99,
        description: "Test description",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow("Brand is required");
    });

    it("should require cost", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        brand: testBrand._id,
        description: "Test description",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow("Product cost is required");
    });

    it("should require description", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        cost: 99.99,
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow(
        "Product description is required"
      );
    });

    it("should require stockStatus", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        cost: 99.99,
        description: "Test description",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow("Stock status is required");
    });

    it("should validate cost is not negative", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        cost: -10.0,
        description: "Test description",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow(
        "Product cost cannot be negative"
      );
    });

    it("should validate product images are valid URLs", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        cost: 99.99,
        productImages: ["invalid-url", "https://valid.com/image.jpg"],
        description: "Test description",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow(
        "All product images must be valid URLs"
      );
    });

    it("should validate description length", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        cost: 99.99,
        description: "Short", // Too short
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow(
        "Product description must be at least 10 characters long"
      );
    });

    it("should validate productName length", async () => {
      const productData = {
        productName: "A", // Too short
        ownerId: testUser._id,
        cost: 99.99,
        description: "Valid description here",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow(
        "Product name must be at least 2 characters long"
      );
    });
  });

  describe("Product Population", () => {
    it("should populate owner information", async () => {
      const productData = {
        productName: "Test Product",
        ownerId: testUser._id,
        cost: 99.99,
        description: "Test description",
        stockStatus: "In Stock",
      };

      const product = new Product(productData);
      await product.save();

      const populatedProduct = await Product.findById(product._id).populate(
        "ownerId",
        "fullName email"
      );

      expect(populatedProduct.ownerId.fullName).toBe(testUser.fullName);
      expect(populatedProduct.ownerId.email).toBe(testUser.email);
      expect(populatedProduct.ownerId.password).toBeUndefined(); // Should not include password
    });
  });
});
