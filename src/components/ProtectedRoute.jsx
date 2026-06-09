import { Navigate, Outlet } from "react-router-dom";
import { getUser, isAuthenticated } from "../utils/auth";

const ROLE_HOME = {
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
  CUSTOMER: "/dashboard",
};

export default function ProtectedRoute({ role, children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const user = getUser();

  if (role && user?.role !== role) {
    const fallback = ROLE_HOME[user?.role] ?? "/";
    return <Navigate to={fallback} replace />;
  }

  return children || <Outlet />;
}
