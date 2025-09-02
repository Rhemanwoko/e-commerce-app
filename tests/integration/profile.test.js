const request = require("supertest");
const { app } = require("../../src/app");
const User = require("../../src/models/User");
const { generateToken } = require("../../src/utils/jwt");
const { connectTestDB, clearTestDB, closeTestDB } = require("../setup/testDb");

describe("Profile Integration Tests", () => {
  let testUser;
  let testAdmin;
  let customerToken;
  let adminToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test customer
    testUser = new User({
      fullName: "Test Customer",
      email: "customer@test.com",
      password: "password123",
      role: "customer",
    });
    await testUser.save();

    // Create test admin
    testAdmin = new User({
      fullName: "Test Admin",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    });
    await testAdmin.save();

    // Generate tokens
    customerToken = generateToken({
      userId: testUser._id,
      email: testUser.email,
      role: testUser.role,
    });

    adminToken = generateToken({
      userId: testAdmin._id,
      email: testAdmin.email,
      role: testAdmin.role,
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("GET /profile", () => {
    it("should return customer profile successfully", async () => {
      const response = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Profile retrieved successfully",
        statusCode: 200,
      });

      expect(response.body.data).toMatchObject({
        _id: testUser._id.toString(),
        fullName: "Test Customer",
        email: "customer@test.com",
        role: "customer",
      });

      // Ensure password is not included
      expect(response.body.data.password).toBeUndefined();
    });

    it("should return admin profile successfully", async () => {
      const response = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Profile retrieved successfully",
        statusCode: 200,
      });

      expect(response.body.data).toMatchObject({
        _id: testAdmin._id.toString(),
        fullName: "Test Admin",
        email: "admin@test.com",
        role: "admin",
      });

      // Ensure password is not included
      expect(response.body.data.password).toBeUndefined();
    });

    it("should return 401 without authentication token", async () => {
      const response = await request(app).get("/profile").expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. No token provided.",
        statusCode: 401,
      });
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/profile")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Invalid token.",
        statusCode: 401,
      });
    });

    it("should return 404 if user is deleted after token generation", async () => {
      // Delete the user
      await User.findByIdAndDelete(testUser._id);

      const response = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "User not found",
        statusCode: 404,
      });
    });

    it("should include timestamps in profile response", async () => {
      const response = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it("should handle malformed Authorization header", async () => {
      const response = await request(app)
        .get("/profile")
        .set("Authorization", "InvalidFormat")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
      });
    });

    it("should return consistent response format", async () => {
      const response = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("statusCode");

      expect(typeof response.body.success).toBe("boolean");
      expect(typeof response.body.message).toBe("string");
      expect(typeof response.body.data).toBe("object");
      expect(typeof response.body.statusCode).toBe("number");
    });
  });
});
