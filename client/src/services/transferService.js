import axios from "axios";
import { API_URL } from "../contracts/contractConfig";

const api = axios.create({ baseURL: API_URL });

export const recordTransfer = (data) =>
  api.post("/api/transfers/record", data).then((r) => r.data);

export const getTransferHistory = (batchId) =>
  api.get(`/api/transfers/${batchId}`).then((r) => r.data);
