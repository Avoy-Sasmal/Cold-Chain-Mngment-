import express from "express";
import { addLog, getLogs, getAlerts } from "../controllers/monitoringController.js";

const router = express.Router();

router.post("/log",             addLog);      // POST /api/monitoring/log
router.get("/alerts/:batchId",  getAlerts);   // GET  /api/monitoring/alerts/:batchId  ← must be BEFORE /:batchId
router.get("/:batchId",         getLogs);     // GET  /api/monitoring/:batchId

export default router;
