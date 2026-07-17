import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getUser, isAuthenticated, updateUser } from "../utils/auth";
import { getProfile } from "../services/customerUserApi";

const CUSTOMER_LINKS = [
  { label: "Trang chủ", activeKey: "Home", to: "/dashboard" },
  { label: "Đặt lịch", activeKey: "Booking", to: "/booking" },
  { label: "Lịch sử", activeKey: "History", to: "/history" },
  { label: "Hồ sơ", activeKey: "Profile", to: "/profile" },
  { label: "Ưu đãi", activeKey: "Rewards", to: "/rewards" },
];

export default function UserNavbar({ active }) {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [userName, setUserName] = useState("Khách hàng");
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated) return;

    // Cache-first: load immediately from local storage
    const localUser = getUser();
    if (localUser) {
      setBalance(localUser.walletBalance ?? 0);
      setUserName(localUser.name || localUser.fullName || "Khách hàng");
    }

    // Fresh fetch from API
    getProfile()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? {};
        const walletBalance = data.walletBalance ?? data.balance ?? 0;
        const name = data.fullName || data.name || "Khách hàng";
        setBalance(walletBalance);
        setUserName(name);
        updateUser({ walletBalance, name });
      })
      .catch(() => {});
  }, [authenticated]);

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <nav className="fixed left-1/2 top-5 z-50 w-[calc(100%-24px)] max-w-[1520px] -translate-x-1/2 font-body-md md:w-[82vw]">
      <div className="mx-auto flex min-h-16 w-full items-center justify-between gap-4 rounded-[24px] border border-cyan-100/80 bg-[#f4fafc]/82 px-4 py-3 shadow-[0_22px_70px_rgba(0,90,130,0.2)] backdrop-blur-2xl lg:h-[76px] lg:px-6 lg:py-0">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex shrink-0 items-center gap-3 text-left"
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

        <div className="hidden items-center justify-center gap-1.5 rounded-2xl bg-[#003c5f]/8 p-1 lg:flex">
          {CUSTOMER_LINKS.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`h-10 whitespace-nowrap rounded-xl px-4 text-center text-sm leading-10 transition-all ${
                active === item.label || active === item.activeKey
                  ? "bg-white font-black text-[#005c91] shadow-sm"
                  : "font-black text-[#314c5f] hover:bg-white/70 hover:text-[#005c91]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3 lg:gap-4">
          {authenticated && balance !== null && (
            <div
              onClick={() => navigate("/profile?tab=wallet")}
              className="hidden items-center gap-1.5 rounded-xl border border-cyan-200 bg-white/70 px-3 py-2 text-xs font-black text-[#005c91] cursor-pointer hover:bg-white transition-colors sm:flex"
            >
              <span className="material-symbols-outlined text-[16px] text-cyan-600">account_balance_wallet</span>
              <span>{balance.toLocaleString("vi-VN")}đ</span>
            </div>
          )}
          {authenticated && (
            <div
              onClick={() => navigate("/profile")}
              className="hidden min-w-0 max-w-[150px] cursor-pointer items-center gap-2 hover:opacity-80 sm:flex lg:max-w-[190px] 2xl:max-w-[260px]"
              title={userName}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white font-black text-xs uppercase">
                {userName.charAt(0)}
              </div>
              <span className="hidden min-w-0 truncate text-xs font-black text-[#314c5f] xl:inline">
                {userName}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate("/booking")}
            className="whitespace-nowrap rounded-xl bg-[#0d99ff] px-3 py-2 text-xs font-black text-[#002f55] transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-lg active:scale-[0.96] active:translate-y-px md:px-5 md:py-3"
          >
            Đặt lịch ngay
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap rounded-xl bg-white px-3 py-2 text-xs font-black text-[#3f4753] shadow-sm transition-all duration-200 hover:text-red-600 active:scale-[0.96] active:translate-y-px md:px-4 md:py-3"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
