import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import {
  FiShield, FiThermometer, FiRefreshCw, FiSearch, FiAlertTriangle, FiUsers,
  FiArrowRight, FiChevronDown, FiBox, FiTruck, FiHome, FiShoppingBag,
  FiLock, FiCheckCircle, FiActivity, FiGlobe,
} from "react-icons/fi";
import {
  HiOutlineSparkles, HiOutlineCube, HiOutlineChartBar,
} from "react-icons/hi2";
import { RiAdminLine, RiShieldCheckLine } from "react-icons/ri";

// ── Data ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: RiShieldCheckLine,
    title: "Blockchain Verified",
    desc: "Every product hash is stored immutably on-chain. Any data tampering is instantly detected.",
    color: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
    iconColor: "text-violet-400",
    glow: "group-hover:shadow-violet-500/20",
  },
  {
    Icon: FiThermometer,
    title: "Cold Chain Monitoring",
    desc: "Real-time temperature, location, and seal status logs with automatic safety alerts.",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
    iconColor: "text-cyan-400",
    glow: "group-hover:shadow-cyan-500/20",
  },
  {
    Icon: FiRefreshCw,
    title: "Controlled Transfers",
    desc: "Smart contracts enforce the supply chain order: Manufacturer → Supplier → Warehouse → Retailer.",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    iconColor: "text-emerald-400",
    glow: "group-hover:shadow-emerald-500/20",
  },
  {
    Icon: FiGlobe,
    title: "Public Transparency",
    desc: "Anyone can verify product authenticity and view the full supply chain journey — no wallet needed.",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
    iconColor: "text-amber-400",
    glow: "group-hover:shadow-amber-500/20",
  },
  {
    Icon: FiAlertTriangle,
    title: "Tamper Detection",
    desc: "SHA256 hashes generated from MongoDB data are compared with blockchain-stored hashes instantly.",
    color: "from-rose-500/20 to-red-500/10 border-rose-500/30",
    iconColor: "text-rose-400",
    glow: "group-hover:shadow-rose-500/20",
  },
  {
    Icon: FiUsers,
    title: "Role-Based Access",
    desc: "MetaMask-authenticated roles ensure only authorized stakeholders perform each supply chain action.",
    color: "from-indigo-500/20 to-blue-500/10 border-indigo-500/30",
    iconColor: "text-indigo-400",
    glow: "group-hover:shadow-indigo-500/20",
  },
];

const STEPS = [
  {
    num: "01", role: "Admin", Icon: RiAdminLine,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/40",
    title: "Creates Stakeholders",
    desc: "Admin assigns roles on-chain via MetaMask. Each wallet gets MANUFACTURER, SUPPLIER, WAREHOUSE, or RETAILER role.",
  },
  {
    num: "02", role: "Manufacturer", Icon: FiBox,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/40",
    title: "Creates Product Batch",
    desc: "Manufacturer registers product metadata in MongoDB, generates a SHA256 hash, and stores it on-chain as proof.",
  },
  {
    num: "03", role: "Supply Chain", Icon: FiRefreshCw,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/40",
    title: "Transfers Ownership",
    desc: "Smart contract enforces the transfer path. Each handoff is recorded on blockchain and in MongoDB.",
  },
  {
    num: "04", role: "Stakeholders", Icon: FiThermometer,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/40",
    title: "Logs Conditions",
    desc: "Temperature, location, and seal checks are logged. Backend generates an integrity hash and records it on-chain.",
  },
  {
    num: "05", role: "Anyone", Icon: FiSearch,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/40",
    title: "Verifies Authenticity",
    desc: "Search by Batch ID to see the full history. MongoDB hash is recomputed and compared with blockchain — instant trust.",
  },
];

const STATS = [
  { value: "3",    label: "Smart Contracts",  Icon: HiOutlineCube },
  { value: "15+",  label: "API Endpoints",    Icon: HiOutlineChartBar },
  { value: "5",    label: "Role Dashboards",  Icon: FiUsers },
  { value: "100%", label: "Tamper-Evident",   Icon: FiCheckCircle },
];

