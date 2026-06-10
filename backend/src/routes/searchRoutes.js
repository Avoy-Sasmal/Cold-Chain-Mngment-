import express from "express";
import { searchProduct, getProductDetails } from "../controllers/searchController.js";

const router = express.Router();

router.get("/",              searchProduct);      // GET /api/search?query=...
router.get("/product/:batchId", getProductDetails); // GET /api/search/product/:batchId

export default router;
