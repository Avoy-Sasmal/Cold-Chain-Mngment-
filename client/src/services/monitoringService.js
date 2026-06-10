import axios from "axios";
import { API_URL } from "../contracts/contractConfig";

const api = axios.create({ baseURL: API_URL });

export const addLog = (data) =>
  api.post("/api/monitoring/log", data).then((r) => r.data);

export const getLogs = (batchId) =>
  api.get(`/api/monitoring/${batchId}`).then((r) => r.data);

export const getAlerts = (batchId) =>
  api.get(`/api/monitoring/alerts/${batchId}`).then((r) => r.data);
