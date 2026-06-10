import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";

import stakeholderRoutes from "./routes/stakeholderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

// Load .env before anything else
dotenv.config();

// Connect to MongoDB
await connectDB();

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/stakeholders", stakeholderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/verify", verificationRoutes);
app.use("/api/search", searchRoutes);

// Health check
app.get("/", (_req, res) => res.json({ status: "Cold Chain Backend Running ✅" }));

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});