/**
 * DashboardShell.jsx
 * Shared layout wrapper for all role dashboards.
 * Provides: page header, tab navigation, consistent spacing & background.
 */
import { FiRefreshCw, FiLoader } from "react-icons/fi";

// ── Tab Bar ────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange, accentClass = "bg-blue-600" }) {
  return (
    <div className="flex gap-1 bg-gray-900/80 border border-white/8 p-1 rounded-xl mb-6 w-fit flex-wrap">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active === t
              ? `${accentClass} text-white shadow`
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────────────────
export function DashboardHeader({ Icon, title, account, gradientClass, badge }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl ${gradientClass} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-500 text-xs font-mono mt-0.5">
            {account?.slice(0, 10)}…{account?.slice(-6)}
          </p>
        </div>
      </div>
      {badge}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
export function StatCard({ Icon, label, value, color = "text-cyan-400" }) {
  return (
    <div className="bg-gray-900/60 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-gray-500 text-xs">{label}</p>
      </div>
    </div>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-gray-900/60 border border-white/8 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Section Heading ────────────────────────────────────────────────────────
export function SectionTitle({ Icon, children, color = "text-white" }) {
  return (
    <h2 className={`font-semibold text-base mb-5 flex items-center gap-2 ${color}`}>
      {Icon && <Icon className="w-4 h-4 opacity-70" />}
      {children}
    </h2>
  );
}

// ── Refresh Button ─────────────────────────────────────────────────────────
export function RefreshBtn({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
    >
      {loading
        ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
        : <FiRefreshCw className="w-3.5 h-3.5" />
      }
      Refresh
    </button>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ Icon, title, subtitle }) {
  return (
    <div className="text-center py-16 bg-gray-900/40 border border-white/8 rounded-2xl">
      {Icon && (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-gray-600 mx-auto mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="text-gray-400 font-medium">{title}</p>
      {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Loading Spinner ────────────────────────────────────────────────────────
export function Spinner({ color = "border-t-cyan-500" }) {
  return (
    <div className="flex justify-center py-16">
      <span className={`w-8 h-8 border-2 border-white/10 ${color} rounded-full animate-spin`} />
    </div>
  );
}

// ── Form Input ─────────────────────────────────────────────────────────────
export function FormInput({ label, required, focusColor = "focus:border-blue-500/60", ...props }) {
  return (
    <div>
      <label className="text-gray-400 text-xs font-medium block mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        {...props}
        className={`w-full bg-gray-800/80 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none ${focusColor} transition-colors`}
      />
    </div>
  );
}

// ── Submit Button ──────────────────────────────────────────────────────────
export function SubmitBtn({ submitting, children, gradientClass = "from-blue-600 to-cyan-600", Icon, disabled }) {
  return (
    <button
      type="submit"
      disabled={submitting || disabled}
      className={`w-full py-3 rounded-xl bg-gradient-to-r ${gradientClass} text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm`}
    >
      {submitting
        ? <><FiLoader className="w-4 h-4 animate-spin" /> Processing…</>
        : <>{Icon && <Icon className="w-4 h-4" />}{children}</>
      }
    </button>
  );
}

// ── Not Connected Gate ─────────────────────────────────────────────────────
export function ConnectGate({ connect, title, Icon, gradientClass }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-5 max-w-sm px-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${gradientClass} mx-auto shadow-xl`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">Connect your wallet to access this dashboard</p>
        </div>
        <button
          onClick={connect}
          className={`px-8 py-3 rounded-xl bg-gradient-to-r ${gradientClass} text-white font-semibold hover:opacity-90 transition-all shadow-lg`}
        >
          Connect MetaMask
        </button>
      </div>
    </div>
  );
}

// ── Access Denied ──────────────────────────────────────────────────────────
export function AccessDenied({ roleName, required }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto mb-4">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-white text-xl font-bold">Access Denied</h2>
        <p className="text-gray-400 text-sm mt-2">
          This dashboard requires <span className="text-white font-bold">{required}</span> role.
        </p>
        <p className="text-gray-600 text-xs mt-2">
          Your role: <span className="text-gray-400">{roleName || "NONE"}</span>
        </p>
      </div>
    </div>
  );
}

// ── Log Entry ──────────────────────────────────────────────────────────────
export function LogEntry({ log }) {
  return (
    <div className={`p-3 rounded-xl border text-xs ${log.isSafe
      ? "border-white/8 bg-gray-800/40"
      : "border-red-500/30 bg-red-500/8"
    }`}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-white text-sm">{log.temperature}°C</span>
        <span className={`font-semibold ${log.isSafe ? "text-emerald-400" : "text-red-400"}`}>
          {log.isSafe ? "Safe" : log.alertType || "Alert"}
        </span>
      </div>
      <p className="text-gray-400">{log.location} · {log.sealStatus}</p>
      <p className="text-gray-600 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
    </div>
  );
}

// ── Product Selector Item ──────────────────────────────────────────────────
export function ProductSelectItem({ product, selected, onClick, accentColor = "border-blue-500 bg-blue-500/10 text-blue-400" }) {
  return (
    <div
      onClick={() => onClick(product)}
      className={`p-3 rounded-xl border cursor-pointer text-sm transition-all ${
        selected?._id === product._id
          ? accentColor
          : "border-white/8 bg-gray-800/50 text-gray-300 hover:border-white/20"
      }`}
    >
      <span className="font-medium">{product.productName}</span>
      <span className="text-gray-500 ml-2 text-xs">({product.batchId})</span>
    </div>
  );
}

// ── Wallet Input ───────────────────────────────────────────────────────────
export function WalletInput({ label, value, onChange, focusColor = "focus:border-blue-500/60" }) {
  return (
    <div>
      <label className="text-gray-400 text-xs font-medium block mb-1.5">
        {label}<span className="text-red-400 ml-0.5">*</span>
      </label>
      <input
        type="text"
        placeholder="0x..."
        value={value}
        onChange={onChange}
        required
        className={`w-full bg-gray-800/80 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm font-mono placeholder-gray-600 focus:outline-none ${focusColor} transition-colors`}
      />
    </div>
  );
}
