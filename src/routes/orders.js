const express = require("express");
const {
  createOrder,
  createOrderValidation,
  getAllOrders,
  getOrderById,
  getOrderByIdValidation,
  updateOrderStatus,
  updateOrderStatusValidation,
} = require("../controllers/orderController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin, authorize } = require("../middleware/authorize");

const router = express.Router();

// POST /orders - Create a new order (customers only)
router.post(
  "/",
  authenticate,
  authorize("customer"),
  createOrderValidation,
  createOrder
);

// GET /orders - Get all orders (admin only)
router.get("/", authenticate, requireAdmin, getAllOrders);

// GET /orders/:id - Get order by ID (admin only)
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  getOrderByIdValidation,
  getOrderById
);

// PUT /orders/:id/status - Update order status (admin only)
router.put(
  "/:id/status",
  authenticate,
  requireAdmin,
  updateOrderStatusValidation,
  updateOrderStatus
);

module.exports = router;
