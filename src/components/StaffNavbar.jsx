import { useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getUserName } from "../utils/auth";

const NAV_LINKS = [
  { label: "Dashboard", to: "/staff/dashboard", icon: "dashboard" },
  { label: "Queue", to: "/staff/queue", icon: "queue_play_next" },
  { label: "Customers", to: "/staff/customers", icon: "person" },
];

export default function StaffNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const userName = getUserName() || "Staff";

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <>
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-[#3c494c] bg-[#070d1f]/95 px-4 backdrop-blur lg:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3c494c] bg-[#2e3447]">
          <span className="material-symbols-outlined text-[#8aebff]">
            engineering
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#dce1fb]">
            {userName}
          </p>
          <p className="truncate text-[10px] uppercase tracking-widest text-[#bbc9cd]">
            Staff Console
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#3c494c] text-[#bbc9cd] hover:text-[#ffb4ab]"
        title="Đăng xuất"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </button>
    </header>

    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-[#3c494c] bg-[#070d1f] py-5 lg:flex">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#2e3447] flex items-center justify-center border border-[#3c494c] overflow-hidden flex-shrink-0">
          <span className="material-symbols-outlined text-[#8aebff]">
            engineering
          </span>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#dce1fb] leading-tight">
            {userName}
          </p>
          <p
            className="text-[10px] text-[#bbc9cd] tracking-widest uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Terminal A-42
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {NAV_LINKS.map(({ label, to, icon }) => {
          const isActive = pathname === to || pathname.startsWith(to + "/");
          return (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded transition-all text-left ${
                isActive
                  ? "bg-[#8aebff]/10 text-[#8aebff] border-l-2 border-[#8aebff]"
                  : "text-[#bbc9cd] hover:bg-[#191f31] hover:text-[#dce1fb]"
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

      <div className="mt-auto px-2 pt-4 border-t border-[#3c494c]">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded text-[#bbc9cd] hover:text-[#ffb4ab] hover:bg-[#191f31] transition-all text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span
            className="text-[12px] tracking-widest uppercase font-bold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#3c494c] bg-[#070d1f]/95 px-3 py-2 backdrop-blur lg:hidden">
      <div className="grid grid-cols-3 gap-2">
        {NAV_LINKS.map(({ label, to, icon }) => {
          const isActive = pathname === to || pathname.startsWith(to + "/");
          return (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className={`flex flex-col items-center gap-1 rounded px-2 py-2 text-[10px] font-bold uppercase tracking-wider ${
                isActive
                  ? "bg-[#8aebff]/10 text-[#8aebff]"
                  : "text-[#bbc9cd]"
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
