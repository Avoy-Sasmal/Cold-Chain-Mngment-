import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import TransactionToast, { useTxToast } from "../components/TransactionToast";
import ProductCard from "../components/ProductCard";
import AuthenticityBadge from "../components/AuthenticityBadge";
import {
  TabBar, DashboardHeader, Card, SectionTitle, EmptyState, Spinner,
  ConnectGate, AccessDenied, RefreshBtn, LogEntry,
} from "../components/DashboardShell";
import { getOwnerProducts } from "../services/productService";
import { getTransferHistory } from "../services/transferService";
import { getLogs } from "../services/monitoringService";
import { verifyProduct } from "../services/apiService";
import {
  FiShoppingBag, FiPackage, FiActivity, FiRefreshCw,
  FiCheckCircle, FiShield, FiArrowRight,
} from "react-icons/fi";

const TABS = ["Received Products", "Product Detail"];
const GRADIENT = "bg-gradient-to-br from-purple-500 to-violet-600";
const ACCENT = "bg-purple-600";

export default function RetailerDashboard() {
  const { account, roleName, isConnected, connect } = useWallet();
  const { toast, clearToast } = useTxToast();

  const [tab,           setTab]           = useState("Received Products");
  const [products,      setProducts]      = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [detail,        setDetail]        = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    if (!account) return;
    setLoading(true);
    try { const r = await getOwnerProducts(account); setProducts(r.data || []); } catch {/**/}
    setLoading(false);
  };

  const loadProductDetail = async (product) => {
    setSelected(product);
    setDetailLoading(true);
    try {
      const [transfers, logs, verification] = await Promise.all([
        getTransferHistory(product.batchId).then((r) => r.data || []),
        getLogs(product.batchId).then((r) => r.data || []),
        verifyProduct(product.batchId).then((r) => r.data).catch(() => null),
      ]);
      setDetail({ transfers, logs, verification });
    } catch {/**/}
    setDetailLoading(false);
  };

  useEffect(() => { if (isConnected) load(); }, [isConnected, account]);

  if (!isConnected) return <ConnectGate connect={connect} title="Retailer Dashboard" Icon={FiShoppingBag} gradientClass={GRADIENT} />;
  if (roleName !== "RETAILER") return <AccessDenied roleName={roleName} required="RETAILER" />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <DashboardHeader
          Icon={FiShoppingBag}
          title="Retailer Dashboard"
          account={account}
          gradientClass={GRADIENT}
          badge={
            <div className="hidden sm:flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1.5 text-purple-400 text-xs font-semibold">
              <FiPackage className="w-3.5 h-3.5" />
              {products.length} Product{products.length !== 1 ? "s" : ""}
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900/60 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{products.length}</p>
            <p className="text-gray-500 text-xs mt-0.5">Received</p>
          </div>
          <div className="bg-gray-900/60 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400">{products.filter(p => p.status === "WITH_RETAILER").length}</p>
            <p className="text-gray-500 text-xs mt-0.5">In Stock</p>
          </div>
          <div className="bg-gray-900/60 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{products.filter(p => p.status === "SOLD").length}</p>
            <p className="text-gray-500 text-xs mt-0.5">Sold</p>
          </div>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} accentClass={ACCENT} />

        {/* ── Received Products ── */}
        {tab === "Received Products" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400 text-sm">{products.length} product(s) received</p>
              <RefreshBtn onClick={load} loading={loading} />
            </div>
            {loading ? <Spinner color="border-t-purple-500" />
              : products.length === 0
                ? <EmptyState Icon={FiPackage} title="No products received yet" subtitle="Products will appear when transferred from Warehouse" />
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <ProductCard key={p._id} product={p}
                        onClick={() => { loadProductDetail(p); setTab("Product Detail"); }} />
                    ))}
                  </div>
            }
          </div>
        )}

        {/* ── Product Detail ── */}
        {tab === "Product Detail" && (
          <div>
            {!selected
              ? <EmptyState Icon={FiPackage} title="Select a product" subtitle="Click any product in the Received Products tab" />
              : detailLoading
                ? <Spinner color="border-t-purple-500" />
                : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Product Info */}
                    <div className="lg:col-span-1 space-y-4">
                      <Card>
                        <div className="flex items-start justify-between mb-4">
                          <h2 className="text-white font-bold text-lg leading-tight">{selected.productName}</h2>
                          {detail?.verification && (
                            <AuthenticityBadge isAuthentic={detail.verification.isAuthentic} size="sm" />
                          )}
                        </div>
                        <div className="space-y-2.5 text-sm">
                          {[
                            ["Batch ID",   selected.batchId],
                            ["Origin",     selected.origin],
                            ["Temp Range", `${selected.minTemperature}°C – ${selected.maxTemperature}°C`],
                            ["Expiry",     new Date(selected.expiryDate).toLocaleDateString()],
                            ["Status",     selected.status?.replace(/_/g, " ")],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                              <span className="text-gray-500">{k}</span>
                              <span className="text-gray-200 font-medium text-right ml-4 truncate max-w-[140px]">{v}</span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Verification Result */}
                      {detail?.verification && (
                        <div className={`rounded-2xl p-4 border text-xs ${detail.verification.isAuthentic
                          ? "bg-emerald-500/8 border-emerald-500/25"
                          : "bg-red-500/8 border-red-500/25"
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <FiShield className={`w-4 h-4 ${detail.verification.isAuthentic ? "text-emerald-400" : "text-red-400"}`} />
                            <p className="font-semibold text-white text-sm">Blockchain Verification</p>
                          </div>
                          <p className="text-gray-400 break-all">
                            Hash: {detail.verification.storedHash?.slice(0, 22)}…
                          </p>
                          <p className="text-gray-500 mt-1">
                            Verified at {new Date(detail.verification.verifiedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Transfer History */}
                    <Card className="lg:col-span-1">
                      <SectionTitle Icon={FiRefreshCw}>Transfer History</SectionTitle>
                      {detail?.transfers?.length === 0
                        ? <p className="text-gray-500 text-sm">No transfers recorded.</p>
                        : <div className="space-y-3">
                            {detail?.transfers?.map((t, i) => (
                              <div key={t._id} className="flex items-start gap-3">
                                <div className="flex flex-col items-center mt-1">
                                  <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                                  {i < detail.transfers.length - 1 && (
                                    <div className="w-px flex-1 bg-white/10 mt-1 min-h-[16px]" />
                                  )}
                                </div>
                                <div className="text-xs pb-3 flex-1">
                                  <div className="flex items-center gap-1 text-white font-medium">
                                    {t.fromRole}
                                    <FiArrowRight className="w-3 h-3 text-gray-500" />
                                    {t.toRole}
                                  </div>
                                  <p className="text-gray-500 font-mono mt-0.5">{t.toWallet.slice(0, 12)}…</p>
                                  <p className="text-gray-600">{new Date(t.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                      }
                    </Card>

                    {/* Temperature Logs */}
                    <Card className="lg:col-span-1">
                      <SectionTitle Icon={FiActivity}>Temperature History</SectionTitle>
                      {detail?.logs?.length === 0
                        ? <p className="text-gray-500 text-sm">No temperature logs recorded.</p>
                        : <div className="space-y-2 max-h-72 overflow-y-auto">
                            {detail?.logs?.map((l) => <LogEntry key={l._id} log={l} />)}
                          </div>
                      }
                    </Card>
                  </div>
                )
            }
          </div>
        )}
      </div>
      <TransactionToast {...toast} onClose={clearToast} />
    </div>
  );
}
