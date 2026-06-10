import express from "express";
import { recordTransfer, getTransferHistory } from "../controllers/transferController.js";

const router = express.Router();

router.post("/record",    recordTransfer);      // POST /api/transfers/record
router.get("/:batchId",   getTransferHistory);  // GET  /api/transfers/:batchId

export default router;
