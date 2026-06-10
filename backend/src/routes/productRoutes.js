import express from "express";
import { createProduct, getProduct, getManufacturerProducts, getOwnerProducts, prepareHash } from "../controllers/productController.js";

const router = express.Router();

router.post("/prepare-hash",          prepareHash);              // POST /api/products/prepare-hash (no DB write)
router.post("/create",                createProduct);            // POST /api/products/create
router.get("/manufacturer/:wallet",   getManufacturerProducts);  // GET  /api/products/manufacturer/:wallet
router.get("/owner/:wallet",          getOwnerProducts);         // GET  /api/products/owner/:wallet
router.get("/:batchId",               getProduct);               // GET  /api/products/:batchId

export default router;
