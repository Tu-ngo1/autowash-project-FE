import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authApi";
import { isAuthenticated, setAuth } from "../utils/auth";
import { getMyBookings } from "../services/bookingApi";
import UserNavbar from "../components/UserNavbar";

const ROLE_PATHS = {
  CUSTOMER: "/booking",
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/queue",
};

const WASH_STEPS = [
  { key: "PENDING", label: "Chờ tiếp nhận", icon: "schedule" },
  { key: "RECEIVED", label: "Đã tiếp nhận", icon: "assignment_turned_in" },
  { key: "WASHING", label: "Đang rửa xe", icon: "water_drop" },
  { key: "DRYING", label: "Sấy & hoàn thiện", icon: "air" },
  { key: "COMPLETED", label: "Hoàn thành", icon: "check_circle" },
];
const STEP_KEYS = WASH_STEPS.map((s) => s.key);

function getStepState(stepKey, currentStatus) {
  const ci = STEP_KEYS.indexOf(String(currentStatus).toUpperCase());
  const si = STEP_KEYS.indexOf(stepKey);
  if (ci === -1) return "pending";
  if (si < ci) return "done";
  if (si === ci) return "active";
  return "pending";
}

function fmtPrice(p) {
  if (!p && p !== 0) return "";
  return Number(p).toLocaleString("vi-VN") + "đ";
}

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function StatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
        <span className="material-symbols-outlined text-[14px]">
          check_circle
        </span>
        Hoàn thành
      </span>
    );
  if (s === "CANCELLED")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
        <span className="material-symbols-outlined text-[14px]">cancel</span>
        Đã hủy
      </span>
    );
  if (s === "WASHING")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping inline-block"></span>
        Đang rửa xe
      </span>
    );
  if (s === "DRYING")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping inline-block"></span>
        Sấy & hoàn thiện
      </span>
    );
  if (s === "RECEIVED")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block"></span>
        Đã tiếp nhận
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
      <span className="material-symbols-outlined text-[14px]">schedule</span>
      Chờ tiếp nhận
    </span>
  );
}

