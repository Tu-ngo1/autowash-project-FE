import { useNavigate } from "react-router-dom";
import { getUserRole, clearAuth } from "../utils/auth";

const CUSTOMER_LINKS = [
  { label: "Home", to: "/" },
  { label: "Booking", to: "/booking" },
  { label: "History", to: "/history" },
  { label: "Profile", to: "/profile" },
  { label: "Rewards", to: "/rewards" },
];

export default function UserNavbar({ active }) {
  const navigate = useNavigate();
  const role = getUserRole();
  const links = role === "ADMIN" ? [] : CUSTOMER_LINKS;

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#bfc7d5]/30 bg-white/80 font-body-md shadow-sm backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:grid lg:h-16 lg:grid-cols-[1fr_auto_1fr] lg:px-10 lg:py-0 xl:px-14">
        <button
          type="button"
          onClick={() => navigate(role === "ADMIN" ? "/admin/dashboard" : "/")}
          className="shrink-0 justify-self-start text-xl font-bold leading-none text-[#0061a5] md:text-2xl"
        >
          autoWash
        </button>

        <div className="hidden min-w-0 items-center justify-center gap-8 lg:flex">
          {links.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`h-10 whitespace-nowrap border-b-2 px-1 text-center text-base leading-10 transition-colors ${
                active === item.label
                  ? "border-[#0061a5] font-bold text-[#0061a5]"
                  : "border-transparent font-normal text-[#3f4753] hover:text-[#0061a5]"
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
            className="whitespace-nowrap rounded-full bg-[#0d99ff] px-3 py-2 text-xs font-bold text-[#002f55] transition-all hover:shadow-lg active:scale-95 md:px-6"
          >
            Đặt lịch ngay
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap text-xs font-bold text-[#3f4753] transition-colors hover:text-red-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
