import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authApi";
import { getUserRole, isAuthenticated, setAuth } from "../utils/auth";
import { getFriendlyErrorMessage } from "../utils/errorMessage";

const ROLE_PATHS = {
  CUSTOMER: "/dashboard",
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const FLOW_STEPS = [
  {
    title: "Đặt lịch",
    copy: "Khách chọn xe, dịch vụ và khung giờ phù hợp với lịch cá nhân.",
    icon: "event_available",
  },
  {
    title: "Tiếp nhận",
    copy: "Nhân viên xác nhận xe vào khoang và bắt đầu quy trình chăm sóc.",
    icon: "qr_code_scanner",
  },
  {
    title: "Rửa & hoàn thiện",
    copy: "Các bước phủ bọt, xịt áp lực, lau chi tiết và sấy khô được cập nhật rõ ràng.",
    icon: "local_car_wash",
  },
  {
    title: "Nhận xe",
    copy: "Khách xem lại lịch sử, điểm thưởng và ưu đãi trong tài khoản.",
    icon: "verified",
  },
];

const VALUE_PILLARS = [
  {
    title: "Rửa bọt tuyết",
    copy: "Lớp bọt phủ đều thân xe, làm mềm bụi bẩn trước khi xịt sạch bằng nước áp lực.",
    icon: "local_car_wash",
  },
  {
    title: "Xịt gầm áp lực",
    copy: "Làm sạch khu vực gầm, hốc bánh và các điểm dễ bám bùn sau mỗi chuyến đi.",
    icon: "water_drop",
  },
  {
    title: "Lau sấy hoàn thiện",
    copy: "Lau chi tiết, sấy khô và kiểm tra bề mặt để xe sạch bóng khi bàn giao.",
    icon: "auto_fix_high",
  },
];

function LoginPanel() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    account: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    const account = form.account.trim();
    if (!account) {
      next.account = "Vui lòng nhập tên đăng nhập hoặc số điện thoại.";
    } else {
      const isNum = /^\d+$/.test(account);
      if (isNum) {
        if (account.length < 10 || account.length > 11) {
          next.account = "Số điện thoại phải gồm 10 đến 11 chữ số.";
        }
      } else {
        if (account.length < 3) {
          next.account = "Tên đăng nhập phải từ 3 ký tự trở lên.";
        }
      }
    }
    if (!form.password) next.password = "Vui lòng nhập mật khẩu.";
    else if (form.password.length < 6)
      next.password = "Mật khẩu cần ít nhất 6 ký tự.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError("");
    try {
      const authResponse = await login({
        account: form.account,
        password: form.password,
      });
      setAuth(authResponse);
      navigate(ROLE_PATHS[authResponse.user.role] || "/dashboard", {
        replace: true,
      });
    } catch (err) {
      setSubmitError(
        getFriendlyErrorMessage(
          err,
          "Không thể đăng nhập. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="home-reveal relative overflow-hidden rounded-[30px] border border-white/75 bg-white/88 p-5 shadow-[0_34px_110px_rgba(2,74,138,0.2)] backdrop-blur-2xl sm:p-7">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-cyan-200/70 blur-3xl" />
      <div className="home-shimmer pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-transparent via-cyan-200/25 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />

      <div className="relative">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600">
              Member access
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Đăng nhập khoang rửa
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-800 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white"
          >
            Đăng ký
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Tên đăng nhập hoặc Số điện thoại</span>
            <input
              name="account"
              type="text"
              value={form.account}
              onChange={handleChange}
              className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              placeholder="Nhập tên đăng nhập hoặc số điện thoại..."
              autoComplete="username"
            />
            {errors.account && (
              <p className="mt-2 text-sm text-rose-600">{errors.account}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Mật khẩu</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-rose-600">{errors.password}</p>
            )}
          </label>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <input
                name="remember"
                type="checkbox"
                checked={form.remember}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              Duy trì đăng nhập
            </label>
            <button
              type="button"
              className="text-sm font-bold text-cyan-700 hover:underline"
            >
              Quên mật khẩu
            </button>
          </div>

          {submitError && (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative h-14 w-full overflow-hidden rounded-2xl bg-slate-950 text-sm font-black text-white shadow-[0_18px_40px_rgba(8,47,73,0.22)] transition hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
            <span className="relative">
              {loading ? "Đang xác thực..." : "Vào hệ thống"}
            </span>
          </button>
        </form>
      </div>
    </section>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(ROLE_PATHS[getUserRole()] || "/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="home-motion-root min-h-screen overflow-hidden bg-[#eafaff] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <img
          src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-36"
        />
        <div className="absolute inset-0 bg-[linear-gradient(102deg,rgba(2,20,38,0.88),rgba(6,73,108,0.62)_40%,rgba(235,252,255,0.92)_82%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(125,226,255,0.54),transparent_30%),radial-gradient(circle_at_22%_78%,rgba(255,255,255,0.32),transparent_28%)]" />
        <div className="absolute left-0 top-0 h-[520px] w-[520px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-[460px] w-[460px] rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="home-waterline absolute left-[-20%] top-[18%] h-40 w-[140%] rotate-[-8deg] bg-gradient-to-r from-transparent via-white/18 to-transparent blur-xl" />
        <div className="wash-foam-drift absolute bottom-[-90px] left-[-120px] h-64 w-[70vw] rounded-[50%] bg-white/35 blur-3xl" />
      </div>

      <header className="fixed left-1/2 top-5 z-50 w-[calc(100%-24px)] max-w-[1520px] -translate-x-1/2 md:w-[82vw]">
        <nav className="home-reveal mx-auto flex min-h-16 w-full items-center justify-between overflow-hidden rounded-[24px] border border-white/75 bg-white/76 px-4 py-3 shadow-[0_22px_70px_rgba(2,40,70,0.18)] backdrop-blur-2xl sm:px-6 lg:h-[76px]">
          <div className="home-shimmer pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200 shadow-lg shadow-cyan-900/10">
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

          <div className="hidden items-center gap-7 text-sm font-black text-slate-600 md:flex">
            <a href="#home-login" className="transition hover:text-cyan-700">
              Home
            </a>
            <a href="#experience" className="transition hover:text-cyan-700">
              Trải nghiệm
            </a>
            <a href="#process" className="transition hover:text-cyan-700">
              Quy trình
            </a>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="rounded-full bg-white px-5 py-2.5 text-cyan-800 shadow-sm ring-1 ring-cyan-100 transition hover:-translate-y-0.5 hover:ring-cyan-300"
            >
              Tạo tài khoản
            </button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section
          id="home-login"
          className="mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-10 px-4 pb-10 pt-32 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_440px] lg:px-10"
        >
          <div className="home-reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/16 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
              Bọt tuyết • áp lực nước • sấy khô
            </div>

            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.93] tracking-normal text-white drop-shadow-[0_18px_40px_rgba(2,20,38,0.28)] sm:text-6xl lg:text-7xl">
              AutoWash biến lịch rửa xe thành một trải nghiệm sạch, nhanh và rõ
              ràng.
            </h1>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.34)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Bắt đầu với autoWash
              </button>
              <a
                href="#experience"
                className="rounded-2xl border border-white/35 bg-white/14 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22"
              >
                Xem trải nghiệm
              </a>
            </div>
          </div>

          <LoginPanel />
        </section>

        <section
          id="experience"
          className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-10"
        >
          <div className="home-reveal relative overflow-hidden rounded-[34px] border border-white/45 bg-white/18 p-5 shadow-[0_34px_100px_rgba(2,20,38,0.18)] backdrop-blur-xl md:p-7">
            <img
              src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=1800&auto=format&fit=crop"
              alt="Xe đang được rửa bằng nước áp lực cao"
              className="h-[420px] w-full rounded-[28px] object-cover"
            />
            <div className="absolute inset-5 rounded-[28px] bg-gradient-to-r from-slate-950/76 via-slate-950/20 to-white/5 md:inset-7" />
            <div className="wash-scan pointer-events-none absolute left-10 right-10 top-12 h-16 rounded-full bg-gradient-to-b from-white/60 via-cyan-200/55 to-transparent blur-xl" />
            <div className="absolute bottom-10 left-10 max-w-xl text-white">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
                Clean mobility interface
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight">
                Niềm tin được giữ trọn từ lúc đặt lịch đến khi bàn giao xe.
              </h2>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-12 sm:px-6 md:grid-cols-3 lg:px-10">
          {VALUE_PILLARS.map((item, index) => (
            <article
              key={item.title}
              className="home-reveal group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(2,74,138,0.12)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white"
              style={{ animationDelay: `${120 + index * 90}ms` }}
            >
              <div className="home-shimmer pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <h3 className="mt-6 text-xl font-black text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                {item.copy}
              </p>
            </article>
          ))}
        </section>

        <section
          id="process"
          className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-10"
        >
          <div className="home-reveal relative overflow-hidden rounded-[34px] border border-cyan-100 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(8,47,73,0.22)] sm:p-8">
            <div className="home-shimmer pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-transparent via-cyan-300/12 to-transparent" />
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Flow rõ vai trò
              </p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight">
                Từ lúc khách đặt lịch đến khi xe rời khoang, mọi bước đều có chỗ
                đứng rõ ràng.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {FLOW_STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="relative rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-cyan-300">
                      0{index + 1}
                    </p>
                    <span className="material-symbols-outlined text-cyan-200">
                      {step.icon}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-black">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {step.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
