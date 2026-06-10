import { useState, useEffect, useRef } from "react";
import AuthenticityBadge from "../components/AuthenticityBadge";
import { searchProducts, getProductDetails } from "../services/apiService";
import axios from "axios";
import { API_URL } from "../contracts/contractConfig";
import {
  FiSearch, FiX, FiArrowLeft, FiArrowRight,
  FiPackage, FiShield, FiAlertTriangle, FiThermometer,
  FiRefreshCw, FiTruck, FiActivity, FiInbox,
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";

const STATUS_LABEL = {
  CREATED:        "With Manufacturer",
  WITH_SUPPLIER:  "With Supplier",
  WITH_WAREHOUSE: "In Warehouse",
  WITH_RETAILER:  "With Retailer",
  SOLD:           "Sold / Delivered",
};
const STATUS_COLOR = {
  CREATED:        "text-blue-400",
  WITH_SUPPLIER:  "text-cyan-400",
  WITH_WAREHOUSE: "text-amber-400",
  WITH_RETAILER:  "text-purple-400",
  SOLD:           "text-emerald-400",
};
const STATUS_DOT = {
  CREATED:        "bg-blue-400",
  WITH_SUPPLIER:  "bg-cyan-400",
  WITH_WAREHOUSE: "bg-amber-400",
  WITH_RETAILER:  "bg-purple-400",
  SOLD:           "bg-emerald-400",
};
const ALERT_COLOR = {
  TEMP_HIGH:   "bg-red-500/10 border-red-500/30 text-red-400",
  TEMP_LOW:    "bg-blue-500/10 border-blue-500/30 text-blue-400",
  SEAL_BROKEN: "bg-orange-500/10 border-orange-500/30 text-orange-400",
};
const ALERT_LABEL = {
  TEMP_HIGH:   "Temperature Too High",
  TEMP_LOW:    "Temperature Too Low",
  SEAL_BROKEN: "Package Seal Broken",
};

export default function CustomerSearch() {
  const [query,         setQuery]         = useState("");
  const [allProducts,   setAllProducts]   = useState([]);
  const [suggestions,   setSuggestions]   = useState([]);
  const [showDrop,      setShowDrop]      = useState(false);
  const [results,       setResults]       = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [detail,        setDetail]        = useState(null);
  const [searching,     setSearching]     = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searched,      setSearched]      = useState(false);

  const inputRef = useRef(null);
  const dropRef  = useRef(null);

  // Fetch all products once for autocomplete
  useEffect(() => {
    axios.get(`${API_URL}/api/search?query=`)
      .then((res) => setAllProducts(res.data?.data || []))
      .catch(() => {});
  }, []);

  // Filter suggestions
  useEffect(() => {
    if (!query.trim()) { setSuggestions(allProducts.slice(0, 8)); return; }
    const q = query.toLowerCase();
    setSuggestions(
      allProducts.filter((p) =>
        p.batchId?.toLowerCase().includes(q) ||
        p.productName?.toLowerCase().includes(q) ||
        p.origin?.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [query, allProducts]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setShowDrop(false); setSearching(true); setSearched(true);
    setSelected(null); setDetail(null);
    try {
      const res = await searchProducts(query.trim());
      setResults(res.data || []);
    } catch { setResults([]); }
    setSearching(false);
  };

  const openDetail = async (product) => {
    setSelected(product); setSearched(true);
    setResults([]); setLoadingDetail(true); setDetail(null);
    try {
      const res = await getProductDetails(product.batchId);
      setDetail(res.data);
    } catch { setDetail(null); }
    setLoadingDetail(false);
  };

  const goBack = () => { setSelected(null); setDetail(null); setSearched(false); };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Hero / Search ──────────────────────────────────────────────── */}
      <div className="border-b border-white/8 bg-gradient-to-b from-gray-900/80 to-gray-950 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-cyan-500/8 border border-cyan-500/25 rounded-full px-4 py-1.5 text-cyan-400 text-xs font-medium mb-6">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Public Product Tracker — No wallet required
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-3">
            Verify Your Product
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Search by Batch ID or Product Name to view the complete supply chain history
            and blockchain authenticity status.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowDrop(true); }}
                  onFocus={() => setShowDrop(true)}
                  placeholder="Enter Batch ID or Product Name…"
                  className="w-full bg-gray-800/80 border border-white/12 rounded-xl pl-10 pr-10 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm transition-colors"
                />
                {query && (
                  <button type="button"
                    onClick={() => { setQuery(""); setShowDrop(true); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button type="submit" disabled={searching}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                {searching
                  ? <FiRefreshCw className="w-4 h-4 animate-spin" />
                  : <><FiSearch className="w-4 h-4" /> Search</>
                }
              </button>
            </div>

            {/* Autocomplete Dropdown */}
            {showDrop && suggestions.length > 0 && (
              <div ref={dropRef}
                className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center">
                  <span className="text-gray-500 text-xs">
                    {query.trim() ? `${suggestions.length} matches` : "Recent Products"}
                  </span>
                  <span className="text-gray-600 text-xs">Click to view details</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {suggestions.map((p) => {
                    const isExpired = new Date(p.expiryDate) < new Date();
                    return (
                      <div key={p._id} onClick={() => { setQuery(p.productName); setShowDrop(false); openDetail(p); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 cursor-pointer transition-colors border-b border-white/5 last:border-0 group">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <FiPackage className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">{p.productName}</p>
                            {isExpired && (
                              <span className="text-red-400 text-xs flex-shrink-0 flex items-center gap-1">
                                <FiAlertTriangle className="w-3 h-3" /> Expired
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs font-mono mt-0.5">{p.batchId}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-xs font-semibold ${STATUS_COLOR[p.status] || "text-gray-400"}`}>
                            {STATUS_LABEL[p.status] || p.status}
                          </span>
                          <span className="text-gray-600 text-xs">{p.origin}</span>
                        </div>
                        <FiArrowRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    );
                  })}
                </div>
                {allProducts.length > 0 && (
                  <div className="px-4 py-2 border-t border-white/5 text-center">
                    <span className="text-gray-600 text-xs">{allProducts.length} total products in system</span>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Quick stats */}
          {allProducts.length > 0 && !showDrop && (
            <div className="flex justify-center gap-8 mt-7">
              {[
                { label: "Total Products", value: allProducts.length },
                { label: "In Transit",     value: allProducts.filter((p) => ["WITH_SUPPLIER","WITH_WAREHOUSE","WITH_RETAILER"].includes(p.status)).length },
                { label: "Delivered",      value: allProducts.filter((p) => p.status === "SOLD").length },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-cyan-400 font-bold text-xl">{s.value}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Search Results */}
        {searched && !selected && (
          <div>
            {searching
              ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin" /></div>
              : results.length === 0
                ? <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-gray-600 mx-auto mb-4">
                      <FiSearch className="w-6 h-6" />
                    </div>
                    <p className="text-gray-400">No products found for "<span className="text-white">{query}</span>"</p>
                    <p className="text-gray-600 text-sm mt-2">Try searching by batch ID or product name</p>
                  </div>
                : <div>
                    <p className="text-gray-400 text-sm mb-4">{results.length} result(s) for "<span className="text-white">{query}</span>"</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.map((p) => (
                        <div key={p._id} onClick={() => openDetail(p)}
                          className="bg-gray-900/60 border border-white/8 rounded-2xl p-5 cursor-pointer hover:border-cyan-500/40 hover:bg-gray-900/80 transition-all group">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <h3 className="text-white font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">{p.productName}</h3>
                              <p className="text-gray-500 text-xs font-mono mt-0.5">{p.batchId}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${STATUS_DOT[p.status] || "bg-gray-400"}`} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-semibold ${STATUS_COLOR[p.status] || "text-gray-400"}`}>{STATUS_LABEL[p.status] || p.status}</span>
                            <span className="text-gray-500">{p.origin}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
            }
          </div>
        )}

        {/* Product Detail View */}
        {selected && (
          <div>
            <button onClick={goBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors group">
              <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to search
            </button>

            {loadingDetail
              ? <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin" /></div>
              : detail
                ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Column 1: Product Info ── */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-gray-900/60 border border-white/8 rounded-2xl p-6">
                        <h2 className="text-white text-xl font-bold mb-1">{detail.product.productName}</h2>
                        <p className="text-gray-500 text-xs font-mono mb-4">{detail.product.batchId}</p>

                        {detail.verification && (
                          <div className="mb-5">
                            <AuthenticityBadge isAuthentic={detail.verification.isAuthentic} size="lg" />
                          </div>
                        )}

                        <div className="space-y-2.5 text-sm">
                          {[
                            ["Origin",     detail.product.origin],
                            ["Temp Range", `${detail.product.minTemperature}°C – ${detail.product.maxTemperature}°C`],
                            ["Expiry",     new Date(detail.product.expiryDate).toLocaleDateString()],
                            ["Status",     STATUS_LABEL[detail.product.status] || detail.product.status],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                              <span className="text-gray-500">{k}</span>
                              <span className={`font-medium text-right ml-4 ${k === "Status" ? (STATUS_COLOR[detail.product.status] || "text-gray-200") : "text-gray-200"}`}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Blockchain Verification Box */}
                      {detail.verification && (
                        <div className={`rounded-2xl p-4 border ${detail.verification.isAuthentic ? "bg-emerald-500/8 border-emerald-500/25" : "bg-red-500/8 border-red-500/25"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <FiShield className={`w-4 h-4 ${detail.verification.isAuthentic ? "text-emerald-400" : "text-red-400"}`} />
                            <p className="font-semibold text-white text-sm">Blockchain Verification</p>
                          </div>
                          <p className="text-gray-400 text-xs break-all">Hash: {detail.verification.storedHash?.slice(0, 24)}…</p>
                          <p className="text-gray-500 text-xs mt-1">Verified: {new Date(detail.verification.verifiedAt).toLocaleString()}</p>
                        </div>
                      )}

                      {/* Safety Alerts */}
                      {detail.logs?.some((l) => !l.isSafe) && (
                        <div className="bg-red-500/8 border border-red-500/25 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FiAlertTriangle className="w-4 h-4 text-red-400" />
                            <p className="text-red-400 font-semibold text-sm">Safety Alerts Detected</p>
                          </div>
                          <div className="space-y-2">
                            {[...new Set(detail.logs.filter((l) => !l.isSafe).map((l) => l.alertType))].map((type) => (
                              <div key={type} className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 ${ALERT_COLOR[type] || "bg-gray-800 border-white/10 text-gray-400"}`}>
                                <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
                                {ALERT_LABEL[type] || type}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Column 2: Supply Chain Journey ── */}
                    <div className="lg:col-span-1 bg-gray-900/60 border border-white/8 rounded-2xl p-6">
                      <h3 className="text-white font-semibold mb-5 flex items-center gap-2 text-sm">
                        <FiTruck className="w-4 h-4 text-gray-400" />
                        Supply Chain Journey
                      </h3>
                      {!detail.transfers?.length
                        ? <p className="text-gray-500 text-sm">No transfers recorded yet.</p>
                        : (
                          <div>
                            {detail.transfers.map((t, i) => (
                              <div key={t._id} className="flex gap-3 pb-5">
                                <div className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${i === detail.transfers.length - 1 ? "bg-cyan-400 shadow-lg shadow-cyan-400/40" : "bg-gray-600"}`} />
                                  {i < detail.transfers.length - 1 && <div className="w-px flex-1 bg-white/8 mt-1" />}
                                </div>
                                <div className="flex-1 text-xs pb-1">
                                  <div className="flex items-center gap-1.5 text-white font-semibold">
                                    {t.fromRole}
                                    <FiArrowRight className="w-3 h-3 text-gray-500" />
                                    {t.toRole}
                                  </div>
                                  <p className="text-gray-500 font-mono mt-0.5">{t.toWallet?.slice(0, 14)}…</p>
                                  <p className="text-gray-600 mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className="w-3 h-3 rounded-full border border-dashed border-gray-600 flex-shrink-0" />
                              Current location
                            </div>
                          </div>
                        )
                      }
                    </div>

                    {/* ── Column 3: Temperature History ── */}
                    <div className="lg:col-span-1 bg-gray-900/60 border border-white/8 rounded-2xl p-6">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
                        <FiThermometer className="w-4 h-4 text-gray-400" />
                        Temperature History
                      </h3>
                      {!detail.logs?.length
                        ? <p className="text-gray-500 text-sm">No temperature logs recorded.</p>
                        : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {detail.logs.map((l) => (
                              <div key={l._id} className={`p-3 rounded-xl border text-xs ${l.isSafe ? "border-white/8 bg-gray-800/40" : "border-red-500/30 bg-red-500/8"}`}>
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-white">{l.temperature}°C</span>
                                  <span className={`font-semibold flex items-center gap-1 ${l.isSafe ? "text-emerald-400" : "text-red-400"}`}>
                                    {l.isSafe
                                      ? <><FiActivity className="w-3 h-3" /> Safe</>
                                      : <><FiAlertTriangle className="w-3 h-3" /> {l.alertType}</>
                                    }
                                  </span>
                                </div>
                                <p className="text-gray-400 mt-1">{l.location} · <span className={l.sealStatus === "BROKEN" ? "text-red-400" : "text-gray-500"}>{l.sealStatus}</span></p>
                                <p className="text-gray-600 mt-0.5">{new Date(l.createdAt).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )
                      }
                    </div>
                  </div>
                )
                : (
                  <div className="text-center py-16">
                    <FiInbox className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Failed to load product details.</p>
                  </div>
                )
            }
          </div>
        )}

        {/* All Products Grid (default view) */}
        {!searched && !selected && allProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">All Products in System</h2>
              <span className="text-gray-500 text-sm">{allProducts.length} products</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allProducts.map((p) => {
                const isExpired = new Date(p.expiryDate) < new Date();
                return (
                  <div key={p._id} onClick={() => openDetail(p)}
                    className="bg-gray-900/60 border border-white/8 rounded-2xl p-5 cursor-pointer hover:border-cyan-500/35 hover:bg-gray-900/80 transition-all group overflow-hidden">
                    {/* Top accent */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-white text-sm font-semibold truncate group-hover:text-cyan-400 transition-colors">{p.productName}</h3>
                        <p className="text-gray-500 text-xs font-mono mt-0.5">{p.batchId}</p>
                      </div>
                      {isExpired && (
                        <FiAlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className={`font-semibold ${STATUS_COLOR[p.status] || "text-gray-400"}`}>{STATUS_LABEL[p.status] || p.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Temp</span>
                        <span className="text-gray-300">{p.minTemperature}° – {p.maxTemperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Origin</span>
                        <span className="text-gray-300 truncate ml-4">{p.origin}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-gray-600 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                      <span className="text-cyan-500 text-xs group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View <FiArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!searched && !selected && allProducts.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-gray-600 mx-auto mb-4">
              <FiInbox className="w-7 h-7" />
            </div>
            <p className="text-gray-400 text-lg font-medium">No products in the system yet</p>
            <p className="text-gray-600 text-sm mt-2">Products will appear here once a manufacturer creates a batch.</p>
          </div>
        )}
      </div>
    </div>
  );
}
