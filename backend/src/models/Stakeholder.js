import mongoose from "mongoose";

/**
 * Stakeholder — MongoDB profile for every supply chain participant.
 * Blockchain stores the role on-chain; MongoDB stores the full profile.
 */
const stakeholderSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: [true, "Wallet address required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name:         { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["MANUFACTURER", "SUPPLIER", "WAREHOUSE", "RETAILER"],
    },
    organization: { type: String, trim: true, default: "" },
    email:        { type: String, trim: true, lowercase: true, default: "" },
    phone:        { type: String, trim: true, default: "" },
    isActive:     { type: Boolean, default: true },
    txHash:       { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Stakeholder", stakeholderSchema);