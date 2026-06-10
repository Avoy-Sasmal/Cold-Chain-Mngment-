import axios from "axios";
import { API_URL } from "../contracts/contractConfig";

const api = axios.create({ baseURL: API_URL });

/** Step 1a — Get hash ONLY (no DB write). Use this before the blockchain tx. */
export const getProductHash = (data) =>
  api.post("/api/products/prepare-hash", data).then((r) => r.data);

/** Step 1b — Save to backend AFTER blockchain tx succeeds */
export const prepareProduct = (data) =>
  api.post("/api/products/create", data).then((r) => r.data);

export const getProduct = (batchId) =>
  api.get(`/api/products/${batchId}`).then((r) => r.data);

export const getManufacturerProducts = (wallet) =>
  api.get(`/api/products/manufacturer/${wallet}`).then((r) => r.data);

export const getOwnerProducts = (wallet) =>
  api.get(`/api/products/owner/${wallet}`).then((r) => r.data);
