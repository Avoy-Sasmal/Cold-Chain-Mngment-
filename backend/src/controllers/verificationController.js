import { verifyProduct } from "../services/verificationService.js";

// GET /api/verify/:batchId
export const verifyProductHandler = async (req, res) => {
  try {
    const result = await verifyProduct(req.params.batchId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
