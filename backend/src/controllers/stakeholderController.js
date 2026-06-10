import Stakeholder from "../models/Stakeholder.js";

// POST /api/stakeholders
export const createStakeholder = async (req, res) => {
  try {
    const { walletAddress, name, role, organization, email, phone, txHash } = req.body;

    if (!walletAddress || !name || !role) {
      return res.status(400).json({ success: false, message: "walletAddress, name and role are required" });
    }

    const validRoles = ["MANUFACTURER", "SUPPLIER", "WAREHOUSE", "RETAILER"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const existing = await Stakeholder.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Stakeholder already exists" });
    }

    const stakeholder = await Stakeholder.create({
      walletAddress, name, role, organization, email, phone, txHash,
    });

    return res.status(201).json({ success: true, data: stakeholder });
  } catch (error) {
    console.error("createStakeholder:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stakeholders
export const getStakeholders = async (req, res) => {
  try {
    const stakeholders = await Stakeholder.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: stakeholders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stakeholders/:wallet
export const getStakeholder = async (req, res) => {
  try {
    const stakeholder = await Stakeholder.findOne({
      walletAddress: req.params.wallet.toLowerCase(),
    });
    if (!stakeholder) {
      return res.status(404).json({ success: false, message: "Stakeholder not found" });
    }
    return res.json({ success: true, data: stakeholder });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
