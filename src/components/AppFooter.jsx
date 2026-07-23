import { Link, useLocation } from "react-router-dom";

export const CONTACT_PHONE = "0868939477";

export const footerInfoLinks = [
  { label: "Về chúng tôi", path: "/about" },
  { label: "Điều khoản dịch vụ", path: "/terms" },
  { label: "Chính sách bảo mật", path: "/privacy" },
];

export default function AppFooter({ variant = "soft" }) {
  const location = useLocation();
  const isLight = variant === "light";

  return (
    <footer
      className={`border-t ${
        isLight
          ? "border-slate-200 bg-slate-50"
          : "border-white/70 bg-white/44 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-center justify-between gap-6 px-4 py-10 text-center sm:px-6 md:flex-row md:text-left lg:px-10">
        <div>
          <div className="mb-2 text-2xl font-black text-slate-950">
            autoWash
          </div>
          <p className="text-base font-semibold text-slate-500">
            © 2026 autoWash - Giải pháp chăm sóc xe chuyên nghiệp
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-5">
          {footerInfoLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-base font-bold transition-colors ${
                location.pathname === link.path
                  ? "text-cyan-700"
                  : "text-slate-500 hover:text-cyan-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-base font-black text-cyan-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-100"
          >
            <span className="material-symbols-outlined text-lg">call</span>
            {CONTACT_PHONE}
          </a>
        </nav>
      </div>
    </footer>
  );
}
