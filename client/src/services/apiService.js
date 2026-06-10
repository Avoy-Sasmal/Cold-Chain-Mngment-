import axios from "axios";
import { API_URL } from "../contracts/contractConfig";

const api = axios.create({ baseURL: API_URL });

export const verifyProduct = (batchId) =>
  api.get(`/api/verify/${batchId}`).then((r) => r.data);

export const searchProducts = (query) =>
  api.get(`/api/search?query=${encodeURIComponent(query)}`).then((r) => r.data);

export const getProductDetails = (batchId) =>
  api.get(`/api/search/product/${batchId}`).then((r) => r.data);

export const createStakeholder = (data) =>
  api.post("/api/stakeholders", data).then((r) => r.data);

export const getStakeholders = () =>
  api.get("/api/stakeholders").then((r) => r.data);

export const getStakeholder = (wallet) =>
  api.get(`/api/stakeholders/${wallet}`).then((r) => r.data);
