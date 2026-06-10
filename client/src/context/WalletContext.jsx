import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { connectWallet, getCurrentAccount } from "../services/metamask";
import { ROLE_MANAGER_ADDRESS, API_URL } from "../contracts/contractConfig";
import RoleManagerABI from "../contracts/RoleManagerABI.json";

// ── Role mapping ───────────────────────────────────────────────────────────
const ROLE_NAMES = ["NONE", "MANUFACTURER", "SUPPLIER", "WAREHOUSE", "RETAILER"];
const ROLE_NUM_MAP = {
  NONE: 0, MANUFACTURER: 1, SUPPLIER: 2, WAREHOUSE: 3, RETAILER: 4,
};
const ROLE_COLORS = {
  NONE:         "bg-gray-500",
  MANUFACTURER: "bg-blue-600",
  SUPPLIER:     "bg-emerald-600",
  WAREHOUSE:    "bg-amber-600",
  RETAILER:     "bg-purple-600",
};

// ── Context ────────────────────────────────────────────────────────────────
const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [account,     setAccount]     = useState(null);
  const [role,        setRole]        = useState(0);
  const [roleName,    setRoleName]    = useState("NONE");
  const [roleColor,   setRoleColor]   = useState("bg-gray-500");
  const [isConnected, setIsConnected] = useState(false);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [loading,     setLoading]     = useState(false);

  /**
   * Fetch role with DUAL-SOURCE fallback:
   * 1. Try the blockchain first (source of truth when Anvil is running)
   * 2. If blockchain returns NONE, fall back to MongoDB (persisted across restarts)
   *
   * This means stakeholders keep working even after Anvil restarts — as long
   * as they were registered once and saved in MongoDB.
   */
  const fetchRole = useCallback(async (address) => {
    try {
      // ── Source 1: Blockchain ──────────────────────────────────────────────
      let roleNum = 0;
      let adminAddr = null;

      if (ROLE_MANAGER_ADDRESS && ROLE_MANAGER_ADDRESS !== "PASTE_AFTER_DEPLOY") {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(ROLE_MANAGER_ADDRESS, RoleManagerABI, provider);
          roleNum   = Number(await contract.getRole(address));
          adminAddr = await contract.admin();
        } catch (chainErr) {
          console.warn("Blockchain role fetch failed, trying MongoDB fallback:", chainErr.message);
        }
      }

      // If admin is detected via blockchain, set immediately
      if (adminAddr && address.toLowerCase() === adminAddr.toLowerCase()) {
        setIsAdmin(true);
        // Admin has no role number but we still set what we got
        setRole(roleNum);
        setRoleName(ROLE_NAMES[roleNum] || "NONE");
        setRoleColor(ROLE_COLORS[ROLE_NAMES[roleNum]] || "bg-gray-500");
        return;
      }

      // ── Source 2: MongoDB fallback (when blockchain returns NONE = 0) ─────
      if (roleNum === 0) {
        try {
          const res = await fetch(`${API_URL}/api/stakeholders/${address}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data?.role) {
              const dbRole = json.data.role; // e.g. "MANUFACTURER"
              roleNum = ROLE_NUM_MAP[dbRole] ?? 0;
              console.info(`MongoDB fallback: ${address} has role ${dbRole}`);
            }
          }
        } catch (dbErr) {
          console.warn("MongoDB fallback also failed:", dbErr.message);
        }
      }

      setRole(roleNum);
      setRoleName(ROLE_NAMES[roleNum] || "NONE");
      setRoleColor(ROLE_COLORS[ROLE_NAMES[roleNum]] || "bg-gray-500");
      setIsAdmin(false);
    } catch (err) {
      console.warn("fetchRole error:", err.message);
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const { address } = await connectWallet();
      setAccount(address);
      setIsConnected(true);
      await fetchRole(address);
    } catch (err) {
      console.error("Connect wallet error:", err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRole]);

  // Auto-connect if MetaMask already authorized
  useEffect(() => {
    const autoConnect = async () => {
      const addr = await getCurrentAccount();
      if (addr) {
        setAccount(addr);
        setIsConnected(true);
        await fetchRole(addr);
      }
    };
    autoConnect();

    // Listen for account/chain changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setIsConnected(false);
          setRole(0);
          setRoleName("NONE");
          setIsAdmin(false);
        } else {
          setAccount(accounts[0]);
          setIsConnected(true);
          fetchRole(accounts[0]);
        }
      });
    }
  }, [fetchRole]);

  return (
    <WalletContext.Provider value={{
      account, role, roleName, roleColor,
      isConnected, isAdmin, loading, connect,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
};

export default WalletContext;
