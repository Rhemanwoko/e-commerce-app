const request = require("supertest");
const mongoose = require("mongoose");
const { app, initializeApp } = require("../../src/app");
const User = require("../../src/models/User");
const Brand = require("../../src/models/Brand");
const { generateToken } = require("../../src/utils/jwt");

describe("Brand Endpoints", () => {
  let adminToken;
  let customerToken;
  let adminUser;
  let customerUser;

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

    // Create test users
    adminUser = new User({
      fullName: "Admin User",
      email: "admin@test.com",
      password: "hashedpassword123",
      role: "admin",
    });
    await adminUser.save();

    customerUser = new User({
      fullName: "Customer User",
      email: "customer@test.com",
      password: "hashedpassword123",
      role: "customer",
    });
    await customerUser.save();

    // Generate tokens
    adminToken = generateToken({
      userId: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
    });

    customerToken = generateToken({
      userId: customerUser._id,
      email: customerUser.email,
      role: customerUser.role,
    });
  });

  describe("POST /brands", () => {
    test("should create a new brand with valid admin token", async () => {
      const brandData = {
        brandName: "Nike",
      };

      const response = await request(app)
        .post("/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(brandData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Brand created successfully");
      expect(response.body.data.brandName).toBe("Nike");
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();

      // Verify brand was saved to database
      const savedBrand = await Brand.findById(response.body.data._id);
      expect(savedBrand).toBeDefined();
      expect(savedBrand.brandName).toBe("Nike");
    });

    test("should fail to create brand without authentication", async () => {
      const brandData = {
        brandName: "Adidas",
      };

      const response = await request(app)
        .post("/brands")
        .send(brandData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("token");
    });

    test("should fail to create brand with customer token", async () => {
      const brandData = {
        brandName: "Puma",
      };

      const response = await request(app)
        .post("/brands")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(brandData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("admin");
    });

    test("should fail validation with missing brandName", async () => {
      const response = await request(app)
        .post("/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    test("should fail validation with empty brandName", async () => {
      const response = await request(app)
        .post("/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ brandName: "" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    test("should fail validation with brandName too short", async () => {
      const response = await request(app)
        .post("/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ brandName: "A" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    test("should fail to create duplicate brand", async () => {
      // Create first brand
      const brand = new Brand({ brandName: "Samsung" });
      await brand.save();

      // Try to create duplicate
      const response = await request(app)
        .post("/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ brandName: "Samsung" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Brand already exists");
    });
  });

  describe("GET /brands", () => {
    test("should get all brands without authentication", async () => {
      // Create test brands
      const brands = [
        new Brand({ brandName: "Apple" }),
        new Brand({ brandName: "Google" }),
        new Brand({ brandName: "Microsoft" }),
      ];
      await Promise.all(brands.map((brand) => brand.save()));

      const response = await request(app).get("/brands").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Brands retrieved successfully");
      expect(response.body.data).toHaveLength(3);

      const brandNames = response.body.data
        .map((brand) => brand.brandName)
        .sort();
      expect(brandNames).toEqual(["Apple", "Google", "Microsoft"]);
    });

    test("should return empty array when no brands exist", async () => {
      const response = await request(app).get("/brands").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    test("should return brands sorted by name", async () => {
      // Create brands in random order
      const brands = [
        new Brand({ brandName: "Zebra" }),
        new Brand({ brandName: "Alpha" }),
        new Brand({ brandName: "Beta" }),
      ];
      await Promise.all(brands.map((brand) => brand.save()));

      const response = await request(app).get("/brands").expect(200);

      const brandNames = response.body.data.map((brand) => brand.brandName);
      expect(brandNames).toEqual(["Alpha", "Beta", "Zebra"]);
    });
  });

  describe("PUT /brands/:id", () => {
    let testBrand;

    beforeEach(async () => {
      testBrand = new Brand({ brandName: "Original Brand" });
      await testBrand.save();
    });

    test("should update brand with valid admin token", async () => {
      const updateData = {
        brandName: "Updated Brand",
      };

      const response = await request(app)
        .put(`/brands/${testBrand._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Brand updated successfully");
      expect(response.body.data.brandName).toBe("Updated Brand");

      // Verify update in database
      const updatedBrand = await Brand.findById(testBrand._id);
      expect(updatedBrand.brandName).toBe("Updated Brand");
    });

    test("should fail to update brand without authentication", async () => {
      const response = await request(app)
        .put(`/brands/${testBrand._id}`)
        .send({ brandName: "New Name" })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test("should fail to update brand with customer token", async () => {
      const response = await request(app)
        .put(`/brands/${testBrand._id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ brandName: "New Name" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test("should fail to update non-existent brand", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/brands/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ brandName: "New Name" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Brand not found");
    });

    test("should fail to update with duplicate brand name", async () => {
      // Create another brand
      const anotherBrand = new Brand({ brandName: "Another Brand" });
      await anotherBrand.save();

      const response = await request(app)
        .put(`/brands/${testBrand._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ brandName: "Another Brand" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Brand name already exists");
    });
  });

  describe("DELETE /brands/:id", () => {
    let testBrand;

    beforeEach(async () => {
      testBrand = new Brand({ brandName: "Brand to Delete" });
      await testBrand.save();
    });

    test("should delete brand with valid admin token", async () => {
      const response = await request(app)
        .delete(`/brands/${testBrand._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Brand deleted successfully");

      // Verify deletion in database
      const deletedBrand = await Brand.findById(testBrand._id);
      expect(deletedBrand).toBeNull();
    });

    test("should fail to delete brand without authentication", async () => {
      const response = await request(app)
        .delete(`/brands/${testBrand._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);

      // Verify brand still exists
      const stillExists = await Brand.findById(testBrand._id);
      expect(stillExists).toBeDefined();
    });

    test("should fail to delete brand with customer token", async () => {
      const response = await request(app)
        .delete(`/brands/${testBrand._id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify brand still exists
      const stillExists = await Brand.findById(testBrand._id);
      expect(stillExists).toBeDefined();
    });

    test("should fail to delete non-existent brand", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/brands/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Brand not found");
    });
  });
});
