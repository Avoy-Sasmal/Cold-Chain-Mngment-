/**
 * sync-chain.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this script ONCE after every Anvil restart.
 * It reads all stakeholders from MongoDB and re-registers them on-chain
 * using the Admin private key — so you never have to use the Admin UI again.
 *
 * Usage (Git Bash):
 *   cd backend
 *   npm run sync-chain
 */

import mongoose from "mongoose";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load ABI ──────────────────────────────────────────────────────────────
const abiPath = join(__dirname, "../../client/src/contracts/RoleManagerABI.json");
const RoleManagerABI = JSON.parse(readFileSync(abiPath, "utf8"));

// ── Role name → enum number ───────────────────────────────────────────────
const ROLE_MAP = { MANUFACTURER: 1, SUPPLIER: 2, WAREHOUSE: 3, RETAILER: 4 };

// ── Stakeholder model (minimal) ───────────────────────────────────────────
const StakeholderSchema = new mongoose.Schema({
  walletAddress: String,
  name:          String,
  role:          String,
});
const Stakeholder = mongoose.model("Stakeholder", StakeholderSchema);

// ── Main ──────────────────────────────────────────────────────────────────
const sync = async () => {
  const RPC_URL            = process.env.RPC_URL            || "http://127.0.0.1:8545";
  const PRIVATE_KEY        = process.env.PRIVATE_KEY;
  const ROLE_MANAGER_ADDR  = process.env.ROLE_MANAGER_ADDRESS;
  const MONGODB_URI        = process.env.MONGO_URI          || process.env.MONGODB_URI;

  if (!PRIVATE_KEY)       { console.error("❌ PRIVATE_KEY missing in .env"); process.exit(1); }
  if (!ROLE_MANAGER_ADDR) { console.error("❌ ROLE_MANAGER_ADDRESS missing in .env"); process.exit(1); }
  if (!MONGODB_URI)       { console.error("❌ MONGO_URI missing in .env"); process.exit(1); }

  // Connect MongoDB
  console.log("\n📦 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connected");

  const stakeholders = await Stakeholder.find();
  if (stakeholders.length === 0) {
    console.log("⚠️  No stakeholders found in MongoDB. Register them via the Admin UI first.");
    process.exit(0);
  }

  console.log(`\n🔍 Found ${stakeholders.length} stakeholder(s) in MongoDB\n`);

  // Connect to Anvil
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(ROLE_MANAGER_ADDR, RoleManagerABI, wallet);

  console.log(`👤 Admin wallet: ${wallet.address}`);
  console.log(`📋 RoleManager:  ${ROLE_MANAGER_ADDR}\n`);

  let success = 0;
  let skipped = 0;
  let failed  = 0;

  for (const sh of stakeholders) {
    const roleNum = ROLE_MAP[sh.role];
    if (!roleNum) {
      console.log(`  ⚠️  Skipping ${sh.name} — unknown role "${sh.role}"`);
      skipped++;
      continue;
    }

    // Check if already registered on-chain (avoids revert)
    try {
      const existingRole = Number(await contract.getRole(sh.walletAddress));
      if (existingRole !== 0) {
        console.log(`  ✅ ${sh.name} (${sh.role}) — already on-chain, skipped`);
        skipped++;
        continue;
      }
    } catch { /* ignore read errors */ }

    try {
      process.stdout.write(`  ⏳ Registering ${sh.name} as ${sh.role}... `);
      const tx = await contract.createStakeholder(sh.walletAddress, sh.name, roleNum);
      await tx.wait();
      console.log(`✅  (tx: ${tx.hash.slice(0, 12)}...)`);
      success++;
    } catch (err) {
      const reason = err?.reason || err?.message || "unknown error";
      console.log(`❌  FAILED — ${reason}`);
      failed++;
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Registered: ${success}`);
  console.log(`⏭️  Skipped:    ${skipped} (already on-chain)`);
  console.log(`❌ Failed:     ${failed}`);
  console.log("─────────────────────────────────────────");
  console.log("\n🎉 Blockchain sync complete! Your stakeholders can now transact.\n");

  await mongoose.disconnect();
  process.exit(0);
};

sync().catch((err) => {
  console.error("❌ Sync failed:", err.message);
  process.exit(1);
});
