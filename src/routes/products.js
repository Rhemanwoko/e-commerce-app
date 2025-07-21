const express = require('express');
const { 
  getAllProducts,
  createProduct,
  createProductValidation,
  deleteProduct,
  deleteProductValidation
} = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize');

const router = express.Router();

// GET /products - Public endpoint
router.get('/', getAllProducts);

// POST /products - Admin only
router.post('/', authenticate, requireAdmin, createProductValidation, createProduct);

// DELETE /products/:id - Admin only
router.delete('/:id', authenticate, requireAdmin, deleteProductValidation, deleteProduct);

module.exports = router;