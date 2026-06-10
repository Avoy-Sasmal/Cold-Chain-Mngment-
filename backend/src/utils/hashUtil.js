import crypto from "crypto";

/**
 * generateHash — creates a deterministic SHA256 hex string from any object.
 * Keys are sorted so { a:1, b:2 } and { b:2, a:1 } produce the same hash.
 *
 * @param {object} data - The object to hash
 * @returns {string} 64-char hex string (no 0x prefix)
 */
export const generateHash = (data) => {
  const sorted = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(sorted).digest("hex");
};

/**
 * toBytes32 — adds 0x prefix so the hash is ready for Solidity bytes32.
 * Solidity expects: 0x + 64 hex chars = 66 chars total.
 *
 * @param {string} hexHash - 64-char hex string from generateHash()
 * @returns {string} "0x" + hexHash
 */
export const toBytes32 = (hexHash) => {
  return "0x" + hexHash;
};
