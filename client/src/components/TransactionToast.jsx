import { useEffect, useState } from "react";
import { FiLoader, FiCheckCircle, FiXCircle, FiX } from "react-icons/fi";

const CONFIG = {
  pending: {
    Icon:  FiLoader,
    color: "border-amber-500/40 bg-amber-500/8",
    text:  "text-amber-400",
    label: "Transaction Pending…",
    spin:  true,
  },
  success: {
    Icon:  FiCheckCircle,
    color: "border-emerald-500/40 bg-emerald-500/8",
    text:  "text-emerald-400",
    label: "Transaction Confirmed!",
    spin:  false,
  },
  error: {
    Icon:  FiXCircle,
    color: "border-red-500/40 bg-red-500/8",
    text:  "text-red-400",
    label: "Transaction Failed",
    spin:  false,
  },
};

/**
 * TransactionToast — fixed bottom-right toast for blockchain tx status.
 * Props: status ("pending"|"success"|"error"|null), message, txHash, onClose
 */
export default function TransactionToast({ status, message, txHash, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status) {
      setVisible(true);
      if (status !== "pending") {
        const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 5000);
        return () => clearTimeout(t);
      }
    }
  }, [status, onClose]);

  if (!status) return null;

  const cfg = CONFIG[status];
  if (!cfg) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
      <div className={`flex items-start gap-3 p-4 pr-3 rounded-xl border backdrop-blur-xl shadow-2xl w-80 max-w-[calc(100vw-3rem)] ${cfg.color}`}>

        {/* Icon */}
        <cfg.Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.text} ${cfg.spin ? "animate-spin" : ""}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</p>
          {message && <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{message}</p>}
          {txHash && (
            <p className="text-gray-500 text-xs mt-1 font-mono truncate">
              {txHash.slice(0, 20)}…
            </p>
          )}
        </div>

        {/* Dismiss */}
        {status !== "pending" && (
          <button
            onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
            className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 flex-shrink-0"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * useTxToast — hook to manage toast state across any component.
 */
export function useTxToast() {
  const [toast, setToast] = useState({ status: null, message: "", txHash: "" });

  const showPending = (message = "Waiting for MetaMask…") =>
    setToast({ status: "pending", message, txHash: "" });

  const showSuccess = (message = "Done!", txHash = "") =>
    setToast({ status: "success", message, txHash });

  const showError = (message = "Something went wrong") =>
    setToast({ status: "error", message, txHash: "" });

  const clearToast = () => setToast({ status: null, message: "", txHash: "" });

  return { toast, showPending, showSuccess, showError, clearToast };
}
