const express = require("express");
const {
  getAllProducts,
  createProduct,
  createProductValidation,
  deleteProduct,
  deleteProductValidation,
  getProductsByBrand,
} = require("../controllers/productController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/authorize");

const router = express.Router();

// GET /products - Public endpoint
router.get("/", getAllProducts);

// GET /products/:brand/:page/:limit - Public endpoint for paginated products by brand
router.get("/:brand/:page/:limit", getProductsByBrand);

// POST /products - Admin only
router.post(
  "/",
  authenticate,
  requireAdmin,
  createProductValidation,
  createProduct
);

// DELETE /products/:id - Admin only
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteProductValidation,
  deleteProduct
);

module.exports = router;
