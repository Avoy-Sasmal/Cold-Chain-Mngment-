import { useMemo } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import {
  ROLE_MANAGER_ADDRESS,
  PRODUCT_BATCH_ADDRESS,
  COLD_CHAIN_MONITOR_ADDRESS,
} from "../contracts/contractConfig";
import RoleManagerABI      from "../contracts/RoleManagerABI.json";
import ProductBatchABI     from "../contracts/ProductBatchABI.json";
import ColdChainMonitorABI from "../contracts/ColdChainMonitorABI.json";

/**
 * useContract — returns typed ethers Contract instances connected to MetaMask signer.
 * Returns null for each contract if address is not yet set.
 */
const useContract = () => {
  const { isConnected } = useWallet();

  const getSigner = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner();
  };

  const roleManager = useMemo(() => {
    if (!ROLE_MANAGER_ADDRESS || ROLE_MANAGER_ADDRESS === "PASTE_AFTER_DEPLOY") return null;
    return { address: ROLE_MANAGER_ADDRESS, abi: RoleManagerABI };
  }, []);

  const productBatch = useMemo(() => {
    if (!PRODUCT_BATCH_ADDRESS || PRODUCT_BATCH_ADDRESS === "PASTE_AFTER_DEPLOY") return null;
    return { address: PRODUCT_BATCH_ADDRESS, abi: ProductBatchABI };
  }, []);

  const coldChainMonitor = useMemo(() => {
    if (!COLD_CHAIN_MONITOR_ADDRESS || COLD_CHAIN_MONITOR_ADDRESS === "PASTE_AFTER_DEPLOY") return null;
    return { address: COLD_CHAIN_MONITOR_ADDRESS, abi: ColdChainMonitorABI };
  }, []);

  /**
   * getContract — returns a signer-connected Contract instance
   * @param {{ address, abi }} config
   */
  const getContract = async (config) => {
    if (!config) throw new Error("Contract address not configured. Update client/.env");
    const signer = await getSigner();
    return new ethers.Contract(config.address, config.abi, signer);
  };

  return {
    isConnected,
    getRoleManager:      () => getContract(roleManager),
    getProductBatch:     () => getContract(productBatch),
    getColdChainMonitor: () => getContract(coldChainMonitor),
  };
};

export default useContract;
