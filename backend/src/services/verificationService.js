import Product from "../models/Product.js";
import { generateHash, toBytes32 } from "../utils/hashUtil.js";
import { getColdChainMonitorContract } from "./blockchainService.js";

/**
 * verifyProduct — Phase 5 core logic.
 *
 * Flow:
 *   MongoDB product data → regenerate SHA256 hash
 *   → compare with blockchainHash stored in MongoDB (originally from chain)
 *   → AUTHENTIC if they match, TAMPERED if they differ
 *
 * @param {string} batchId
 * @returns {object} verification result
 */
export const verifyProduct = async (batchId) => {
  // 1. Fetch product from MongoDB
  const product = await Product.findOne({ batchId });
  if (!product) throw new Error("Product not found in database");

  // 2. Regenerate hash from the EXACT same fields used during creation
  //    Dates MUST be converted to ISO strings — same as productController does.
  const hashData = {
    batchId:           product.batchId,
    productName:       product.productName,
    origin:            product.origin,
    expiryDate:        new Date(product.expiryDate).toISOString(),
    manufacturingDate: new Date(product.manufacturingDate).toISOString(),
    minTemperature:    Number(product.minTemperature),
    maxTemperature:    Number(product.maxTemperature),
  };
  const recomputedHash = toBytes32(generateHash(hashData));

  // 3. The hash that was stored on-chain at creation time
  const storedHash = product.blockchainHash;

  // 4. Compare (case-insensitive hex)
  const isAuthentic = recomputedHash.toLowerCase() === storedHash.toLowerCase();

  // 5. Also fetch latest monitoring integrity hash from ColdChainMonitor
  let latestIntegrityHash = null;
  try {
    const monitor = getColdChainMonitorContract();
    const raw = await monitor.getLatestHash(storedHash);
    latestIntegrityHash = raw !== "0x0000000000000000000000000000000000000000000000000000000000000000"
      ? raw : null;
  } catch (_) {
    // Contract not deployed yet or address missing — skip
  }

  return {
    isAuthentic,
    batchId,
    productName:      product.productName,
    recomputedHash,
    storedHash,
    latestIntegrityHash,
    verifiedAt:       new Date().toISOString(),
  };
};
