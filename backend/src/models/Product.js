import mongoose from "mongoose";

/**
 * Product — full product metadata stored in MongoDB.
 * Blockchain stores only: blockchainHash, creator, timestamp, currentOwner.
 * MongoDB stores everything else (name, expiry, temperature range, origin, etc.)
 */
const productSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: [true, "Batch ID required"],
      unique: true,
      trim: true,
    },

    productName:      { type: String, required: true, trim: true },
    origin:           { type: String, required: true, trim: true },
    expiryDate:       { type: Date,   required: true },
    manufacturingDate:{ type: Date,   required: true },

    // Temperature range in Celsius (cold chain constraint)
    minTemperature: { type: Number, required: true },
    maxTemperature: { type: Number, required: true },

    description:    { type: String, trim: true, default: "" },
    creatorWallet:  { type: String, required: true, lowercase: true },

    // SHA256 hash of this product's metadata — stored on blockchain too
    // Format: "0x" + 64 hex chars
    blockchainHash: { type: String, required: true },

    // Tracks product movement through supply chain
    status: {
      type: String,
      enum: ["CREATED", "WITH_SUPPLIER", "WITH_WAREHOUSE", "WITH_RETAILER", "SOLD"],
      default: "CREATED",
    },

    currentOwnerWallet: { type: String, lowercase: true },

    // Blockchain tx hash from ProductBatch.createProduct() call
    creationTxHash: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
