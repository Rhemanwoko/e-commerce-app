const request = require("supertest");
const { app } = require("../../src/app");
const User = require("../../src/models/User");
const Order = require("../../src/models/Order");
const { generateToken } = require("../../src/utils/jwt");
const socketService = require("../../src/services/socketService");
const { connectTestDB, clearTestDB, closeTestDB } = require("../setup/testDb");

// Mock socket service
jest.mock("../../src/services/socketService");

describe("Socket.io Notifications Integration Tests", () => {
  let customer, admin;
  let customerToken, adminToken;
  let testOrder;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();

    // Create test users
    customer = new User({
      fullName: "Test Customer",
      email: "customer@test.com",
      password: "password123",
      role: "customer",
    });
    await customer.save();

    admin = new User({
      fullName: "Test Admin",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    });
    await admin.save();

    // Generate tokens
    customerToken = generateToken({
      userId: customer._id,
      email: customer.email,
      role: customer.role,
    });

    adminToken = generateToken({
      userId: admin._id,
      email: admin.email,
      role: admin.role,
    });

    // Create test order
    testOrder = new Order({
      customerId: customer._id,
      items: [
        {
          productName: "Test Product",
          productId: customer._id, // Using customer ID as placeholder
          ownerId: admin._id,
          quantity: 1,
          totalCost: 50.0,
        },
      ],
      totalAmount: 50.0,
      shippingStatus: "pending",
      orderNumber: "ORD-TEST-001",
    });
    await testOrder.save();

    // Mock socket service methods
    socketService.sendOrderStatusNotification = jest.fn().mockReturnValue(true);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("Order Status Update Notifications", () => {
    it("should send notification when order status is updated", async () => {
      const response = await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "shipped" })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order status updated successfully",
        statusCode: 200,
      });

      // Verify notification was sent
      expect(socketService.sendOrderStatusNotification).toHaveBeenCalledWith(
        customer._id,
        "shipped"
      );
      expect(socketService.sendOrderStatusNotification).toHaveBeenCalledTimes(
        1
      );
    });

    it("should send notification with correct customer ID and status", async () => {
      await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "delivered" })
        .expect(200);

      expect(socketService.sendOrderStatusNotification).toHaveBeenCalledWith(
        customer._id,
        "delivered"
      );
    });

    it("should continue order update even if notification fails", async () => {
      // Mock notification failure
      socketService.sendOrderStatusNotification.mockReturnValue(false);

      const response = await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "shipped" })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order status updated successfully",
        statusCode: 200,
      });

      // Verify order was still updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.shippingStatus).toBe("shipped");
    });

    it("should handle socket service throwing errors gracefully", async () => {
      // Mock notification throwing error
      socketService.sendOrderStatusNotification.mockImplementation(() => {
        throw new Error("Socket connection failed");
      });

      const response = await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "shipped" })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order status updated successfully",
        statusCode: 200,
      });

      // Verify order was still updated despite notification error
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.shippingStatus).toBe("shipped");
    });

    it("should not send notification for invalid order updates", async () => {
      await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "invalid_status" })
        .expect(400);

      // Verify no notification was sent for invalid update
      expect(socketService.sendOrderStatusNotification).not.toHaveBeenCalled();
    });

    it("should not send notification for non-existent orders", async () => {
      const fakeOrderId = "507f1f77bcf86cd799439011";

      await request(app)
        .put(`/orders/${fakeOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "shipped" })
        .expect(404);

      // Verify no notification was sent for non-existent order
      expect(socketService.sendOrderStatusNotification).not.toHaveBeenCalled();
    });

    it("should require admin role for order status updates", async () => {
      await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ shippingStatus: "shipped" })
        .expect(403);

      // Verify no notification was sent for unauthorized update
      expect(socketService.sendOrderStatusNotification).not.toHaveBeenCalled();
    });

    it("should send notification for each status change", async () => {
      // First status change
      await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "shipped" })
        .expect(200);

      // Second status change
      await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "delivered" })
        .expect(200);

      // Verify notifications were sent for both changes
      expect(socketService.sendOrderStatusNotification).toHaveBeenCalledTimes(
        2
      );
      expect(socketService.sendOrderStatusNotification).toHaveBeenNthCalledWith(
        1,
        customer._id,
        "shipped"
      );
      expect(socketService.sendOrderStatusNotification).toHaveBeenNthCalledWith(
        2,
        customer._id,
        "delivered"
      );
    });

    it("should send notification even when status remains the same", async () => {
      // Update to same status
      await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "pending" })
        .expect(200);

      // Verify notification was still sent
      expect(socketService.sendOrderStatusNotification).toHaveBeenCalledWith(
        customer._id,
        "pending"
      );
    });
  });

  describe("Socket Service Integration", () => {
    it("should call socket service with correct notification format", async () => {
      await request(app)
        .put(`/orders/${testOrder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ shippingStatus: "shipped" })
        .expect(200);

      // Verify the socket service was called with the expected parameters
      expect(socketService.sendOrderStatusNotification).toHaveBeenCalledWith(
        expect.any(Object), // customer._id (ObjectId)
        "shipped"
      );

      // Get the actual call arguments
      const [customerId, status] =
        socketService.sendOrderStatusNotification.mock.calls[0];
      expect(customerId.toString()).toBe(customer._id.toString());
      expect(status).toBe("shipped");
    });

    it("should handle multiple concurrent order updates", async () => {
      // Create another order for the same customer
      const secondOrder = new Order({
        customerId: customer._id,
        items: [
          {
            productName: "Second Product",
            productId: customer._id,
            ownerId: admin._id,
            quantity: 2,
            totalCost: 100.0,
          },
        ],
        totalAmount: 100.0,
        shippingStatus: "pending",
        orderNumber: "ORD-TEST-002",
      });
      await secondOrder.save();

      // Update both orders concurrently
      const promises = [
        request(app)
          .put(`/orders/${testOrder._id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ shippingStatus: "shipped" }),
        request(app)
          .put(`/orders/${secondOrder._id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ shippingStatus: "delivered" }),
      ];

      const responses = await Promise.all(promises);

      // Verify both updates succeeded
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Verify notifications were sent for both orders
      expect(socketService.sendOrderStatusNotification).toHaveBeenCalledTimes(
        2
      );
    });
  });
});
