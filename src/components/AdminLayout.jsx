import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, getUserName } from "../utils/auth";

const NAV_ITEMS = [
  { label: "Tổng quan", icon: "dashboard", path: "/admin/dashboard" },
  { label: "Đơn đặt lịch", icon: "calendar_month", path: "/admin/bookings" },
  {
    label: "Ưu đãi & hạng",
    icon: "local_activity",
    path: "/admin/promotions",
  },
  { label: "Dịch vụ", icon: "build", path: "/admin/services" },
  { label: "Người dùng", icon: "group", path: "/admin/users" },
  {
    label: "Cấu hình thời gian",
    icon: "pending_actions",
    path: "/admin/operations",
  },
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
    <div className="flex h-screen overflow-hidden bg-[#05070a] text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-zinc-800 bg-black lg:flex">
        <div className="relative flex h-20 items-center border-b border-zinc-800 px-5">
          <div className="admin-scanline pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-cyan-400/50 bg-cyan-400/10">
              <span className="material-symbols-outlined text-2xl text-cyan-300">
                water_drop
              </span>
            </div>
            <div>
              <h1 className="font-mono text-xl font-black tracking-tight text-zinc-50">
                AutoWash Pro
              </h1>
              <p className="-mt-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                BẢNG ĐIỀU KHIỂN ADMIN
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative flex w-full items-center gap-3 overflow-hidden border px-4 py-3 text-left font-mono text-xs font-black uppercase tracking-[0.12em] transition duration-300 ${
                  isActive
                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200 shadow-[0_14px_40px_rgba(34,211,238,0.08)]"
                    : "border-transparent text-zinc-500 hover:border-zinc-800 hover:bg-zinc-950 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-y-0 left-0 w-1 bg-cyan-300" />
                )}
                <span className="material-symbols-outlined text-[21px] transition group-hover:scale-110">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4">
          {/* Profile Card */}
          <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex h-10 w-10 items-center justify-center border border-zinc-700 bg-black">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-mono text-sm font-black text-zinc-100">
                {userName}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Admin
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-zinc-500 hover:text-red-300"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="admin-motion-root flex-1 overflow-auto bg-[#05070a] p-0 pb-24 lg:pb-0">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-black/95 px-2 py-2 backdrop-blur lg:hidden">
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
                  className={`flex min-w-0 flex-col items-center gap-1 border px-1 py-2 font-mono text-[10px] font-black uppercase transition-colors ${
                    isActive
                      ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                      : "border-transparent text-zinc-500"
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
