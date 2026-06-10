import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import useContract from "../hooks/useContract";
import TransactionToast, { useTxToast } from "../components/TransactionToast";
import ProductCard from "../components/ProductCard";
import {
  TabBar, DashboardHeader, Card, SectionTitle, EmptyState, Spinner,
  SubmitBtn, ConnectGate, AccessDenied, RefreshBtn, LogEntry,
  ProductSelectItem, WalletInput,
} from "../components/DashboardShell";
import { getOwnerProducts } from "../services/productService";
import { recordTransfer } from "../services/transferService";
import { addLog, getLogs } from "../services/monitoringService";
import { getStakeholder } from "../services/apiService";
import {
  FiTruck, FiActivity, FiSend, FiThermometer,
  FiInbox, FiAlertTriangle, FiCheckCircle,
} from "react-icons/fi";

const TABS = ["Received Shipments", "Log Condition", "Transfer to Warehouse"];
const GRADIENT = "bg-gradient-to-br from-emerald-500 to-teal-600";
const ACCENT = "bg-emerald-600";
const FOCUS = "focus:border-emerald-500/60";
const BTN_GRADIENT = "from-emerald-600 to-teal-600";
const SELECT_ACCENT = "border-emerald-500 bg-emerald-500/10 text-emerald-300";

export default function SupplierDashboard() {
  const { account, roleName, isConnected, connect } = useWallet();
  const { getProductBatch } = useContract();
  const { toast, showPending, showSuccess, showError, clearToast } = useTxToast();

  const [tab,        setTab]        = useState("Received Shipments");
  const [products,   setProducts]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logs,       setLogs]       = useState([]);
  const [toWallet,   setToWallet]   = useState("");
  const [logForm,    setLogForm]    = useState({ temperature: "", location: "", sealStatus: "INTACT", notes: "" });

  const loadProducts = async () => {
    if (!account) return;
    setLoading(true);
    try { const r = await getOwnerProducts(account); setProducts(r.data || []); } catch {/**/}
    setLoading(false);
  };

  const loadLogs = async (batchId) => {
    try { const r = await getLogs(batchId); setLogs(r.data || []); } catch { setLogs([]); }
  };

  useEffect(() => { if (isConnected) loadProducts(); }, [isConnected, account]);
  useEffect(() => { if (selected) loadLogs(selected.batchId); }, [selected]);

  const handleLog = async (e) => {
    e.preventDefault();
    if (!selected) return showError("Select a product first");
    setSubmitting(true);
    try {
      const res = await addLog({
        ...logForm, batchId: selected.batchId,
        productHash: selected.blockchainHash,
        loggedByWallet: account, loggedByRole: "SUPPLIER",
      });
      if (!res.data.isSafe) showError(`Alert: ${res.data.alertType} detected`);
      else showSuccess("Condition logged on blockchain!");
      setLogForm({ temperature: "", location: "", sealStatus: "INTACT", notes: "" });
      loadLogs(selected.batchId);
    } catch (err) { showError(err.message || "Log failed"); }
    finally { setSubmitting(false); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selected) return showError("Select a product first");
    const normalizedTo = toWallet.trim();
    setSubmitting(true);
    try {
      const recipient = await getStakeholder(normalizedTo).catch(() => null);
      if (!recipient?.data || recipient.data.role !== "WAREHOUSE")
        return showError("Recipient must be a registered Warehouse");

      showPending("Confirm transfer in MetaMask…");
      const contract = await getProductBatch();
      const tx = await contract.transferProduct(selected.blockchainHash, normalizedTo);
      const receipt = await tx.wait();

      await recordTransfer({ batchId: selected.batchId, productHash: selected.blockchainHash, fromWallet: account, toWallet: normalizedTo, fromRole: "SUPPLIER", toRole: "WAREHOUSE", txHash: receipt.hash });
      showSuccess("Transferred to Warehouse!", receipt.hash);
      setSelected(null); setToWallet(""); loadProducts();
    } catch (err) {
      showError(err?.revert?.args?.[0] || err?.reason || err?.message || "Transfer failed");
    } finally { setSubmitting(false); }
  };

  if (!isConnected) return <ConnectGate connect={connect} title="Supplier Dashboard" Icon={FiTruck} gradientClass={GRADIENT} />;
  if (roleName !== "SUPPLIER") return <AccessDenied roleName={roleName} required="SUPPLIER" />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <DashboardHeader
          Icon={FiTruck}
          title="Supplier Dashboard"
          account={account}
          gradientClass={GRADIENT}
          badge={
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 text-emerald-400 text-xs font-semibold">
              <FiInbox className="w-3.5 h-3.5" />
              {products.length} Shipment{products.length !== 1 ? "s" : ""}
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-900/60 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{products.length}</p>
            <p className="text-gray-500 text-xs mt-0.5">In Custody</p>
          </div>
          <div className="bg-gray-900/60 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{logs.filter(l => !l.isSafe).length}</p>
            <p className="text-gray-500 text-xs mt-0.5">Active Alerts</p>
          </div>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} accentClass={ACCENT} />

        {/* ── Received Shipments ── */}
        {tab === "Received Shipments" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400 text-sm">{products.length} product(s) in custody</p>
              <RefreshBtn onClick={loadProducts} loading={loading} />
            </div>
            {loading ? <Spinner color="border-t-emerald-500" />
              : products.length === 0
                ? <EmptyState Icon={FiInbox} title="No shipments received yet" subtitle="Products will appear here when transferred to you" />
                : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((p) => (
                      <ProductCard key={p._id} product={p} onClick={() => setSelected(p)} />
                    ))}
                  </div>
            }
          </div>
        )}

        {/* ── Log Condition ── */}
        {tab === "Log Condition" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <SectionTitle Icon={FiThermometer}>Log Storage Condition</SectionTitle>

              {/* Product selector */}
              <div className="mb-4">
                <label className="text-gray-400 text-xs font-medium block mb-2">Select Product</label>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {products.map((p) => (
                    <ProductSelectItem key={p._id} product={p} selected={selected}
                      onClick={setSelected} accentColor={SELECT_ACCENT} />
                  ))}
                </div>
              </div>

              <form onSubmit={handleLog} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Temperature (°C) *</label>
                    <input type="number" step="0.1" placeholder="4.5" value={logForm.temperature}
                      onChange={(e) => setLogForm((f) => ({ ...f, temperature: e.target.value }))} required
                      className={`w-full bg-gray-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none ${FOCUS} transition-colors`}
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Seal Status</label>
                    <select value={logForm.sealStatus} onChange={(e) => setLogForm((f) => ({ ...f, sealStatus: e.target.value }))}
                      className={`w-full bg-gray-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none ${FOCUS} transition-colors`}>
                      <option>INTACT</option><option>BROKEN</option><option>UNKNOWN</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Location *</label>
                  <input type="text" placeholder="Delhi Hub #2" value={logForm.location}
                    onChange={(e) => setLogForm((f) => ({ ...f, location: e.target.value }))} required
                    className={`w-full bg-gray-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none ${FOCUS} transition-colors`}
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Notes</label>
                  <textarea rows={2} value={logForm.notes}
                    onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Any observations…"
                    className={`w-full bg-gray-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none ${FOCUS} transition-colors resize-none`}
                  />
                </div>
                <SubmitBtn submitting={submitting} gradientClass={BTN_GRADIENT} Icon={FiActivity} disabled={!selected}>
                  Submit Log
                </SubmitBtn>
              </form>
            </Card>

            <Card>
              <SectionTitle Icon={FiCheckCircle}>
                Condition Logs {selected && <span className="text-emerald-400 font-normal">— {selected.batchId}</span>}
              </SectionTitle>
              {logs.length === 0
                ? <div className="text-center py-8 text-gray-500 text-sm">
                    {selected ? "No logs yet. Submit above." : "Select a product to view logs."}
                  </div>
                : <div className="space-y-2 max-h-80 overflow-y-auto">
                    {logs.map((l) => <LogEntry key={l._id} log={l} />)}
                  </div>
              }
            </Card>
          </div>
        )}

        {/* ── Transfer to Warehouse ── */}
        {tab === "Transfer to Warehouse" && (
          <Card className="max-w-lg">
            <SectionTitle Icon={FiSend}>Transfer to Warehouse</SectionTitle>
            {products.length === 0
              ? <EmptyState Icon={FiInbox} title="No products to transfer" />
              : <>
                  <div className="mb-4">
                    <label className="text-gray-400 text-xs font-medium block mb-2">Select Product</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {products.map((p) => (
                        <ProductSelectItem key={p._id} product={p} selected={selected}
                          onClick={setSelected} accentColor={SELECT_ACCENT} />
                      ))}
                    </div>
                  </div>
                  <form onSubmit={handleTransfer} className="space-y-4">
                    <WalletInput label="Warehouse Wallet Address" value={toWallet}
                      onChange={(e) => setToWallet(e.target.value)} focusColor={FOCUS} />
                    <SubmitBtn submitting={submitting} gradientClass={BTN_GRADIENT}
                      Icon={FiSend} disabled={!selected}>
                      Transfer to Warehouse
                    </SubmitBtn>
                  </form>
                </>
            }
          </Card>
        )}
      </div>
      <TransactionToast {...toast} onClose={clearToast} />
    </div>
  );
}
