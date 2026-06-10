import mongoose from "mongoose";

/**
 * TransferHistory — records every ownership transfer in MongoDB.
 * Blockchain emits OwnershipTransferred events, but MongoDB allows fast queries.
 */
const transferHistorySchema = new mongoose.Schema(
  {
    batchId:     { type: String, required: true, index: true },
    productHash: { type: String, required: true }, // 0x bytes32 hex

    fromWallet: { type: String, required: true, lowercase: true },
    toWallet:   { type: String, required: true, lowercase: true },
    fromRole:   { type: String, required: true },
    toRole:     { type: String, required: true },

    // blockchain transaction hash from transferProduct() call
    txHash: { type: String, default: "" },
    notes:  { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("TransferHistory", transferHistorySchema);
