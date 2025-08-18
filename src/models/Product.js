const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters long"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
    },
    cost: {
      type: Number,
      required: [true, "Product cost is required"],
      min: [0, "Product cost cannot be negative"],
      validate: {
        validator: function (value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: "Product cost must be a valid positive number",
      },
    },
    productImages: {
      type: [String],
      default: [],
      validate: {
        validator: function (images) {
          return images.every((image) => {
            try {
              new URL(image);
              return true;
            } catch {
              return false;
            }
          });
        },
        message: "All product images must be valid URLs",
      },
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [
        10,
        "Product description must be at least 10 characters long",
      ],
      maxlength: [1000, "Product description cannot exceed 1000 characters"],
    },
    stockStatus: {
      type: String,
      required: [true, "Stock status is required"],
      trim: true,
      minlength: [1, "Stock status cannot be empty"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
productSchema.index({ ownerId: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ productName: "text", description: "text" });

// Add pagination plugin
productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Product", productSchema);
