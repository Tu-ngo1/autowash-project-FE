import { useNavigate } from "react-router-dom";
import { clearAuth } from "../utils/auth";

const CUSTOMER_LINKS = [
  { label: "Home", to: "/dashboard" },
  { label: "Booking", to: "/booking" },
  { label: "History", to: "/history" },
  { label: "Profile", to: "/profile" },
  { label: "Rewards", to: "/rewards" },
];

export default function UserNavbar({ active }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <nav className="fixed left-1/2 top-5 z-50 w-[calc(100%-24px)] max-w-[1520px] -translate-x-1/2 font-body-md md:w-[82vw]">
      <div className="mx-auto flex min-h-16 w-full items-center justify-between gap-3 rounded-[24px] border border-white/75 bg-white/72 px-4 py-3 shadow-[0_22px_70px_rgba(2,40,70,0.18)] backdrop-blur-2xl lg:grid lg:h-[76px] lg:grid-cols-[1fr_auto_1fr] lg:px-6 lg:py-0">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex shrink-0 items-center gap-3 justify-self-start text-left"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
            <span className="material-symbols-outlined text-[23px]">
              local_car_wash
            </span>
          </span>
          <span>
            <span className="block text-xl font-black leading-none text-slate-950">
              autoWash
            </span>
            <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700">
              wash system
            </span>
          </span>
        </button>

        <div className="hidden min-w-0 items-center justify-center gap-2 rounded-2xl bg-slate-950/5 p-1 lg:flex">
          {CUSTOMER_LINKS.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`h-10 whitespace-nowrap rounded-xl px-4 text-center text-sm leading-10 transition-all ${
                active === item.label
                  ? "bg-white font-black text-[#0061a5] shadow-sm"
                  : "font-black text-[#3f4753] hover:bg-white/70 hover:text-[#0061a5]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2 justify-self-end sm:gap-3 lg:gap-4">
          <button
            type="button"
            onClick={() => navigate("/booking")}
            className="whitespace-nowrap rounded-xl bg-[#0d99ff] px-3 py-2 text-xs font-black text-[#002f55] transition-all hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-lg active:scale-95 md:px-5 md:py-3"
          >
            Đặt lịch ngay
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap rounded-xl bg-white px-3 py-2 text-xs font-black text-[#3f4753] shadow-sm transition-colors hover:text-red-600 md:px-4 md:py-3"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
