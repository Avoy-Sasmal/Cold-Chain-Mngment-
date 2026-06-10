import MonitoringLog from "../models/MonitoringLog.js";
import Product from "../models/Product.js";
import { generateHash, toBytes32 } from "../utils/hashUtil.js";
import { recordConditionOnChain } from "../services/blockchainService.js";

// POST /api/monitoring/log
export const addLog = async (req, res) => {
  try {
    const { batchId, productHash, temperature, location, sealStatus, notes, loggedByWallet, loggedByRole } = req.body;

    if (!batchId || !productHash || temperature === undefined || !location || !loggedByWallet) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    // Fetch product for temperature range check
    const product = await Product.findOne({ batchId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Safety check
    let isSafe = true;
    let alertType = null;
    if (temperature > product.maxTemperature) { isSafe = false; alertType = "TEMP_HIGH"; }
    if (temperature < product.minTemperature) { isSafe = false; alertType = "TEMP_LOW"; }
    if (sealStatus === "BROKEN") { isSafe = false; alertType = alertType || "SEAL_BROKEN"; }

    // Save log to MongoDB
    const log = await MonitoringLog.create({
      batchId, productHash, temperature, location,
      sealStatus: sealStatus || "INTACT",
      notes, loggedByWallet: loggedByWallet.toLowerCase(),
      loggedByRole, isSafe, alertType,
    });

    // Generate cumulative integrity hash from ALL logs for this product
    const allLogs = await MonitoringLog.find({ batchId }).sort({ createdAt: 1 });
    const integrityHash = toBytes32(generateHash({ logs: allLogs.map((l) => ({ t: l.temperature, loc: l.location, ts: l.createdAt })) }));

    // Record on blockchain (backend wallet signs this)
    let blockchainTxHash = null;
    try {
      blockchainTxHash = await recordConditionOnChain(productHash, integrityHash);
      await MonitoringLog.findByIdAndUpdate(log._id, { integrityHashOnChain: integrityHash, blockchainTxHash });
    } catch (bcErr) {
      console.error("⚠️  Blockchain record failed (log saved to DB):", bcErr.message);
    }

    return res.status(201).json({ success: true, data: log, isSafe, alertType, blockchainTxHash });
  } catch (error) {
    console.error("addLog:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/monitoring/:batchId
export const getLogs = async (req, res) => {
  try {
    const logs = await MonitoringLog.find({ batchId: req.params.batchId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/monitoring/alerts/:batchId
export const getAlerts = async (req, res) => {
  try {
    const alerts = await MonitoringLog.find({ batchId: req.params.batchId, isSafe: false }).sort({ createdAt: -1 });
    return res.json({ success: true, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
