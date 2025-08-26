const { body, param, validationResult } = require("express-validator");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { logger } = require("../utils/logger");

/**
 * Validation rules for creating an order
 */
const createOrderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Items must be an array with at least one item"),

  body("items.*.productName")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),

  body("items.*.productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),

  body("items.*.ownerId")
    .isMongoId()
    .withMessage("Owner ID must be a valid MongoDB ObjectId"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("items.*.totalCost")
    .isFloat({ min: 0 })
    .withMessage("Total cost must be a positive number"),

  body("items.*.shippingStatus")
    .optional()
    .isIn(["pending", "shipped", "delivered"])
    .withMessage("Shipping status must be one of: pending, shipped, delivered"),
];

/**
 * Validation rules for updating order status
 */
const updateOrderStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),

  body("shippingStatus")
    .isIn(["pending", "shipped", "delivered"])
    .withMessage("Shipping status must be one of: pending, shipped, delivered"),
];

/**
 * Validation rules for getting order by ID
 */
const getOrderByIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
];

/**
 * Create a new order (customers only)
 */
const createOrder = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        statusCode: 400,
      });
    }

    const { items } = req.body;
    const customerId = req.user.userId;

    // Verify that all products exist
    const productIds = items.map((item) => item.productId);
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products do not exist",
        statusCode: 400,
      });
    }

    // Create the order
    const totalAmount = items.reduce(
      (total, item) => total + item.totalCost,
      0
    );

    console.log("🔍 Order creation debug:");
    console.log("Customer ID:", customerId);
    console.log("Items:", JSON.stringify(items, null, 2));
    console.log("Total Amount:", totalAmount);

    const order = new Order({
      customerId,
      items: items.map((item) => ({
        productName: item.productName,
        productId: item.productId,
        ownerId: item.ownerId,
        quantity: item.quantity,
        totalCost: item.totalCost,
      })),
      totalAmount,
      shippingStatus: "pending",
      orderNumber: `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`,
    });

    console.log("🔍 Order object created, attempting to save...");
    try {
      await order.save();
      console.log("✅ Order saved successfully");
    } catch (saveError) {
      console.error("❌ Order save failed:", saveError);
      console.error("Error name:", saveError.name);
      console.error("Error message:", saveError.message);
      if (saveError.errors) {
        console.error(
          "Validation errors:",
          JSON.stringify(saveError.errors, null, 2)
        );
      }
      throw saveError;
    }

    // Populate the order with product and customer details
    console.log("🔍 Populating order details...");
    try {
      await order.populate([
        { path: "customerId", select: "fullName email" },
        { path: "items.productId", select: "productName cost brand" },
        { path: "items.ownerId", select: "fullName email" },
      ]);
      console.log("✅ Order populated successfully");
    } catch (populateError) {
      console.error("❌ Order populate failed:", populateError);
      throw populateError;
    }

    logger.logInfo(
      "order",
      "order_created",
      `Order ${order.orderNumber} created successfully`,
      {
        orderId: order._id,
        customerId,
        totalAmount: order.totalAmount,
        itemCount: items.length,
      }
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order,
      },
      statusCode: 201,
    });
  } catch (error) {
    logger.logSystemError("Order creation error", error, {
      customerId: req.user?.userId,
      itemCount: req.body?.items?.length,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      statusCode: 500,
    });
  }
};

/**
 * Get all orders (admin only)
 */
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};
    if (status && ["pending", "shipped", "delivered"].includes(status)) {
      filter.shippingStatus = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { path: "customerId", select: "fullName email" },
        { path: "items.productId", select: "productName cost brand" },
        { path: "items.ownerId", select: "fullName email" },
      ],
    };

    const orders = await Order.paginate(filter, options);

    logger.logInfo(
      "order",
      "orders_retrieved",
      `Retrieved ${orders.docs.length} orders`,
      {
        adminId: req.user.userId,
        page,
        limit,
        totalOrders: orders.totalDocs,
      }
    );

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders: orders.docs,
        pagination: {
          currentPage: orders.page,
          totalPages: orders.totalPages,
          totalOrders: orders.totalDocs,
          hasNextPage: orders.hasNextPage,
          hasPrevPage: orders.hasPrevPage,
        },
      },
      statusCode: 200,
    });
  } catch (error) {
    logger.logSystemError("Get all orders error", error, {
      adminId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      statusCode: 500,
    });
  }
};

/**
 * Get order by ID (admin only)
 */
const getOrderById = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        statusCode: 400,
      });
    }

    const { id } = req.params;

    const order = await Order.findById(id).populate([
      { path: "customerId", select: "fullName email" },
      { path: "items.productId", select: "productName cost brand description" },
      { path: "items.ownerId", select: "fullName email" },
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        statusCode: 404,
      });
    }

    logger.logInfo(
      "order",
      "order_retrieved",
      `Order ${order.orderNumber} retrieved`,
      {
        orderId: id,
        adminId: req.user.userId,
      }
    );

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: {
        order,
      },
      statusCode: 200,
    });
  } catch (error) {
    logger.logSystemError("Get order by ID error", error, {
      orderId: req.params?.id,
      adminId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      statusCode: 500,
    });
  }
};

/**
 * Update order status (admin only)
 */
const updateOrderStatus = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
        statusCode: 400,
      });
    }

    const { id } = req.params;
    const { shippingStatus } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        statusCode: 404,
      });
    }

    const oldStatus = order.shippingStatus;
    order.shippingStatus = shippingStatus;
    await order.save();

    // Populate the updated order
    await order.populate([
      { path: "customerId", select: "fullName email" },
      { path: "items.productId", select: "productName cost brand" },
      { path: "items.ownerId", select: "fullName email" },
    ]);

    logger.logInfo(
      "order",
      "order_status_updated",
      `Order ${order.orderNumber} status updated from ${oldStatus} to ${shippingStatus}`,
      {
        orderId: id,
        adminId: req.user.userId,
        oldStatus,
        newStatus: shippingStatus,
      }
    );

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: {
        order,
      },
      statusCode: 200,
    });
  } catch (error) {
    logger.logSystemError("Update order status error", error, {
      orderId: req.params?.id,
      adminId: req.user?.userId,
      newStatus: req.body?.shippingStatus,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      statusCode: 500,
    });
  }
};

module.exports = {
  createOrder,
  createOrderValidation,
  getAllOrders,
  getOrderById,
  getOrderByIdValidation,
  updateOrderStatus,
  updateOrderStatusValidation,
};
