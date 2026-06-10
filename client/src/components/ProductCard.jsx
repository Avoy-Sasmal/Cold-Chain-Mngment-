import AuthenticityBadge from "./AuthenticityBadge";
import { FiMapPin, FiThermometer, FiCalendar, FiClock, FiAlertTriangle } from "react-icons/fi";

const STATUS_CONFIG = {
  CREATED:        { label: "Created",        cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  WITH_SUPPLIER:  { label: "With Supplier",  cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  WITH_WAREHOUSE: { label: "In Warehouse",   cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  WITH_RETAILER:  { label: "With Retailer",  cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  SOLD:           { label: "Sold",           cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

export default function ProductCard({ product, onClick, isAuthentic }) {
  const status    = STATUS_CONFIG[product.status] || STATUS_CONFIG.CREATED;
  const isExpired = new Date(product.expiryDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="group relative bg-gray-900/60 border border-white/8 rounded-2xl p-5 cursor-pointer hover:border-white/20 hover:bg-gray-900/80 transition-all duration-200 overflow-hidden"
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{product.productName}</h3>
          <p className="text-gray-500 text-xs font-mono mt-0.5">{product.batchId}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${status.cls}`}>
            {status.label}
          </span>
          {isAuthentic !== null && isAuthentic !== undefined && (
            <AuthenticityBadge isAuthentic={isAuthentic} size="sm" />
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <FiMapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-gray-500">Origin</p>
            <p className="text-gray-300 font-medium truncate">{product.origin}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <FiThermometer className="w-3 h-3 text-gray-600 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Temp</p>
            <p className="text-gray-300 font-medium">{product.minTemperature}° – {product.maxTemperature}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <FiCalendar className="w-3 h-3 text-gray-600 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Expiry</p>
            <p className={`font-medium flex items-center gap-1 ${isExpired ? "text-red-400" : "text-gray-300"}`}>
              {new Date(product.expiryDate).toLocaleDateString()}
              {isExpired && <FiAlertTriangle className="w-3 h-3" />}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <FiClock className="w-3 h-3 text-gray-600 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Created</p>
            <p className="text-gray-300 font-medium">{new Date(product.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
