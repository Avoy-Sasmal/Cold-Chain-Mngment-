import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Navbar from "./components/Navbar";

import LandingPage          from "./pages/LandingPage";
import AdminDashboard       from "./pages/AdminDashboard";
import ManufacturerDashboard from "./pages/ManufacturerDashboard";
import SupplierDashboard    from "./pages/SupplierDashboard";
import WarehouseDashboard   from "./pages/WarehouseDashboard";
import RetailerDashboard    from "./pages/RetailerDashboard";
import CustomerSearch       from "./pages/CustomerSearch";

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="min-h-screen bg-gray-950">
          <Navbar />
          <Routes>
            <Route path="/"             element={<LandingPage />} />
            <Route path="/search"       element={<CustomerSearch />} />
            <Route path="/admin"        element={<AdminDashboard />} />
            <Route path="/manufacturer" element={<ManufacturerDashboard />} />
            <Route path="/supplier"     element={<SupplierDashboard />} />
            <Route path="/warehouse"    element={<WarehouseDashboard />} />
            <Route path="/retailer"     element={<RetailerDashboard />} />
            {/* Catch-all → Landing */}
            <Route path="*"             element={<LandingPage />} />
          </Routes>
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;