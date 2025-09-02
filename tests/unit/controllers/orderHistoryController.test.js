const { getOrderHistory } = require("../../../src/controllers/orderController");
const Order = require("../../../src/models/Order");
const { logger } = require("../../../src/utils/logger");

// Mock dependencies
jest.mock("../../../src/models/Order");
jest.mock("../../../src/utils/logger");

describe("Order History Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        userId: "507f1f77bcf86cd799439011",
        role: "customer",
      },
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getOrderHistory", () => {
    const mockOrders = [
      {
        _id: "507f1f77bcf86cd799439021",
        customerId: "507f1f77bcf86cd799439011",
        orderNumber: "ORD-123456",
        totalAmount: 100.0,
        shippingStatus: "pending",
        items: [],
        createdAt: new Date(),
      },
      {
        _id: "507f1f77bcf86cd799439022",
        customerId: "507f1f77bcf86cd799439011",
        orderNumber: "ORD-123457",
        totalAmount: 150.0,
        shippingStatus: "shipped",
        items: [],
        createdAt: new Date(),
      },
    ];

    const mockPaginationResult = {
      docs: mockOrders,
      page: 1,
      totalPages: 1,
      totalDocs: 2,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it("should return customer orders for customer role", async () => {
      Order.paginate.mockResolvedValue(mockPaginationResult);

      await getOrderHistory(req, res);

      expect(Order.paginate).toHaveBeenCalledWith(
        { customerId: "507f1f77bcf86cd799439011" },
        expect.objectContaining({
          page: 1,
          limit: 10,
          sort: { createdAt: -1 },
          populate: expect.any(Array),
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Order history retrieved successfully",
        data: {
          orders: mockOrders,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalOrders: 2,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        statusCode: 200,
      });
    });

    it("should return all orders for admin role", async () => {
      req.user.role = "admin";
      req.user.userId = "507f1f77bcf86cd799439012";

      Order.paginate.mockResolvedValue(mockPaginationResult);

      await getOrderHistory(req, res);

      expect(Order.paginate).toHaveBeenCalledWith(
        {}, // No customerId filter for admin
        expect.objectContaining({
          page: 1,
          limit: 10,
          sort: { createdAt: -1 },
          populate: expect.any(Array),
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle pagination parameters", async () => {
      req.query = { page: "2", limit: "5" };
      Order.paginate.mockResolvedValue({
        ...mockPaginationResult,
        page: 2,
        totalPages: 3,
      });

      await getOrderHistory(req, res);

      expect(Order.paginate).toHaveBeenCalledWith(
        { customerId: "507f1f77bcf86cd799439011" },
        expect.objectContaining({
          page: 2,
          limit: 5,
        })
      );
    });

    it("should handle status filter", async () => {
      req.query = { status: "shipped" };
      Order.paginate.mockResolvedValue(mockPaginationResult);

      await getOrderHistory(req, res);

      expect(Order.paginate).toHaveBeenCalledWith(
        {
          customerId: "507f1f77bcf86cd799439011",
          shippingStatus: "shipped",
        },
        expect.any(Object)
      );
    });

    it("should ignore invalid status filter", async () => {
      req.query = { status: "invalid_status" };
      Order.paginate.mockResolvedValue(mockPaginationResult);

      await getOrderHistory(req, res);

      expect(Order.paginate).toHaveBeenCalledWith(
        { customerId: "507f1f77bcf86cd799439011" },
        expect.any(Object)
      );
    });

    it("should handle empty order history", async () => {
      const emptyResult = {
        docs: [],
        page: 1,
        totalPages: 0,
        totalDocs: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };

      Order.paginate.mockResolvedValue(emptyResult);

      await getOrderHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Order history retrieved successfully",
        data: {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalOrders: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        statusCode: 200,
      });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      Order.paginate.mockRejectedValue(error);

      await getOrderHistory(req, res);

      expect(logger.logSystemError).toHaveBeenCalledWith(
        "Order history retrieval error",
        error,
        {
          userId: "507f1f77bcf86cd799439011",
          role: "customer",
        }
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
        error: undefined,
        statusCode: 500,
      });
    });

    it("should populate order relationships correctly", async () => {
      Order.paginate.mockResolvedValue(mockPaginationResult);

      await getOrderHistory(req, res);

      expect(Order.paginate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          populate: [
            {
              path: "customerId",
              select: "fullName email",
            },
            {
              path: "items.productId",
              select: "productName cost brand",
            },
            {
              path: "items.ownerId",
              select: "fullName email",
            },
          ],
        })
      );
    });

    it("should use default pagination values", async () => {
      req.query = {}; // No pagination params
      Order.paginate.mockResolvedValue(mockPaginationResult);

      await getOrderHistory(req, res);

      expect(Order.paginate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          page: 1,
          limit: 10,
        })
      );
    });

    it("should sort orders by creation date descending", async () => {
      Order.paginate.mockResolvedValue(mockPaginationResult);

      await getOrderHistory(req, res);

      expect(Order.paginate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sort: { createdAt: -1 },
        })
      );
    });

    it("should log successful order history retrieval", async () => {
      Order.paginate.mockResolvedValue(mockPaginationResult);

      await getOrderHistory(req, res);

      expect(logger.logInfo).toHaveBeenCalledWith(
        "order",
        "order_history_retrieved",
        "Order history retrieved for customer",
        {
          userId: "507f1f77bcf86cd799439011",
          totalOrders: 2,
          page: 1,
          role: "customer",
        }
      );
    });
  });
});
