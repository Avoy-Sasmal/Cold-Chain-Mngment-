import { ethers } from "ethers";
import { createRequire } from "module";

// createRequire lets ES modules import JSON files
const require = createRequire(import.meta.url);
const RoleManagerABI      = require("../contracts/RoleManagerABI.json");
const ProductBatchABI     = require("../contracts/ProductBatchABI.json");
const ColdChainMonitorABI = require("../contracts/ColdChainMonitorABI.json");

// ── Provider & Signer ──────────────────────────────────────────────────────

/**
 * getProvider — read-only connection to Anvil / any EVM node
 */
const getProvider = () =>
  new ethers.JsonRpcProvider(process.env.RPC_URL);

/**
 * getSigner — backend wallet used to sign monitoring transactions
 * Uses Anvil account #0 private key (from .env) in local dev
 */
const getSigner = () =>
  new ethers.Wallet(process.env.PRIVATE_KEY, getProvider());

// ── Contract Getters ───────────────────────────────────────────────────────

/** Read-only RoleManager instance */
export const getRoleManagerContract = () =>
  new ethers.Contract(
    process.env.ROLE_MANAGER_ADDRESS,
    RoleManagerABI,
    getProvider()
  );

/** Read-only ProductBatch instance */
export const getProductBatchContract = () =>
  new ethers.Contract(
    process.env.PRODUCT_BATCH_ADDRESS,
    ProductBatchABI,
    getProvider()
  );

/**
 * ColdChainMonitor with signer — backend signs monitoring hash writes.
 * Only this contract needs writing from the backend side.
 */
export const getColdChainMonitorContract = () =>
  new ethers.Contract(
    process.env.COLD_CHAIN_MONITOR_ADDRESS,
    ColdChainMonitorABI,
    getSigner()
  );

// ── Helper Functions ───────────────────────────────────────────────────────

/**
 * getProductFromChain — fetch product struct from ProductBatch by batchId string
 */
export const getProductFromChain = async (batchId) => {
  const contract = getProductBatchContract();
  return await contract.getProductByBatchId(batchId);
};

/**
 * getLatestIntegrityHash — fetch latest monitoring integrity hash for a product
 */
export const getLatestIntegrityHash = async (productHash) => {
  const contract = getColdChainMonitorContract();
  return await contract.getLatestHash(productHash);
};

/**
 * recordConditionOnChain — backend writes monitoring hash to ColdChainMonitor.
 * @param {string} productHash    0x bytes32 hex
 * @param {string} integrityHash  0x bytes32 hex of all MongoDB logs
 * @returns {string} transaction hash
 */
export const recordConditionOnChain = async (productHash, integrityHash) => {
  const contract = getColdChainMonitorContract();
  const tx = await contract.recordCondition(productHash, integrityHash);
  const receipt = await tx.wait();
  return receipt.hash;
};