const ROLES = [
  { role: "Admin",        Icon: RiAdminLine,  color: "from-violet-600 to-purple-700",  path: "/admin",        desc: "Create & manage stakeholders" },
  { role: "Manufacturer", Icon: FiBox,        color: "from-blue-600 to-cyan-600",      path: "/manufacturer", desc: "Create batches & transfer" },
  { role: "Supplier",     Icon: FiTruck,      color: "from-emerald-600 to-teal-600",   path: "/supplier",     desc: "Receive, log & transfer" },
  { role: "Warehouse",    Icon: FiHome,       color: "from-amber-600 to-orange-600",   path: "/warehouse",    desc: "Monitor storage & transfer" },
  { role: "Retailer",     Icon: FiShoppingBag,color: "from-purple-600 to-violet-600",  path: "/retailer",     desc: "Receive & verify products" },
];

// ── Animated Counter ───────────────────────────────────────────────────────
function AnimatedCounter({ value }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const numericPart = parseFloat(value);
          const suffix = value.replace(/[0-9.]/g, "");
          if (isNaN(numericPart)) { setDisplay(value); return; }
          let start = 0;
          const duration = 1200;
          const step = numericPart / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= numericPart) {
              setDisplay(value);
              clearInterval(timer);
            } else {
              setDisplay(Math.floor(start) + suffix);
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{display}</span>;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const { isConnected, connect, loading, roleName, isAdmin } = useWallet();
  const heroRef = useRef(null);

  // Subtle parallax on hero blobs
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.25}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (isAdmin) return "/admin";
    const routes = { MANUFACTURER: "/manufacturer", SUPPLIER: "/supplier", WAREHOUSE: "/warehouse", RETAILER: "/retailer" };
    return routes[roleName] || "/search";
  };

  return (
    <div className="bg-gray-950 text-white overflow-x-hidden">

      {/* ── CSS Animations ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-24px) scale(1.04); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(20px) scale(0.97); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .anim-fade-1 { animation: fadeInUp 0.7s ease both; }
        .anim-fade-2 { animation: fadeInUp 0.7s 0.15s ease both; }
        .anim-fade-3 { animation: fadeInUp 0.7s 0.3s ease both; }
        .anim-fade-4 { animation: fadeInUp 0.7s 0.45s ease both; }
        .blob-a { animation: floatA 8s ease-in-out infinite; }
        .blob-b { animation: floatB 11s ease-in-out infinite; }
        .blob-c { animation: floatA 14s 3s ease-in-out infinite; }
        .ring-spin { animation: rotateSlow 18s linear infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #22d3ee, #818cf8, #22d3ee);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px]" />

        {/* Gradient blobs */}
        <div ref={heroRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-a absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[80px]" />
          <div className="blob-b absolute bottom-[10%] right-[8%]  w-[600px] h-[600px] bg-violet-500/8 rounded-full blur-[100px]" />
          <div className="blob-c absolute top-[50%] left-[45%]  w-[400px] h-[400px] bg-blue-500/6 rounded-full blur-[80px]" />
        </div>

        {/* Rotating ring decoration */}
        <div className="ring-spin absolute top-16 right-16 w-48 h-48 border border-cyan-500/10 rounded-full hidden lg:block" />
        <div className="absolute top-16 right-16 w-48 h-48 flex items-center justify-center hidden lg:flex">
          <div className="w-2 h-2 rounded-full bg-cyan-500/40" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">

          {/* Badge */}
          <div className="anim-fade-1 inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/25 rounded-full px-5 py-2 text-cyan-400 text-sm font-medium mb-8">
            <FiActivity className="w-3.5 h-3.5" />
            Blockchain-Powered Cold Chain Management
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="anim-fade-2 text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="text-white">Track. Verify.</span>
            <br />
            <span className="shimmer-text">Trust Everything.</span>
          </h1>

          <p className="anim-fade-3 text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            An enterprise-grade cold chain supply management system where every product hash is stored on-chain,
            every temperature log is tamper-evident, and every transfer is role-verified.
          </p>

          {/* CTA Buttons */}
          <div className="anim-fade-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-cyan-500/25"
            >
              <FiSearch className="w-5 h-5" />
              Search a Product
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {isConnected ? (
              <Link
                to={getDashboardLink()}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/8 border border-white/15 text-white font-bold text-lg hover:bg-white/12 active:scale-95 transition-all backdrop-blur-sm"
              >
                Go to Dashboard
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <button
                onClick={connect}
                disabled={loading}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/8 border border-white/15 text-white font-bold text-lg hover:bg-white/12 active:scale-95 transition-all backdrop-blur-sm disabled:opacity-50"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <FiLock className="w-5 h-5" />
                }
                Connect MetaMask
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-24 max-w-2xl mx-auto">
            {STATS.map(({ value, label, Icon }) => (
              <div key={label} className="text-center group">
                <Icon className="w-5 h-5 text-gray-600 mx-auto mb-2 group-hover:text-cyan-400 transition-colors" />
                <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  <AnimatedCounter value={value} />
                </p>
                <p className="text-gray-500 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 animate-bounce">
          <span className="text-xs">Scroll to explore</span>
          <FiChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-cyan-400 text-sm font-semibold tracking-widest uppercase mb-3">
              <HiOutlineSparkles className="w-4 h-4" />
              Why ColdChain Pro
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Enterprise Trust, Built-In</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every feature is designed around the principle that data integrity must be provable — not just promised.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ Icon, title, desc, color, iconColor, glow }) => (
              <div
                key={title}
                className={`group relative bg-gradient-to-br ${color} border rounded-2xl p-6 hover:scale-[1.02] hover:shadow-xl ${glow} transition-all duration-300 cursor-default`}
              >
                {/* Icon badge */}
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-black/20 border border-white/10 mb-4 ${iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>

                {/* Hover glow dot */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${iconColor.replace("text-", "bg-")} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-28 px-4 bg-gray-900/20 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-violet-400 text-sm font-semibold tracking-widest uppercase mb-3">
              <FiRefreshCw className="w-4 h-4" />
              The Process
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              A complete product lifecycle from batch creation to customer verification.
            </p>
          </div>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-violet-500/50 via-cyan-500/30 to-transparent hidden sm:block" />

            <div className="space-y-6">
              {STEPS.map(({ num, role, Icon, color, title, desc }) => (
                <div key={num} className="flex gap-5 group">
                  {/* Step icon */}
                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-xl border ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content card */}
                  <div className="flex-1 bg-gray-900/50 border border-white/8 rounded-2xl p-5 group-hover:border-white/15 group-hover:bg-gray-900/70 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-600 text-xs font-mono font-bold">{num}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{role}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Role Cards ────────────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-3">
              <FiUsers className="w-4 h-4" />
              Dashboards
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">A Dashboard for Every Role</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Each participant in the supply chain has a dedicated interface tailored to their responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ROLES.map(({ role, Icon, color, path, desc }) => (
              <Link
                key={role}
                to={path}
                className={`group relative bg-gradient-to-br ${color} rounded-2xl p-6 text-center hover:scale-105 hover:shadow-2xl transition-all duration-300 overflow-hidden`}
              >
                {/* Background shine on hover */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black/20 border border-white/20 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">{role}</h3>
                  <p className="text-white/65 text-xs">{desc}</p>
                  <FiArrowRight className="w-4 h-4 text-white/40 mx-auto mt-3 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-cyan-500/8 via-blue-500/8 to-violet-500/8 border border-white/8 rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
            {/* Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:36px_36px]" />

            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-6 shadow-lg shadow-cyan-500/30">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Verify a Product?</h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
                Search any product batch and instantly see its complete supply chain history,
                temperature logs, and authenticity status — no wallet required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/search"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-cyan-500/25"
                >
                  <FiSearch className="w-5 h-5" />
                  Search Products
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                {!isConnected && (
                  <button
                    onClick={connect}
                    disabled={loading}
                    className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white font-bold text-lg hover:bg-white/8 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading
                      ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <FiLock className="w-5 h-5" />
                    }
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
              CC
            </div>
            <span className="text-white font-semibold text-sm">
              ColdChain<span className="text-cyan-400">Pro</span>
            </span>
          </div>
          <p className="text-gray-600 text-xs text-center">
            Built with Solidity · Foundry · React · Node.js · MongoDB
          </p>
          <div className="flex items-center gap-1 text-gray-600 text-xs">
            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Production Ready
          </div>
        </div>
      </footer>
    </div>
  );
}
