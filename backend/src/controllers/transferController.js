import TransferHistory from "../models/TransferHistory.js";
import Product from "../models/Product.js";

const STATUS_MAP = {
  SUPPLIER:  "WITH_SUPPLIER",
  WAREHOUSE: "WITH_WAREHOUSE",
  RETAILER:  "WITH_RETAILER",
};

// POST /api/transfers/record
export const recordTransfer = async (req, res) => {
  try {
    const { batchId, productHash, fromWallet, toWallet, fromRole, toRole, txHash, notes } = req.body;

    if (!batchId || !productHash || !fromWallet || !toWallet || !fromRole || !toRole) {
      return res.status(400).json({ success: false, message: "All transfer fields required" });
    }

    const transfer = await TransferHistory.create({
      batchId, productHash,
      fromWallet: fromWallet.toLowerCase(),
      toWallet:   toWallet.toLowerCase(),
      fromRole, toRole, txHash, notes,
    });

    // Update product's current owner and status
    await Product.findOneAndUpdate(
      { batchId },
      { currentOwnerWallet: toWallet.toLowerCase(), status: STATUS_MAP[toRole] || "CREATED" }
    );

    return res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    console.error("recordTransfer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/transfers/:batchId
export const getTransferHistory = async (req, res) => {
  try {
    const history = await TransferHistory.find({ batchId: req.params.batchId }).sort({ createdAt: 1 });
    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
