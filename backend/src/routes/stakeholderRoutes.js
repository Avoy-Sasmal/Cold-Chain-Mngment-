import express from "express";
import { createStakeholder, getStakeholders, getStakeholder } from "../controllers/stakeholderController.js";

const router = express.Router();

router.post("/",          createStakeholder);  // POST /api/stakeholders
router.get("/",           getStakeholders);    // GET  /api/stakeholders
router.get("/:wallet",    getStakeholder);     // GET  /api/stakeholders/:wallet

export default router;
