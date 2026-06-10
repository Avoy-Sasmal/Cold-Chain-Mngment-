import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import useContract from "../hooks/useContract";
import TransactionToast, { useTxToast } from "../components/TransactionToast";
import ProductCard from "../components/ProductCard";
import {
  TabBar, DashboardHeader, Card, SectionTitle, EmptyState, Spinner,
  FormInput, SubmitBtn, ConnectGate, AccessDenied,
  RefreshBtn, ProductSelectItem, WalletInput,
} from "../components/DashboardShell";
import { prepareProduct, getProductHash, getManufacturerProducts } from "../services/productService";
import { recordTransfer } from "../services/transferService";
import { getStakeholder } from "../services/apiService";
import {
  FiBox, FiList, FiSend, FiLoader, FiPlus,
  FiCheckCircle, FiPackage,
} from "react-icons/fi";

const TABS = ["Create Batch", "My Products", "Transfer"];
const ACCENT = "bg-blue-600";
const GRADIENT = "bg-gradient-to-br from-blue-500 to-cyan-600";
const FOCUS = "focus:border-blue-500/60";
const BTN_GRADIENT = "from-blue-600 to-cyan-600";

const FIELDS = [
  { name: "batchId",           label: "Batch ID",           placeholder: "BATCH-001" },
  { name: "productName",       label: "Product Name",        placeholder: "e.g. COVID Vaccine" },
  { name: "origin",            label: "Origin / Location",   placeholder: "Mumbai, India" },
  { name: "manufacturingDate", label: "Manufacturing Date",  type: "date" },
  { name: "expiryDate",        label: "Expiry Date",         type: "date" },
  { name: "minTemperature",    label: "Min Temp (°C)",       type: "number", placeholder: "2" },
  { name: "maxTemperature",    label: "Max Temp (°C)",       type: "number", placeholder: "8" },
];

