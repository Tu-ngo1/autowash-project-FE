import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, getUserName } from "../utils/auth";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", path: "/admin/dashboard" },
  { label: "Bookings", icon: "calendar_month", path: "/admin/bookings" },
  {
    label: "Promotions & Tiers",
    icon: "local_activity",
    path: "/admin/promotions",
  },
  { label: "Services", icon: "build", path: "/admin/services" },
  { label: "Customers", icon: "group", path: "/admin/customers" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = getUserName() || "SYS_ADMIN";

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-surface-container-highest bg-surface-container-low lg:flex">
        <div className="h-16 flex items-center px-6 border-b border-surface-container-highest">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center rounded">
              <span className="material-symbols-outlined text-background text-2xl">
                water_drop
              </span>
            </div>
            <div>
              <h1 className="text-on-surface font-bold tracking-tight text-xl">
                AutoWash Pro
              </h1>
              <p className="text-[10px] text-on-surface-variant -mt-1">
                ADMIN PORTAL
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-container-highest">
          <div className="flex items-center gap-3 p-3 bg-surface-container-high rounded-xl">
            <div className="w-10 h-10 bg-surface-container-highest border border-outline-variant rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface truncate">
                {userName}
              </p>
              <p className="text-xs text-on-surface-variant">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-error p-1"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-surface-container-highest bg-surface-container-low px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary lg:hidden">
              <span className="material-symbols-outlined text-background">
                water_drop
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-headline-sm text-on-surface">
                {NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))
                  ?.label || "Admin"}
              </h2>
              <p className="truncate text-xs text-on-surface-variant lg:hidden">
                {userName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:text-error lg:hidden"
            title="Đăng xuất"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
          <h2 className="hidden text-headline-sm text-on-surface lg:block">
            {NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))
              ?.label || "Admin"}
          </h2>
        </header>

        <main className="flex-1 overflow-auto bg-background p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 lg:pb-8">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-surface-container-highest bg-surface-container-low/95 px-2 py-2 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5 gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-semibold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span className="w-full truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
