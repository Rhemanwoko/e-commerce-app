const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Brand", brandSchema);