export default function ManufacturerDashboard() {
  const { account, roleName, isConnected, connect } = useWallet();
  const { getProductBatch } = useContract();
  const { toast, showPending, showSuccess, showError, clearToast } = useTxToast();

  const [tab,        setTab]        = useState("Create Batch");
  const [products,   setProducts]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toWallet,   setToWallet]   = useState("");
  const [form, setForm] = useState({
    batchId: "", productName: "", origin: "",
    expiryDate: "", manufacturingDate: "",
    minTemperature: "", maxTemperature: "", description: "",
  });

  const loadProducts = async () => {
    if (!account) return;
    setLoading(true);
    try { const r = await getManufacturerProducts(account); setProducts(r.data || []); } catch {/**/}
    setLoading(false);
  };

  useEffect(() => { if (isConnected) loadProducts(); }, [isConnected, account]);

  const handleField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      showPending("Computing product hash…");
      const { blockchainHash } = await getProductHash({ ...form, creatorWallet: account });

      showPending("Confirm in MetaMask…");
      const contract = await getProductBatch();
      const tx = await contract.createProduct(blockchainHash, form.batchId);
      const receipt = await tx.wait();

      showPending("Saving metadata…");
      await prepareProduct({ ...form, creatorWallet: account, creationTxHash: receipt.hash });

      showSuccess("Product batch created!", receipt.hash);
      setForm({ batchId: "", productName: "", origin: "", expiryDate: "", manufacturingDate: "", minTemperature: "", maxTemperature: "", description: "" });
      setTab("My Products");
      loadProducts();
    } catch (err) {
      showError(err?.response?.data?.message || err?.reason || err?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selected) return showError("Select a product first");
    if (!selected.blockchainHash) return showError("Product hash missing");
    const normalizedTo = toWallet.trim();
    setSubmitting(true);
    try {
      const recipient = await getStakeholder(normalizedTo).catch(() => null);
      if (!recipient?.data) return showError("Wallet not registered");
      if (recipient.data.role !== "SUPPLIER") return showError(`Must be SUPPLIER (got ${recipient.data.role})`);

      showPending("Confirm in MetaMask…");
      const contract = await getProductBatch();
      const tx = await contract.transferProduct(selected.blockchainHash, normalizedTo);
      const receipt = await tx.wait();

      await recordTransfer({ batchId: selected.batchId, productHash: selected.blockchainHash, fromWallet: account, toWallet: normalizedTo, fromRole: "MANUFACTURER", toRole: "SUPPLIER", txHash: receipt.hash });
      showSuccess("Transferred to Supplier!", receipt.hash);
      setSelected(null); setToWallet(""); loadProducts();
    } catch (err) {
      showError(err?.revert?.args?.[0] || err?.reason || err?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) return <ConnectGate connect={connect} title="Manufacturer Dashboard" Icon={FiBox} gradientClass={GRADIENT} />;
  if (roleName !== "MANUFACTURER") return <AccessDenied roleName={roleName} required="MANUFACTURER" />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <DashboardHeader
          Icon={FiBox}
          title="Manufacturer Dashboard"
          account={account}
          gradientClass={GRADIENT}
          badge={
            <div className="hidden sm:flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1.5 text-blue-400 text-xs font-semibold">
              <FiCheckCircle className="w-3.5 h-3.5" />
              {products.length} Batch{products.length !== 1 ? "es" : ""}
            </div>
          }
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-900/60 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{products.length}</p>
            <p className="text-gray-500 text-xs mt-0.5">Total Batches</p>
          </div>
          <div className="bg-gray-900/60 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{products.filter(p => p.status === "CREATED").length}</p>
            <p className="text-gray-500 text-xs mt-0.5">Awaiting Transfer</p>
          </div>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} accentClass={ACCENT} />

        {/* ── Create Batch ── */}
        {tab === "Create Batch" && (
          <Card>
            <SectionTitle Icon={FiPlus}>Register New Product Batch</SectionTitle>
            <form onSubmit={handleCreateBatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELDS.map(({ name, label, placeholder, type = "text" }) => (
                <FormInput key={name} name={name} label={label} placeholder={placeholder}
                  type={type} value={form[name]} onChange={handleField} required focusColor={FOCUS} />
              ))}
              <div className="md:col-span-2">
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Description</label>
                <textarea
                  name="description" value={form.description} onChange={handleField}
                  rows={3} placeholder="Additional product details…"
                  className={`w-full bg-gray-800/80 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none ${FOCUS} transition-colors resize-none`}
                />
              </div>
              <div className="md:col-span-2">
                <SubmitBtn submitting={submitting} gradientClass={BTN_GRADIENT} Icon={FiPackage}>
                  Create on Blockchain
                </SubmitBtn>
              </div>
            </form>
          </Card>
        )}

        {/* ── My Products ── */}
        {tab === "My Products" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">{products.length} batch{products.length !== 1 ? "es" : ""} registered</p>
              <RefreshBtn onClick={loadProducts} loading={loading} />
            </div>
            {loading ? <Spinner color="border-t-blue-500" />
              : products.length === 0
                ? <EmptyState Icon={FiPackage} title="No products yet" subtitle="Create your first batch above" />
                : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((p) => (
                      <ProductCard key={p._id} product={p} onClick={() => { setSelected(p); setTab("Transfer"); }} />
                    ))}
                  </div>
            }
          </div>
        )}

        {/* ── Transfer ── */}
        {tab === "Transfer" && (
          <Card className="max-w-lg">
            <SectionTitle Icon={FiSend}>Transfer to Supplier</SectionTitle>

            {products.length === 0
              ? <EmptyState Icon={FiPackage} title="No products to transfer" subtitle="Create a batch first" />
              : <>
                  <div className="mb-4">
                    <label className="text-gray-400 text-xs font-medium block mb-2">Select Product</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {products.map((p) => (
                        <ProductSelectItem
                          key={p._id} product={p} selected={selected} onClick={setSelected}
                          accentColor="border-blue-500 bg-blue-500/10 text-blue-300"
                        />
                      ))}
                    </div>
                  </div>

                  {selected && (
                    <div className="bg-blue-500/8 border border-blue-500/25 rounded-xl p-3 mb-4 text-sm">
                      <p className="text-blue-300 font-medium">{selected.productName}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{selected.batchId}</p>
                    </div>
                  )}

                  <form onSubmit={handleTransfer} className="space-y-4">
                    <WalletInput label="Supplier Wallet Address" value={toWallet}
                      onChange={(e) => setToWallet(e.target.value)} focusColor={FOCUS} />
                    <SubmitBtn submitting={submitting} gradientClass={BTN_GRADIENT}
                      Icon={FiSend} disabled={!selected}>
                      Transfer Ownership
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