function StepTimeline({ status }) {
  const current = String(status || "").toUpperCase();
  const ci = STEP_KEYS.indexOf(current);
  return (
    <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
      <div className="flex flex-col items-center pt-0.5">
        {WASH_STEPS.map((step, i) => {
          const state = getStepState(step.key, current);
          const isLast = i === WASH_STEPS.length - 1;
          return (
            <div key={step.key} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[15px] flex-shrink-0 transition-all
                  ${state === "done" ? "bg-emerald-500 text-white" : ""}
                  ${state === "active" ? "bg-sky-600 text-white ring-4 ring-sky-100" : ""}
                  ${state === "pending" ? "bg-slate-100 text-slate-400 border border-slate-200" : ""}
                `}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {step.icon}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-6 my-0.5 rounded-full transition-all
                    ${i < ci ? "bg-emerald-400" : "bg-slate-200"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col">
        {WASH_STEPS.map((step, i) => {
          const state = getStepState(step.key, current);
          const isLast = i === WASH_STEPS.length - 1;
          return (
            <div
              key={step.key}
              className={`flex flex-col justify-center ${!isLast ? "mb-[18px]" : ""}`}
              style={{ minHeight: 32 }}
            >
              <p
                className={`text-sm leading-tight transition-all
                  ${state === "active" ? "font-semibold text-slate-900" : ""}
                  ${state === "done" ? "text-slate-400 line-through" : ""}
                  ${state === "pending" ? "text-slate-400" : ""}
                `}
              >
                {step.label}
              </p>
              {state === "active" && (
                <p className="text-xs text-sky-600 mt-0.5">Đang xử lý...</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingCard({ booking }) {
  const isCancelled =
    String(booking.status || "").toUpperCase() === "CANCELLED";
  const isCompleted =
    String(booking.status || "").toUpperCase() === "COMPLETED";
  const showTimeline = !isCancelled && !isCompleted;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-slate-900 text-base">
            {booking.plate || "—"}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            {booking.service || booking.serviceName || ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={booking.status} />
          {booking.price ? (
            <p className="text-sm font-semibold text-slate-700">
              {fmtPrice(booking.price)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
        {booking.date && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              calendar_today
            </span>
            {fmtDate(booking.date)}
          </span>
        )}
        {booking.time && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              schedule
            </span>
            {booking.time}
          </span>
        )}
        {(booking.branch || booking.location) && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              location_on
            </span>
            {booking.branch || booking.location}
          </span>
        )}
      </div>

      {showTimeline && <StepTimeline status={booking.status} />}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    account: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [bookings, setBookings] = useState(null);
  const [trackerError, setTrackerError] = useState(false);
  const [trackerLoading, setTrackerLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      setBookings([]);
      return;
    }
    fetchBookings();
  }, [isLoggedIn]);

  const fetchBookings = async () => {
    setTrackerLoading(true);
    setTrackerError(false);
    setBookings(null);
    try {
      const res = await getMyBookings();
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data?.bookings ?? res.data?.data ?? []);
      const active = data.filter(
        (b) =>
          !["COMPLETED", "CANCELLED"].includes(String(b.status).toUpperCase()),
      );
      const done = data.filter((b) =>
        ["COMPLETED", "CANCELLED"].includes(String(b.status).toUpperCase()),
      );
      setBookings([...active, ...done].slice(0, 5));
    } catch {
      setTrackerError(true);
      setBookings([]);
    } finally {
      setTrackerLoading(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!form.account.trim())
      next.account = "Email hoặc SĐT không được để trống.";
    if (!form.password) next.password = "Mật khẩu không được để trống.";
    else if (form.password.length < 6)
      next.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const authResponse = await login({
        account: form.account,
        password: form.password,
      });
      setAuth(authResponse);
      setIsLoggedIn(true);
      navigate(ROLE_PATHS[authResponse.user.role] || "/dashboard");
    } catch (err) {
      const payload = err?.response?.data;
      setSubmitError(
        payload?.message ||
          payload?.error ||
          (typeof payload === "string" ? payload : "") ||
          err?.message ||
          "Thao tác thất bại, vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <UserNavbar active="Home" />

      <main>
        {/* HERO */}
        <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden py-16">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover opacity-15"
              src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=2070"
              alt="Premium car wash background"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-50/95 to-slate-100/80"></div>
          </div>
          <div className="relative z-10 grid w-full gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-10 xl:px-14">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-sm font-semibold text-sky-700">
                <span className="material-symbols-outlined text-base">
                  verified
                </span>
                Dịch vụ tiêu chuẩn quốc tế
              </div>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Chăm sóc xe chuyên nghiệp
                <br />
                <span className="text-sky-700">Sạch bóng từng chi tiết.</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Trải nghiệm công nghệ rửa xe thông minh vượt trội với hệ thống
                quản lý autoWash tự động, minh bạch và chu đáo tuyệt đối.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/booking")}
                  className="rounded-2xl bg-slate-900 px-8 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                >
                  Đặt lịch dịch vụ ngay
                </button>
              </div>
            </div>

            {/* Right — login form or logged-in card */}
            {!isLoggedIn ? (
              <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="mb-8 flex gap-4">
                  <button className="flex-1 rounded-2xl border-b-2 border-sky-700 py-3 text-sm font-bold text-slate-900">
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="flex-1 rounded-2xl py-3 text-sm font-bold text-slate-600 transition hover:text-slate-900"
                  >
                    Đăng ký
                  </button>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Số điện thoại hoặc Email
                    </label>
                    <input
                      name="account"
                      value={form.account}
                      onChange={handleChange}
                      placeholder="Nhập thông tin của bạn"
                      className="w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      type="text"
                    />
                    {errors.account && (
                      <p className="mt-2 text-sm text-rose-600">
                        {errors.account}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700">
                        Mật khẩu
                      </label>
                      <button
                        type="button"
                        className="text-sm font-semibold text-sky-700 hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-rose-600">
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="remember-home"
                      name="remember"
                      type="checkbox"
                      checked={form.remember}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                    />
                    <label
                      htmlFor="remember-home"
                      className="text-sm text-slate-600"
                    >
                      Duy trì đăng nhập
                    </label>
                  </div>
                  {submitError && (
                    <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {submitError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {loading ? "Đang đăng nhập..." : "Truy cập ngay"}
                  </button>
                </form>
              </div>
            ) : (
              /* ---- LOGGED-IN: Compact Status Tracker Card ---- */
              <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col gap-5" style={{ minHeight: 420 }}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Đang theo dõi</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Trạng thái xe của bạn</h3>
                    <p className="text-sm text-slate-400 mt-0.5">Cập nhật theo thời gian thực</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchBookings}
                      disabled={trackerLoading}
                      title="Làm mới"
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-700 transition-colors disabled:opacity-40"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${trackerLoading ? "animate-spin" : ""}`}>refresh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/history")}
                      className="text-xs font-semibold text-sky-700 hover:underline"
                    >
                      Xem tất cả →
                    </button>
                  </div>
                </div>

                {/* Skeleton */}
                {bookings === null && (
                  <div className="flex-1 flex flex-col gap-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 animate-pulse">
                        <div className="flex justify-between mb-2">
                          <div className="h-4 w-28 bg-slate-200 rounded-full" />
                          <div className="h-5 w-24 bg-slate-100 rounded-full" />
                        </div>
                        <div className="h-3 w-44 bg-slate-100 rounded-full mb-3" />
                        <div className="flex gap-2">
                          {[0,1,2,3,4].map((j) => <div key={j} className="h-7 w-7 rounded-full bg-slate-100" />)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error */}
                {trackerError && bookings !== null && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300">wifi_off</span>
                    <p className="text-sm text-slate-500">Không thể tải dữ liệu.</p>
                    <button onClick={fetchBookings} className="text-xs font-semibold text-sky-700 hover:underline">Thử lại</button>
                  </div>
                )}

                {/* Empty */}
                {!trackerError && bookings !== null && bookings.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-200">directions_car</span>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">Chưa có lịch dịch vụ nào</p>
                      <p className="text-xs text-slate-400 mt-1">Đặt lịch để theo dõi tiến trình rửa xe tại đây</p>
                    </div>
                    <button
                      onClick={() => navigate("/booking")}
                      className="rounded-full bg-sky-700 px-5 py-2 text-xs font-bold text-white hover:bg-sky-800 transition-all"
                    >
                      Đặt lịch ngay
                    </button>
                  </div>
                )}

                {/* Booking list */}
                {!trackerError && bookings !== null && bookings.length > 0 && (
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: 340 }}>
                    {bookings.map((b) => (
                      <BookingCard key={b.id} booking={b} />
                    ))}
                  </div>
                )}

                {/* Footer CTA */}
                <div className="pt-3 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => navigate("/booking")}
                    className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all"
                  >
                    + Đặt lịch mới
                  </button>
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Quản lý tài khoản
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* DỊCH VỤ */}
        <section className="py-24 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
            <div className="mb-16 space-y-4 text-center">
              <h2 className="text-4xl font-bold text-slate-900">
                Dịch vụ đẳng cấp
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Chúng tôi cung cấp các giải pháp chăm sóc xe toàn diện, từ rửa
                xe tiêu chuẩn đến hiệu chỉnh sơn cao cấp.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-8 group relative overflow-hidden rounded-[2.5rem] bg-slate-900 h-[400px]">
                <img
                  className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=1931"
                  alt="Rửa xe tự động"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-10 flex flex-col justify-end">
                  <span className="mb-2 text-xs font-bold uppercase tracking-widest text-sky-200">
                    Phổ biến nhất
                  </span>
                  <h3 className="mb-2 text-3xl font-bold text-white">
                    Rửa xe Tự động 360°
                  </h3>
                  <p className="mb-6 max-w-md text-sm text-white/80">
                    Làm sạch toàn diện trong vòng 15 phút với công nghệ vòi xịt
                    áp lực cao không chạm.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-white">
                      150.000đ
                    </span>
                    <button
                      className="rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-900"
                      onClick={() => navigate("/booking")}
                    >
                      Đăng ký ngay
                    </button>
                  </div>
                </div>
              </div>
              <div className="md:col-span-4 group relative overflow-hidden rounded-[2.5rem] bg-slate-100 h-[400px]">
                <img
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="https://images.unsplash.com/photo-1552930294-6b595f4c2974?q=80&w=2070"
                  alt="Vệ sinh nội thất"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sky-900/95 via-sky-900/30 to-transparent p-8 flex flex-col justify-end">
                  <h3 className="mb-2 text-3xl font-bold text-white">
                    Vệ sinh nội thất
                  </h3>
                  <p className="mb-4 text-sm text-white/80">
                    Khử mùi, hút bụi và dưỡng da ghế cao cấp.
                  </p>
                  <span className="text-sm font-bold text-white underline cursor-pointer">
                    Xem chi tiết
                  </span>
                </div>
              </div>
              <div className="md:col-span-4 rounded-[2.5rem] bg-slate-100 border border-slate-200 h-[300px]">
                <div className="flex h-full flex-col justify-between p-8">
                  <span className="material-symbols-outlined text-[48px] text-sky-700">
                    shield
                  </span>
                  <div>
                    <h3 className="mb-2 text-2xl font-bold text-slate-900">
                      Phủ Ceramic
                    </h3>
                    <p className="text-sm text-slate-600">
                      Bảo vệ bề mặt sơn vĩnh viễn khỏi tác động môi trường.
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-4 rounded-[2.5rem] bg-sky-200 h-[300px]">
                <div className="flex h-full flex-col justify-between p-8">
                  <span className="material-symbols-outlined text-[48px] text-slate-900">
                    speed
                  </span>
                  <div>
                    <h3 className="mb-2 text-2xl font-bold text-slate-900">
                      Đánh bóng nhanh
                    </h3>
                    <p className="text-sm text-slate-800/80">
                      Phục hồi độ bóng sáng tức thì chỉ trong 45 phút.
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-4 rounded-[2.5rem] bg-white border border-slate-200 h-[300px]">
                <div className="flex h-full flex-col justify-between p-8">
                  <span className="material-symbols-outlined text-[48px] text-sky-700">
                    water_drop
                  </span>
                  <div>
                    <h3 className="mb-2 text-2xl font-bold text-slate-900">
                      Rửa khoang máy
                    </h3>
                    <p className="text-sm text-slate-600">
                      Dọn sạch bụi bẩn, bảo vệ linh kiện động cơ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THỐNG KÊ */}
        <section className="py-16 bg-slate-100">
          <div className="grid w-full grid-cols-1 gap-8 px-4 text-center sm:grid-cols-3 sm:px-6 lg:px-10 xl:px-14">
            {[
              { value: "50k+", label: "Khách hàng tin dùng" },
              { value: "15ph", label: "Thời gian trung bình" },
              { value: "4.9/5", label: "Đánh giá hài lòng" },
            ].map(({ value, label }) => (
              <div key={label} className="space-y-2">
                <p className="text-4xl font-bold text-sky-700">{value}</p>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden py-24 bg-sky-700">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[400px] -mr-32 -mt-16 text-white">
              water_drop
            </span>
          </div>
          <div className="relative z-10 w-full space-y-8 px-4 text-center sm:px-6 lg:px-10 xl:px-14">
            <h2 className="text-4xl font-bold text-white">
              Sẵn sàng để xế yêu tỏa sáng?
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-white/80">
              Đặt lịch ngay hôm nay để nhận ưu đãi 20% cho lần rửa đầu tiên và
              tích lũy điểm thưởng rewards.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate("/booking")}
                className="rounded-2xl bg-white px-10 py-5 text-sm font-bold text-sky-700 hover:bg-slate-100 transition-all shadow-xl shadow-black/10"
              >
                Đặt lịch online ngay
              </button>
              <button className="rounded-2xl border-2 border-white/30 bg-sky-700 px-10 py-5 text-sm font-bold text-white hover:bg-white/10 transition-all">
                Tư vấn qua Zalo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-100">
        <div className="flex w-full flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10 xl:px-14">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <div className="text-2xl font-bold text-slate-900">autoWash</div>
            <p className="max-w-xs text-center text-sm text-slate-500 md:text-left">
              © 2026 autoWash - Giải pháp chăm sóc xe chuyên nghiệp. Hệ thống
              rửa xe tự động hàng đầu Việt Nam.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
            {[
              "Về chúng tôi",
              "Điều khoản dịch vụ",
              "Chính sách bảo mật",
              "Liên hệ",
            ].map((t) => (
              <button
                key={t}
                type="button"
                className="hover:text-sky-700 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            {["public", "mail", "call"].map((icon) => (
              <button
                key={icon}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 hover:bg-sky-700 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {icon}
                </span>
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
