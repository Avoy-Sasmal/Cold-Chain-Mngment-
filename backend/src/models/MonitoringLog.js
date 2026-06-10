import mongoose from "mongoose";

/**
 * MonitoringLog — one record per temperature/location check.
 * After saving, backend generates an integrity hash of ALL logs
 * and records it on ColdChainMonitor.sol on-chain.
 */
const monitoringLogSchema = new mongoose.Schema(
  {
    batchId:     { type: String, required: true, index: true },
    productHash: { type: String, required: true }, // 0x bytes32

    temperature: { type: Number, required: true }, // Celsius
    location:    { type: String, required: true, trim: true },
    sealStatus:  {
      type: String,
      enum: ["INTACT", "BROKEN", "UNKNOWN"],
      default: "INTACT",
    },
    notes: { type: String, default: "" },

    loggedByWallet: { type: String, required: true, lowercase: true },
    loggedByRole:   { type: String, default: "" },

    // Safety check result
    isSafe:    { type: Boolean, required: true },
    alertType: {
      type: String,
      enum: ["TEMP_HIGH", "TEMP_LOW", "SEAL_BROKEN", null],
      default: null,
    },

    // Blockchain integrity recording
    integrityHashOnChain: { type: String, default: "" }, // the hash sent to chain
    blockchainTxHash:     { type: String, default: "" }, // the tx that recorded it
  },
  { timestamps: true }
);

export default mongoose.model("MonitoringLog", monitoringLogSchema);
