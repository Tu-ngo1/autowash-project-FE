import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Customer Pages
import BookingPage from "./pages/customer/BookingPage";
import HistoryPage from "./pages/customer/HistoryPage";
import ProfilePage from "./pages/customer/ProfilePage";
import LoyaltyDashboard, { VoucherPage } from "./pages/customer/LoyaltyDashboard";

// Admin Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPromotionTier from "./pages/admin/AdminPromotionTier";
import AdminServices from "./pages/admin/AdminServices";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminBookings from "./pages/admin/AdminBookings"; // ← Trang Booking Admin

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffQueue from "./pages/staff/StaffQueue";
import StaffCustomers from "./pages/staff/StaffCustomers";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ================= CUSTOMER ROUTES ================= */}
        <Route element={<ProtectedRoute role="CUSTOMER" />}>
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={<LoyaltyDashboard />} />
          <Route path="/rewards" element={<LoyaltyDashboard />} />
          <Route path="/rewards/vouchers" element={<VoucherPage />} />
        </Route>

        {/* ================= ADMIN ROUTES (Nested Layout) ================= */}
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/promotions" element={<AdminPromotionTier />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
          </Route>
        </Route>

        {/* ================= STAFF ROUTES ================= */}
        <Route element={<ProtectedRoute role="STAFF" />}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/queue" element={<StaffQueue />} />
          <Route path="/staff/customers" element={<StaffCustomers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
