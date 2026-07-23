import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

// Public Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import InfoPage from "./pages/InfoPage";
import AppFooter from "./components/AppFooter";
import ScrollToTop from "./components/ScrollToTop";

// Customer Pages
import CustomerBooking from "./pages/customer/CustomerBooking";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerHistory from "./pages/customer/CustomerHistory";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerLoyalty, { VoucherPage } from "./pages/customer/CustomerLoyalty";
import PaymentSuccess from "./pages/customer/PaymentSuccess";
import PaymentFailed from "./pages/customer/PaymentFailed";

// Admin Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPromotionTier from "./pages/admin/AdminPromotionTier";
import AdminServices from "./pages/admin/AdminServices";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminOperations from "./pages/admin/AdminOperations";

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffQueue from "./pages/staff/StaffQueue";
import StaffCustomers from "./pages/staff/StaffCustomers";

import ProtectedRoute from "./components/ProtectedRoute";

function AnimatedRoutes() {
  const location = useLocation();
  const showPublicFooter =
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/staff");

  return (
    <div key={location.pathname} className="route-transition-shell">
      <Routes location={location}>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<InfoPage page="about" />} />
        <Route path="/terms" element={<InfoPage page="terms" />} />
        <Route path="/privacy" element={<InfoPage page="privacy" />} />

        {/* ================= CUSTOMER ROUTES ================= */}
        <Route element={<ProtectedRoute role="CUSTOMER" />}>
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/booking" element={<CustomerBooking />} />
          <Route path="/history" element={<CustomerHistory />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/profile/vehicles/new" element={<CustomerProfile />} />
          <Route
            path="/profile/vehicles/:vehicleId/edit"
            element={<CustomerProfile />}
          />
          <Route path="/rewards" element={<CustomerLoyalty />} />
          <Route path="/rewards/vouchers" element={<VoucherPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
        </Route>

        {/* ================= ADMIN ROUTES (Nested Layout) ================= */}
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/promotions" element={<AdminPromotionTier />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/operations" element={<AdminOperations />} />
          </Route>
        </Route>

        {/* ================= STAFF ROUTES ================= */}
        <Route element={<ProtectedRoute role="STAFF" />}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/queue" element={<StaffQueue />} />
          <Route path="/staff/customers" element={<StaffCustomers />} />
        </Route>
      </Routes>
      {showPublicFooter && <AppFooter />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
