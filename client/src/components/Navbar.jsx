import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { FiHome, FiSearch, FiLayout, FiLoader } from "react-icons/fi";
import { HiOutlineWallet } from "react-icons/hi2";

const ROLE_ROUTES = {
  NONE:         "/",
  MANUFACTURER: "/manufacturer",
  SUPPLIER:     "/supplier",
  WAREHOUSE:    "/warehouse",
  RETAILER:     "/retailer",
};

const NAV_LINKS = [
  { label: "Home",   to: "/",       Icon: FiHome   },
  { label: "Search", to: "/search", Icon: FiSearch },
];

export default function Navbar() {
  const { account, roleName, roleColor, isConnected, isAdmin, loading, connect } = useWallet();
  const location = useLocation();

  const dashboardPath = isAdmin ? "/admin" : (ROLE_ROUTES[roleName] || "/");

  return (
    <nav className="sticky top-0 z-50 border-b border-white/8 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-cyan-500/20">
            CC
          </div>
          <span className="text-white font-semibold text-sm hidden sm:block">
            ColdChain<span className="text-cyan-400">Pro</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ label, to, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}

          {isConnected && (
            <Link
              to={dashboardPath}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === dashboardPath
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FiLayout className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          )}
        </div>

        {/* Wallet section */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              {/* Role badge */}
              <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white ${roleColor}`}>
                {isAdmin ? "ADMIN" : roleName}
              </span>
              {/* Wallet address */}
              <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <HiOutlineWallet className="w-3.5 h-3.5" />
                {account.slice(0, 6)}…{account.slice(-4)}
              </span>
            </>
          ) : (
            <button
              onClick={connect}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {loading
                ? <FiLoader className="w-4 h-4 animate-spin" />
                : <HiOutlineWallet className="w-4 h-4" />
              }
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
