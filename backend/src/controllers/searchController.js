import Product from "../models/Product.js";
import TransferHistory from "../models/TransferHistory.js";
import MonitoringLog from "../models/MonitoringLog.js";
import { verifyProduct } from "../services/verificationService.js";

// GET /api/search?query=...   (empty query returns all products for autocomplete)
export const searchProduct = async (req, res) => {
  try {
    const { query } = req.query;

    // If no query, return all products (latest 50) for autocomplete
    if (!query || !query.trim()) {
      const products = await Product.find()
        .sort({ createdAt: -1 })
        .limit(50);
      return res.json({ success: true, data: products });
    }

    const products = await Product.find({
      $or: [
        { batchId:     { $regex: query, $options: "i" } },
        { productName: { $regex: query, $options: "i" } },
        { origin:      { $regex: query, $options: "i" } },
      ],
    }).limit(10);

    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/product/:batchId — full product view for customer (no MetaMask needed)
export const getProductDetails = async (req, res) => {
  try {
    const { batchId } = req.params;

    const product = await Product.findOne({ batchId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const [transfers, logs, verification] = await Promise.all([
      TransferHistory.find({ batchId }).sort({ createdAt: 1 }),
      MonitoringLog.find({ batchId }).sort({ createdAt: -1 }).limit(20),
      verifyProduct(batchId).catch(() => ({ isAuthentic: false, error: "Verification failed" })),
    ]);

    return res.json({
      success: true,
      data: { product, transfers, logs, verification },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
