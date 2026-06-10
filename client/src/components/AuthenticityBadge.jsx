import { FiShield, FiAlertTriangle } from "react-icons/fi";

/**
 * AuthenticityBadge — shows AUTHENTIC or TAMPERED status.
 * Props: isAuthentic (bool), size ("sm" | "lg")
 */
export default function AuthenticityBadge({ isAuthentic, size = "sm" }) {
  if (isAuthentic === undefined || isAuthentic === null) return null;

  const isLg = size === "lg";

  return isAuthentic ? (
    <div className={`inline-flex items-center gap-1.5
      ${isLg ? "px-5 py-2.5 text-sm rounded-xl" : "px-2.5 py-1 text-xs rounded-full"}
      font-semibold bg-emerald-500/12 border border-emerald-500/35 text-emerald-400`}
    >
      <FiShield className={isLg ? "w-4 h-4" : "w-3 h-3"} />
      AUTHENTIC
    </div>
  ) : (
    <div className={`inline-flex items-center gap-1.5
      ${isLg ? "px-5 py-2.5 text-sm rounded-xl" : "px-2.5 py-1 text-xs rounded-full"}
      font-semibold bg-red-500/12 border border-red-500/35 text-red-400`}
    >
      <FiAlertTriangle className={isLg ? "w-4 h-4" : "w-3 h-3"} />
      TAMPERED
    </div>
  );
}
