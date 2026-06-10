import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import useContract from "../hooks/useContract";
import TransactionToast, { useTxToast } from "../components/TransactionToast";
import { createStakeholder, getStakeholders } from "../services/apiService";
import { RiAdminLine, RiShieldUserLine } from "react-icons/ri";
import { FiPlus, FiList, FiLoader, FiLock, FiSlash } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";

const ROLES = [
  { value: "1", label: "Manufacturer", color: "text-blue-400" },
  { value: "2", label: "Supplier",     color: "text-emerald-400" },
  { value: "3", label: "Warehouse",    color: "text-amber-400" },
  { value: "4", label: "Retailer",     color: "text-purple-400" },
];

const ROLE_LABELS = { "1":"MANUFACTURER","2":"SUPPLIER","3":"WAREHOUSE","4":"RETAILER" };

export default function AdminDashboard() {
  const { account, isAdmin, isConnected, connect } = useWallet();
  const { getRoleManager } = useContract();
  const { toast, showPending, showSuccess, showError, clearToast } = useTxToast();

  const [wallet, setWallet]             = useState("");
  const [name,   setName]               = useState("");
  const [role,   setRole]               = useState("1");
  const [org,    setOrg]                = useState("");
  const [email,  setEmail]              = useState("");
  const [stakeholders, setStakeholders] = useState([]);
  const [loadingList,  setLoadingList]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // Load existing stakeholders from backend
  const loadStakeholders = async () => {
    setLoadingList(true);
    try {
      const res = await getStakeholders();
      setStakeholders(res.data || []);
    } catch { /* ignore */ }
    setLoadingList(false);
  };

  useEffect(() => { if (isConnected) loadStakeholders(); }, [isConnected]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(wallet)) return showError("Invalid wallet address");
    if (!name.trim())              return showError("Name is required");

    setSubmitting(true);
    try {
      // Step 1 — Blockchain transaction via MetaMask (DO THIS FIRST)
      showPending("Confirm in MetaMask…");
      const contract = await getRoleManager();
      
      // Call blockchain
      const tx = await contract.createStakeholder(wallet, name, Number(role));
      const receipt = await tx.wait();

      // Step 2 — Only if blockchain succeeds, save to MongoDB
      await createStakeholder({
        walletAddress: wallet, 
        name, 
        role: ROLE_LABELS[role],
        organization: org, 
        email,
        txHash: receipt.hash
      });

      showSuccess("Stakeholder registered on Blockchain and DB!", receipt.hash);

      setWallet(""); setName(""); setRole("1"); setOrg(""); setEmail("");
      loadStakeholders();
    } catch (err) {
      const msg = err?.revert?.args?.[0] || err?.reason || err?.message || "Transaction failed";
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto">
          <FiLock className="w-7 h-7" />
        </div>
        <h2 className="text-white text-2xl font-bold">Connect your wallet</h2>
        <p className="text-gray-400">Admin access requires MetaMask</p>
        <button onClick={connect} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-all">
          Connect MetaMask
        </button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto mb-4">
          <FiSlash className="w-7 h-7" />
        </div>
        <h2 className="text-white text-2xl font-bold">Access Denied</h2>
        <p className="text-gray-400 mt-2">Only the Admin wallet can access this page.</p>
        <p className="text-gray-600 text-xs mt-4 font-mono">{account}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-lg">
              <RiAdminLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm font-mono">{account?.slice(0,10)}…{account?.slice(-6)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Connected to Anvil</span>
            <span className="text-gray-600 text-xs ml-2">{stakeholders.length} stakeholders registered</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Create Form */}
          <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
              <FiPlus className="w-5 h-5 text-violet-400" /> Create Stakeholder
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">Wallet Address *</label>
                <input
                  type="text" placeholder="0x..."
                  value={wallet} onChange={(e) => setWallet(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 font-mono"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">Full Name *</label>
                <input
                  type="text" placeholder="e.g. Pharma Corp Ltd"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">Role *</label>
                <select
                  value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/60"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Organization</label>
                  <input
                    type="text" placeholder="Company name"
                    value={org} onChange={(e) => setOrg(e.target.value)}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Email</label>
                  <input
                    type="email" placeholder="contact@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><FiLoader className="w-4 h-4 animate-spin" /> Processing…</>
                  : <><HiOutlineSparkles className="w-4 h-4" /> Create Stakeholder</>
                }
              </button>
            </form>
          </div>

          {/* Stakeholder List */}
          <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
              <FiList className="w-5 h-5 text-cyan-400" /> Registered Stakeholders
              {loadingList && <FiLoader className="w-4 h-4 text-cyan-400 animate-spin ml-2" />}
            </h2>

            {stakeholders.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-gray-600 mx-auto mb-3">
                  <RiShieldUserLine className="w-6 h-6" />
                </div>
                <p className="text-gray-500 text-sm">No stakeholders yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {stakeholders.map((s) => {
                  const roleColors = { MANUFACTURER:"text-blue-400 bg-blue-500/10 border-blue-500/30", SUPPLIER:"text-emerald-400 bg-emerald-500/10 border-emerald-500/30", WAREHOUSE:"text-amber-400 bg-amber-500/10 border-amber-500/30", RETAILER:"text-purple-400 bg-purple-500/10 border-purple-500/30" };
                  const rc = roleColors[s.role] || "text-gray-400 bg-gray-500/10 border-gray-500/30";
                  return (
                    <div key={s._id} className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3 border border-white/5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-sm font-bold text-gray-300 flex-shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{s.name}</p>
                        <p className="text-gray-500 text-xs font-mono truncate">{s.walletAddress}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border flex-shrink-0 ${rc}`}>{s.role}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <TransactionToast {...toast} onClose={clearToast} />
    </div>
  );
}