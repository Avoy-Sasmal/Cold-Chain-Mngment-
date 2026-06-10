import Product from "../models/Product.js";
import { generateHash, toBytes32 } from "../utils/hashUtil.js";

// POST /api/products/create
export const createProduct = async (req, res) => {
  try {
    const {
      batchId, productName, origin, expiryDate,
      manufacturingDate, minTemperature, maxTemperature,
      description, creatorWallet, creationTxHash,
    } = req.body;

    if (!batchId || !productName || !origin || !expiryDate ||
        !manufacturingDate || minTemperature === undefined ||
        maxTemperature === undefined || !creatorWallet) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    if (await Product.findOne({ batchId })) {
      return res.status(409).json({ success: false, message: "Batch ID already exists" });
    }

    // Generate the same hash that will be stored on blockchain
    // IMPORTANT: dates → ISO string, numbers → Number
    // verificationService.js must use the exact same normalization
    const hashData = {
      batchId,
      productName,
      origin,
      expiryDate:        new Date(expiryDate).toISOString(),
      manufacturingDate: new Date(manufacturingDate).toISOString(),
      minTemperature:    Number(minTemperature),
      maxTemperature:    Number(maxTemperature),
    };
    const blockchainHash = toBytes32(generateHash(hashData));

    const product = await Product.create({
      batchId, productName, origin,
      expiryDate: new Date(expiryDate),
      manufacturingDate: new Date(manufacturingDate),
      minTemperature, maxTemperature, description,
      creatorWallet: creatorWallet.toLowerCase(),
      blockchainHash,
      currentOwnerWallet: creatorWallet.toLowerCase(),
      creationTxHash: creationTxHash || "",
    });

    // blockchainHash is returned so frontend can call ProductBatch.createProduct()
    return res.status(201).json({ success: true, data: product, blockchainHash });
  } catch (error) {
    console.error("createProduct:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/products/prepare-hash
 * Computes the blockchain hash for a product WITHOUT saving anything to the DB.
 * Use this BEFORE submitting the blockchain transaction so you have the hash ready.
 * Call POST /api/products/create AFTER the blockchain tx succeeds.
 */
export const prepareHash = async (req, res) => {
  try {
    const {
      batchId, productName, origin, expiryDate,
      manufacturingDate, minTemperature, maxTemperature,
    } = req.body;

    if (!batchId || !productName || !origin || !expiryDate ||
        !manufacturingDate || minTemperature === undefined ||
        maxTemperature === undefined) {
      return res.status(400).json({ success: false, message: "All fields required for hash computation" });
    }

    // Check for duplicate batch BEFORE the blockchain tx so user knows immediately
    if (await Product.findOne({ batchId })) {
      return res.status(409).json({ success: false, message: `Batch ID "${batchId}" already exists in the database. Use a unique Batch ID.` });
    }

    const hashData = {
      batchId,
      productName,
      origin,
      expiryDate:        new Date(expiryDate).toISOString(),
      manufacturingDate: new Date(manufacturingDate).toISOString(),
      minTemperature:    Number(minTemperature),
      maxTemperature:    Number(maxTemperature),
    };
    const blockchainHash = toBytes32(generateHash(hashData));

    return res.status(200).json({ success: true, blockchainHash });
  } catch (error) {
    console.error("prepareHash:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:batchId
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ batchId: req.params.batchId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/manufacturer/:wallet
export const getManufacturerProducts = async (req, res) => {
  try {
    const products = await Product.find({
      creatorWallet: req.params.wallet.toLowerCase(),
    }).sort({ createdAt: -1 });
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/owner/:wallet
export const getOwnerProducts = async (req, res) => {
  try {
    const products = await Product.find({
      currentOwnerWallet: req.params.wallet.toLowerCase(),
    }).sort({ createdAt: -1 });
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
