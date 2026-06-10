import express from "express";
import { verifyProductHandler } from "../controllers/verificationController.js";

const router = express.Router();

router.get("/:batchId", verifyProductHandler);  // GET /api/verify/:batchId

export default router;
