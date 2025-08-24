const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const orderItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    minlength: [2, "Product name must be at least 2 characters long"],
    maxlength: [200, "Product name cannot exceed 200 characters"],
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product ID is required"],
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
    validate: {
      validator: function (value) {
        return Number.isInteger(value) && value > 0;
      },
      message: "Quantity must be a positive integer",
    },
  },
  totalCost: {
    type: Number,
    required: [true, "Total cost is required"],
    min: [0, "Total cost cannot be negative"],
    validate: {
      validator: function (value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: "Total cost must be a valid positive number",
    },
  },
});

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Order items are required"],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
      validate: {
        validator: function (value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: "Total amount must be a valid positive number",
      },
    },
    shippingStatus: {
      type: String,
      required: [true, "Shipping status is required"],
      enum: {
        values: ["pending", "shipped", "delivered"],
        message: "Shipping status must be one of: pending, shipped, delivered",
      },
      default: "pending",
    },
    orderNumber: {
      type: String,
      unique: true,
      required: [true, "Order number is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate order number and calculate total
orderSchema.pre("save", function (next) {
  // Generate order number if not provided
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }

  // Calculate total amount from items
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.totalCost || 0);
    }, 0);
  }

  next();
});

// Index for better query performance
orderSchema.index({ customerId: 1 });
orderSchema.index({ shippingStatus: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

// Add pagination plugin
orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Order", orderSchema);
