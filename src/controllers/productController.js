const { body, param, validationResult } = require('express-validator');
const Product = require('../models/Product');
const mongoose = require('mongoose');

/**
 * Validation rules for creating a product
 */
const createProductValidation = [
  body('productName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  
  body('cost')
    .isNumeric({ no_symbols: false })
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  
  body('productImages')
    .optional()
    .isArray()
    .withMessage('Product images must be an array')
    .custom((images) => {
      if (images && images.length > 0) {
        return images.every(image => {
          try {
            new URL(image);
            return true;
          } catch {
            return false;
          }
        });
      }
      return true;
    })
    .withMessage('All product images must be valid URLs'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('stockStatus')
    .trim()
    .notEmpty()
    .withMessage('Stock status is required')
];

/**
 * Validation rules for deleting a product
 */
const deleteProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format')
];

/**
 * Get all products
 * Public endpoint - no authentication required
 */
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('ownerId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        count: products.length
      },
      statusCode: 200
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: 500
    });
  }
};

/**
 * Create a new product
 * Admin only endpoint
 */
const createProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        statusCode: 400
      });
    }

    const { productName, cost, productImages, description, stockStatus } = req.body;

    // Create new product with authenticated admin as owner
    const product = new Product({
      productName,
      ownerId: req.user.userId, // Set from authenticated admin user
      cost,
      productImages: productImages || [],
      description,
      stockStatus
    });

    await product.save();

    // Populate owner information for response
    await product.populate('ownerId', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      },
      statusCode: 201
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: 500
    });
  }
};

/**
 * Delete a product
 * Admin only endpoint
 */
const deleteProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        statusCode: 400
      });
    }

    const { id } = req.params;

    // Find and delete the product
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        statusCode: 404
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {
        deletedProduct: product
      },
      statusCode: 200
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: 500
    });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  createProductValidation,
  deleteProduct,
  deleteProductValidation
};