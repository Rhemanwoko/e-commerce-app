const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/authorize");
const {
  createBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
} = require("../controllers/brandController");

const router = express.Router();

// Validation middleware for brand operations
const validateBrand = [
  body("brandName")
    .trim()
    .notEmpty()
    .withMessage("Brand name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Brand name must be between 2 and 100 characters"),
];

// GET /brands - Get all brands (public)
router.get("/", getAllBrands);

// POST /brands - Create new brand (admin only)
router.post("/", authenticate, requireAdmin, validateBrand, createBrand);

// PUT /brands/:id - Update brand (admin only)
router.put("/:id", authenticate, requireAdmin, validateBrand, updateBrand);

// DELETE /brands/:id - Delete brand (admin only)
router.delete("/:id", authenticate, requireAdmin, deleteBrand);

module.exports = router;
