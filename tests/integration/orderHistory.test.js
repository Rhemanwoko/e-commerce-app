const request = require("supertest");
const { app } = require("../../src/app");
const User = require("../../src/models/User");
const Order = require("../../src/models/Order");
const { generateToken } = require("../../src/utils/jwt");
const { connectTestDB, clearTestDB, closeTestDB } = require("../setup/testDb");

describe("Order History Integration Tests", () => {
  let customer1, customer2, admin;
  let customer1Token, customer2Token, adminToken;
  let customer1Orders, customer2Orders;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test users
    customer1 = new User({
      fullName: "Customer One",
      email: "customer1@test.com",
      password: "password123",
      role: "customer",
    });
    await customer1.save();

    customer2 = new User({
      fullName: "Customer Two",
      email: "customer2@test.com",
      password: "password123",
      role: "customer",
    });
    await customer2.save();

    admin = new User({
      fullName: "Admin User",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    });
    await admin.save();

    // Generate tokens
    customer1Token = generateToken({
      userId: customer1._id,
      email: customer1.email,
      role: customer1.role,
    });

    customer2Token = generateToken({
      userId: customer2._id,
      email: customer2.email,
      role: customer2.role,
    });

    adminToken = generateToken({
      userId: admin._id,
      email: admin.email,
      role: admin.role,
    });

    // Create test orders for customer1
    customer1Orders = [
      new Order({
        customerId: customer1._id,
        items: [
          {
            productName: "Product 1",
            productId: customer1._id, // Using user ID as placeholder
            ownerId: admin._id,
            quantity: 2,
            totalCost: 50.0,
          },
        ],
        totalAmount: 50.0,
        shippingStatus: "pending",
        orderNumber: "ORD-001",
      }),
      new Order({
        customerId: customer1._id,
        items: [
          {
            productName: "Product 2",
            productId: customer1._id,
            ownerId: admin._id,
            quantity: 1,
            totalCost: 75.0,
          },
        ],
        totalAmount: 75.0,
        shippingStatus: "shipped",
        orderNumber: "ORD-002",
      }),
    ];

    // Create test orders for customer2
    customer2Orders = [
      new Order({
        customerId: customer2._id,
        items: [
          {
            productName: "Product 3",
            productId: customer2._id,
            ownerId: admin._id,
            quantity: 3,
            totalCost: 100.0,
          },
        ],
        totalAmount: 100.0,
        shippingStatus: "delivered",
        orderNumber: "ORD-003",
      }),
    ];

    // Save all orders
    await Promise.all([
      ...customer1Orders.map((order) => order.save()),
      ...customer2Orders.map((order) => order.save()),
    ]);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("GET /order-history", () => {
    it("should return only customer1 orders for customer1", async () => {
      const response = await request(app)
        .get("/order-history")
        .set("Authorization", `Bearer ${customer1Token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order history retrieved successfully",
        statusCode: 200,
      });

      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination.totalOrders).toBe(2);

      // Verify all orders belong to customer1
      response.body.data.orders.forEach((order) => {
        expect(order.customerId).toBe(customer1._id.toString());
      });
    });

    it("should return only customer2 orders for customer2", async () => {
      const response = await request(app)
        .get("/order-history")
        .set("Authorization", `Bearer ${customer2Token}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.pagination.totalOrders).toBe(1);

      // Verify order belongs to customer2
      expect(response.body.data.orders[0].customerId).toBe(
        customer2._id.toString()
      );
    });

    it("should return all orders for admin", async () => {
      const response = await request(app)
        .get("/order-history")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(3);
      expect(response.body.data.pagination.totalOrders).toBe(3);

      // Verify orders from both customers are included
      const customerIds = response.body.data.orders.map(
        (order) => order.customerId
      );
      expect(customerIds).toContain(customer1._id.toString());
      expect(customerIds).toContain(customer2._id.toString());
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/order-history").expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. No token provided.",
        statusCode: 401,
      });
    });

    it("should handle pagination correctly", async () => {
      const response = await request(app)
        .get("/order-history?page=1&limit=1")
        .set("Authorization", `Bearer ${customer1Token}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 2,
        totalOrders: 2,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it("should filter by shipping status", async () => {
      const response = await request(app)
        .get("/order-history?status=shipped")
        .set("Authorization", `Bearer ${customer1Token}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].shippingStatus).toBe("shipped");
    });

    it("should ignore invalid status filter", async () => {
      const response = await request(app)
        .get("/order-history?status=invalid")
        .set("Authorization", `Bearer ${customer1Token}`)
        .expect(200);

      // Should return all orders (no filtering applied)
      expect(response.body.data.orders).toHaveLength(2);
    });

    it("should return empty array when customer has no orders", async () => {
      // Create a new customer with no orders
      const newCustomer = new User({
        fullName: "New Customer",
        email: "new@test.com",
        password: "password123",
        role: "customer",
      });
      await newCustomer.save();

      const newCustomerToken = generateToken({
        userId: newCustomer._id,
        email: newCustomer.email,
        role: newCustomer.role,
      });

      const response = await request(app)
        .get("/order-history")
        .set("Authorization", `Bearer ${newCustomerToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(0);
      expect(response.body.data.pagination.totalOrders).toBe(0);
    });

    it("should sort orders by creation date descending", async () => {
      const response = await request(app)
        .get("/order-history")
        .set("Authorization", `Bearer ${customer1Token}`)
        .expect(200);

      const orders = response.body.data.orders;
      expect(orders).toHaveLength(2);

      // Verify orders are sorted by creation date (most recent first)
      const dates = orders.map((order) => new Date(order.createdAt));
      expect(dates[0].getTime()).toBeGreaterThanOrEqual(dates[1].getTime());
    });

    it("should include proper response structure", async () => {
      const response = await request(app)
        .get("/order-history")
        .set("Authorization", `Bearer ${customer1Token}`)
        .expect(200);

      // Check main response structure
      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("statusCode");

      // Check data structure
      expect(response.body.data).toHaveProperty("orders");
      expect(response.body.data).toHaveProperty("pagination");

      // Check pagination structure
      const pagination = response.body.data.pagination;
      expect(pagination).toHaveProperty("currentPage");
      expect(pagination).toHaveProperty("totalPages");
      expect(pagination).toHaveProperty("totalOrders");
      expect(pagination).toHaveProperty("hasNextPage");
      expect(pagination).toHaveProperty("hasPrevPage");
    });

    it("should handle invalid token", async () => {
      const response = await request(app)
        .get("/order-history")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Invalid token.",
        statusCode: 401,
      });
    });
  });
});
