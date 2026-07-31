import { useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getUserName } from "../utils/auth";

const NAV_LINKS = [
  { label: "Tổng quan", to: "/staff/dashboard", icon: "dashboard" },
  { label: "Hàng chờ", to: "/staff/queue", icon: "queue_play_next" },
  { label: "Đặt lịch nhanh", to: "/staff/customers", icon: "person" },
  { label: "Giao xe & Thanh toán", to: "/staff/checkout", icon: "receipt_long" },
];

export default function StaffNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const userName = getUserName() || "Staff";

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <>
      <header className="staff-nav-glow sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-sky-100/15 bg-[#0b2532]/90 px-4 backdrop-blur-2xl lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-teal-100/25 bg-teal-100/12 shadow-[0_0_28px_rgba(94,234,212,0.14)]">
            <span className="material-symbols-outlined text-[#6ff6df]">
              engineering
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#ecfeff]">
              {userName}
            </p>
            <p className="truncate text-[10px] uppercase tracking-widest text-[#b8d8de]">
              Bảng Staff
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-100/15 text-[#b8d8de] transition hover:border-rose-300/40 hover:text-[#ffb4ab]"
          title="Đăng xuất"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </header>

      <aside className="staff-nav-glow fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-sky-100/15 bg-[#0b2532]/96 py-5 backdrop-blur-2xl lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(94,234,212,0.16),transparent_34%)]" />
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-[#123746] flex items-center justify-center border border-teal-100/25 overflow-hidden flex-shrink-0 shadow-[0_0_34px_rgba(94,234,212,0.15)]">
            <span className="material-symbols-outlined text-[#6ff6df]">
              engineering
            </span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#ecfeff] leading-tight">
              {userName}
            </p>
            <p
              className="text-[10px] text-[#b8d8de] tracking-widest uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Bảng Staff
            </p>
          </div>
        </div>

        <nav className="relative flex-1 space-y-2 px-2">
          {NAV_LINKS.map(({ label, to, icon }) => {
            const isActive = pathname === to || pathname.startsWith(to + "/");
            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className={`group w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left active:scale-[0.98] ${
                  isActive
                    ? "bg-teal-100/12 text-[#6ff6df] ring-1 ring-teal-100/20 shadow-[0_14px_34px_rgba(94,234,212,0.08)]"
                    : "text-[#b8d8de] hover:bg-white/[0.06] hover:text-[#ecfeff]"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span
                  className="text-[12px] tracking-widest uppercase font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="relative mt-auto px-2 pt-4 border-t border-sky-100/15">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[#b8d8de] hover:text-[#ffb4ab] hover:bg-white/[0.06] transition-all text-left active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>
            <span
              className="text-[12px] tracking-widest uppercase font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>
      <nav className="staff-nav-glow fixed inset-x-0 bottom-0 z-50 border-t border-sky-100/15 bg-[#0b2532]/92 px-3 py-2 backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-4 gap-1.5">
          {NAV_LINKS.map(({ label, to, icon }) => {
            const isActive = pathname === to || pathname.startsWith(to + "/");
            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold uppercase tracking-wider transition active:scale-[0.98] ${
                  isActive
                    ? "bg-[#6ff6df]/12 text-[#6ff6df] ring-1 ring-teal-100/20"
                    : "text-[#b8d8de]"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {icon}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
