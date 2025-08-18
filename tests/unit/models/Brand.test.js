const mongoose = require("mongoose");
const Brand = require("../../../src/models/Brand");

describe("Brand Model", () => {
  beforeAll(async () => {
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
    // Clear brands collection before each test
    await Brand.deleteMany({});
  });

  describe("Brand Schema Validation", () => {
    test("should create a valid brand with required fields", async () => {
      const brandData = {
        brandName: "Nike",
      };

      const brand = new Brand(brandData);
      const savedBrand = await brand.save();

      expect(savedBrand._id).toBeDefined();
      expect(savedBrand.brandName).toBe("Nike");
      expect(savedBrand.createdAt).toBeDefined();
      expect(savedBrand.updatedAt).toBeDefined();
    });

    test("should fail validation when brandName is missing", async () => {
      const brand = new Brand({});

      let error;
      try {
        await brand.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.brandName).toBeDefined();
      expect(error.errors.brandName.message).toBe("Brand name is required");
    });

    test("should fail validation when brandName is empty string", async () => {
      const brand = new Brand({ brandName: "" });

      let error;
      try {
        await brand.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.brandName).toBeDefined();
    });

    test("should trim whitespace from brandName", async () => {
      const brand = new Brand({ brandName: "  Adidas  " });
      const savedBrand = await brand.save();

      expect(savedBrand.brandName).toBe("Adidas");
    });

    test("should enforce unique constraint on brandName", async () => {
      // Create first brand
      const brand1 = new Brand({ brandName: "Puma" });
      await brand1.save();

      // Try to create second brand with same name
      const brand2 = new Brand({ brandName: "Puma" });

      let error;
      try {
        await brand2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    test("should enforce unique constraint case-sensitively", async () => {
      // Create first brand
      const brand1 = new Brand({ brandName: "Apple" });
      await brand1.save();

      // Try to create second brand with different case - should succeed
      const brand2 = new Brand({ brandName: "APPLE" });
      const savedBrand2 = await brand2.save();

      expect(savedBrand2._id).toBeDefined();
      expect(savedBrand2.brandName).toBe("APPLE");
    });

    test("should automatically add timestamps", async () => {
      const brand = new Brand({ brandName: "Samsung" });
      const savedBrand = await brand.save();

      expect(savedBrand.createdAt).toBeDefined();
      expect(savedBrand.updatedAt).toBeDefined();
      expect(savedBrand.createdAt).toBeInstanceOf(Date);
      expect(savedBrand.updatedAt).toBeInstanceOf(Date);
    });

    test("should update updatedAt timestamp when modified", async () => {
      const brand = new Brand({ brandName: "Sony" });
      const savedBrand = await brand.save();
      const originalUpdatedAt = savedBrand.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update the brand
      savedBrand.brandName = "Sony Electronics";
      const updatedBrand = await savedBrand.save();

      expect(updatedBrand.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("Brand Model Methods", () => {
    test("should convert to JSON properly", async () => {
      const brand = new Brand({ brandName: "LG" });
      const savedBrand = await brand.save();
      const brandJSON = savedBrand.toJSON();

      expect(brandJSON).toHaveProperty("_id");
      expect(brandJSON).toHaveProperty("brandName", "LG");
      expect(brandJSON).toHaveProperty("createdAt");
      expect(brandJSON).toHaveProperty("updatedAt");
    });

    test("should find brand by name", async () => {
      const brand = new Brand({ brandName: "Microsoft" });
      await brand.save();

      const foundBrand = await Brand.findOne({ brandName: "Microsoft" });
      expect(foundBrand).toBeDefined();
      expect(foundBrand.brandName).toBe("Microsoft");
    });

    test("should find all brands", async () => {
      const brands = [
        new Brand({ brandName: "HP" }),
        new Brand({ brandName: "Dell" }),
        new Brand({ brandName: "Lenovo" }),
      ];

      await Promise.all(brands.map((brand) => brand.save()));

      const allBrands = await Brand.find();
      expect(allBrands).toHaveLength(3);

      const brandNames = allBrands.map((brand) => brand.brandName).sort();
      expect(brandNames).toEqual(["Dell", "HP", "Lenovo"]);
    });
  });
});
