/**
 * contractConfig.js
 * Central place for all contract addresses.
 * Values come from client/.env (VITE_ prefix required for Vite).
 *
 * After deploying, paste addresses into client/.env then restart `npm run dev`.
 */

export const ROLE_MANAGER_ADDRESS       = import.meta.env.VITE_ROLE_MANAGER_ADDRESS;
export const PRODUCT_BATCH_ADDRESS      = import.meta.env.VITE_PRODUCT_BATCH_ADDRESS;
export const COLD_CHAIN_MONITOR_ADDRESS = import.meta.env.VITE_COLD_CHAIN_MONITOR_ADDRESS;

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
