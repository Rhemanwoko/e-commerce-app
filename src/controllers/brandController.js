const Brand = require("../models/Brand");
const { validationResult } = require("express-validator");

// Create a new brand (Admin only)
const createBrand = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { brandName } = req.body;

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ brandName });
    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const brand = new Brand({ brandName });
    await brand.save();

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

// Get all brands
const getAllBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort({ brandName: 1 });

    res.status(200).json({
      success: true,
      message: "Brands retrieved successfully",
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};

// Update a brand (Admin only)
const updateBrand = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { brandName } = req.body;

    // Check if brand exists
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Check if new brand name already exists (excluding current brand)
    const existingBrand = await Brand.findOne({
      brandName,
      _id: { $ne: id },
    });
    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "Brand name already exists",
      });
    }

    brand.brandName = brandName;
    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a brand (Admin only)
const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    await Brand.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
};
