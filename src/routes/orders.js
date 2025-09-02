const express = require("express");
const {
  createOrder,
  createOrderValidation,
  getAllOrders,
  getOrderById,
  getOrderByIdValidation,
  updateOrderStatus,
  updateOrderStatusValidation,
  getOrderHistory,
} = require("../controllers/orderController");
const { authenticate } = require("../middleware/auth");
const { authorize, requireAdmin } = require("../middleware/authorize");

const router = express.Router();

/**
 * @route POST /orders
 * @desc Create a new order
 * @access Private (Customer only)
 */
router.post(
  "/",
  authenticate,
  authorize("customer"),
  createOrderValidation,
  createOrder
);

/**
 * @route GET /orders
 * @desc Get all orders (admin only)
 * @access Private (Admin only)
 */
router.get("/", authenticate, requireAdmin, getAllOrders);

/**
 * @route GET /orders/order-history
 * @desc Get order history (customers see their orders, admins see all)
 * @access Private (Customer/Admin)
 */
router.get("/order-history", authenticate, getOrderHistory);

/**
 * @route GET /orders/:id
 * @desc Get order by ID
 * @access Private (Admin only)
 */
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  getOrderByIdValidation,
  getOrderById
);

/**
 * @route PUT /orders/:id/status
 * @desc Update order status
 * @access Private (Admin only)
 */
router.put(
  "/:id/status",
  authenticate,
  requireAdmin,
  updateOrderStatusValidation,
  updateOrderStatus
);

module.exports = router;
