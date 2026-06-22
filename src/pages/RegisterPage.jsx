import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import {
  register,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from "../services/authApi";
import { getFriendlyErrorMessage } from "../utils/errorMessage";

const RESEND_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [registering, setRegistering] = useState(false);

  const normalizedEmail = useMemo(() => form.email.trim(), [form.email]);
  const emailChangedAfterVerify =
    otpVerified && verifiedEmail && verifiedEmail !== normalizedEmail;

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!emailChangedAfterVerify) return;
    setOtpVerified(false);
    setVerifiedEmail("");
  }, [emailChangedAfterVerify]);

  const validateEmail = () => {
    if (!normalizedEmail) return "Email không được để trống.";
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return "Email không đúng định dạng.";
    }
    return "";
  };

  const validateForm = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Họ và tên không được để trống.";
    if (!form.username.trim()) {
      next.username = "Tên đăng nhập không được để trống.";
    } else if (form.username.trim().length < 3) {
      next.username = "Tên đăng nhập phải từ 3 ký tự trở lên.";
    }
    if (!form.phone.trim()) {
      next.phone = "Số điện thoại không được để trống.";
    } else if (!/^[0-9]{10,11}$/.test(form.phone.trim())) {
      next.phone = "Số điện thoại phải gồm 10 đến 11 chữ số.";
    }
    const emailError = validateEmail();
    if (emailError) next.email = emailError;
    if (!form.password) {
      next.password = "Mật khẩu không được để trống.";
    } else if (form.password.length < 6) {
      next.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }
    if (!form.otp.trim()) {
      next.otp = "Vui lòng nhập mã OTP đã gửi qua email.";
    } else if (!/^[0-9]{6}$/.test(form.otp.trim())) {
      next.otp = "Mã OTP gồm 6 chữ số.";
    }
    if (!otpVerified) {
      next.otp = "Vui lòng xác thực OTP trước khi đăng ký.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyBackendErrors = (err) => {
    const payload = err?.response?.data;
    const fieldErrors = payload?.errors || payload?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const next = {};
      for (const key of Object.keys(fieldErrors)) {
        const value = fieldErrors[key];
        next[key] = Array.isArray(value) ? value[0] : value;
      }
      setErrors((current) => ({ ...current, ...next }));
    }
    return getFriendlyErrorMessage(
      err,
      "Thao tác chưa thực hiện được. Vui lòng thử lại sau.",
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "otp"
          ? value.replace(/\D/g, "").slice(0, 6)
          : name === "phone"
            ? value.replace(/\D/g, "").slice(0, 11)
            : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
    if (name === "email") {
      setOtpMessage("");
      setOtpSent(false);
      setOtpVerified(false);
      setVerifiedEmail("");
      setForm((prev) => ({ ...prev, otp: "" }));
    }
    if (name === "otp") setOtpVerified(false);
  };

  const handleSendOtp = async () => {
    if (sendingOtp || cooldown > 0) return;
    setSubmitError("");
    setOtpMessage("");
    const emailError = validateEmail();
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    setSendingOtp(true);
    try {
      const response = await sendRegistrationOtp(normalizedEmail);
      setOtpSent(true);
      setOtpVerified(false);
      setVerifiedEmail("");
      setCooldown(RESEND_SECONDS);
      setOtpMessage(
        response?.message ||
          `Mã OTP đã được gửi tới ${normalizedEmail}. Vui lòng kiểm tra hộp thư.`,
      );
    } catch (err) {
      setSubmitError(applyBackendErrors(err));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (verifyingOtp) return;
    setSubmitError("");
    setOtpMessage("");
    const emailError = validateEmail();
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }
    if (!/^[0-9]{6}$/.test(form.otp.trim())) {
      setErrors((prev) => ({ ...prev, otp: "Mã OTP gồm 6 chữ số." }));
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await verifyRegistrationOtp(normalizedEmail, form.otp);
      setOtpVerified(true);
      setVerifiedEmail(normalizedEmail);
      setOtpMessage(response?.message || "Email đã được xác thực.");
      setErrors((prev) => ({ ...prev, otp: "" }));
    } catch (err) {
      setOtpVerified(false);
      setSubmitError(applyBackendErrors(err));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (registering) return;
    setSubmitError("");
    if (!validateForm()) return;

    setRegistering(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        username: form.username,
        password: form.password,
        otp: form.otp,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setSubmitError(applyBackendErrors(err));
    } finally {
      setRegistering(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none shadow-inner shadow-cyan-950/[0.03] transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eefbff] px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="pointer-events-none fixed inset-0">
        <img
          src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-24"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(239,253,255,0.96),rgba(225,246,252,0.9)_48%,rgba(255,255,255,0.98)_86%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.06)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute right-[-120px] top-[-80px] h-[520px] w-[520px] rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="wash-foam-drift absolute bottom-[-110px] left-[-120px] h-72 w-[78vw] rounded-[50%] bg-white/40 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-[24px] border border-white/70 bg-white/72 px-4 py-3 shadow-[0_22px_70px_rgba(2,40,70,0.16)] backdrop-blur-2xl sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-left transition hover:-translate-y-0.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200 shadow-lg shadow-cyan-900/10">
            <span className="material-symbols-outlined text-[23px]">water_drop</span>
          </span>
          <span>
            <span className="block text-xl font-black leading-none">autoWash</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-700">
              clean mobility
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-cyan-800 shadow-sm ring-1 ring-cyan-100 transition hover:-translate-y-0.5 hover:ring-cyan-300"
        >
          Đăng nhập
        </button>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-7 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:py-10">
        <main className="relative overflow-hidden rounded-[30px] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/82 to-sky-100/72 p-5 shadow-[0_30px_90px_rgba(2,55,88,0.14)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-200/65 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-16 h-60 w-60 rounded-full bg-sky-100/80 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />

          <div className="relative mb-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.85)]" />
              Email OTP access
            </div>
            <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-normal text-slate-950 sm:text-5xl">
              Đăng ký tài khoản
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-slate-600">
              Xác thực email bằng OTP, sau đó dùng tài khoản này để đặt lịch,
              xem trạng thái rửa xe và lưu lịch sử chăm sóc.
            </p>
          </div>

          <form className="relative space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-[26px] border border-cyan-100 bg-cyan-100/62 p-4 shadow-inner shadow-white/70 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="mt-1 rounded-2xl bg-white p-2.5 text-cyan-700 ring-1 ring-cyan-100">
                  <Mail size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-black text-slate-950">
                    Xác thực email
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                    Nhập email rồi nhấn nhận mã OTP. Mã chỉ dùng một lần và sẽ
                    được gửi qua email từ hệ thống.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                <label className="block">
                  <span className="text-sm font-black text-slate-900">
                    Email
                  </span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    autoComplete="email"
                    disabled={otpVerified || sendingOtp || verifyingOtp || registering}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-rose-600">{errors.email}</p>
                  )}
                </label>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpVerified || sendingOtp || cooldown > 0 || registering}
                  className="mt-7 inline-flex h-[50px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(8,47,73,0.18)] transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {sendingOtp ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : cooldown > 0 ? (
                    <RefreshCw size={18} />
                  ) : (
                    <Mail size={18} />
                  )}
                  {cooldown > 0 ? `${cooldown}s` : "Nhận mã"}
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                <label className="block">
                  <span className="text-sm font-black text-slate-900">
                    Mã OTP
                  </span>
                  <input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    value={form.otp}
                    onChange={handleChange}
                    className={`${inputClass} text-center text-lg font-semibold tracking-[0.28em]`}
                    placeholder="------"
                    autoComplete="one-time-code"
                    disabled={otpVerified || !otpSent || verifyingOtp || registering}
                  />
                  {errors.otp && (
                    <p className="mt-2 text-sm text-rose-600">{errors.otp}</p>
                  )}
                </label>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerified || !otpSent || verifyingOtp || registering}
                  className="mt-7 inline-flex h-[50px] items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-white px-4 text-sm font-black text-cyan-800 transition hover:-translate-y-0.5 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {verifyingOtp ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : otpVerified ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                  {otpVerified ? "Đã xác thực" : "Xác thực"}
                </button>
              </div>

              {otpMessage && (
              <div className="mt-4 rounded-2xl bg-white/88 px-4 py-3 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-100">
                  {otpMessage}
                </div>
              )}
            </section>

            {submitError && (
              <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-black text-rose-700 shadow-sm">
                {submitError}
              </div>
            )}

            {otpVerified && (
              <>
                <div className="grid gap-5">
                  <label className="block">
                    <span className="text-sm font-black text-slate-900">
                      Họ và tên
                    </span>
                    <input
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="name"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-rose-600">{errors.name}</p>
                    )}
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-slate-900">
                      Tên đăng nhập
                    </span>
                    <input
                      name="username"
                      type="text"
                      value={form.username}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="username"
                    />
                    {errors.username && (
                      <p className="mt-2 text-sm text-rose-600">{errors.username}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-slate-900">
                      Số điện thoại
                    </span>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="tel"
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm text-rose-600">{errors.phone}</p>
                    )}
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-slate-900">
                      Mật khẩu
                    </span>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="new-password"
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-rose-600">
                        {errors.password}
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-slate-900">
                      Xác nhận mật khẩu
                    </span>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-rose-600">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-cyan-300 px-4 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.28)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
                  {registering && <Loader2 size={18} className="animate-spin" />}
                  <span className="relative">
                    {registering ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
                  </span>
                </button>
              </>
            )}
          </form>

          <p className="relative mt-6 text-center text-sm font-bold text-slate-700">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-black text-cyan-800 hover:underline"
            >
              Đăng nhập
            </button>
          </p>
        </main>

        <aside className="space-y-4">
          <div className="relative overflow-hidden rounded-[30px] border border-white/60 bg-slate-950/88 p-6 text-white shadow-[0_30px_90px_rgba(2,20,38,0.22)] backdrop-blur-2xl">
            <img
              src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=1200&auto=format&fit=crop"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-24"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/68 to-slate-950/92" />
            <div className="wash-scan pointer-events-none absolute left-8 right-8 top-10 h-14 rounded-full bg-gradient-to-b from-white/55 via-cyan-200/45 to-transparent blur-xl" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
                Wash account
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight">
                Một email cho toàn bộ hành trình rửa xe.
              </h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-cyan-50/78">
                Sau khi xác thực, khách hàng có thể đặt lịch, xem lịch sử và nhận
                ưu đãi theo tài khoản.
              </p>
            </div>
          </div>

          {[
            ["1", "Nhập email", "Dùng đúng email bạn muốn nhận thông báo."],
            ["2", "Nhận OTP", "Kiểm tra hộp thư đến hoặc thư rác nếu chưa thấy mã."],
            ["3", "Xác thực", "Nhập mã 6 số rồi hoàn tất đăng ký."],
          ].map(([step, title, description]) => (
            <div
              key={step}
              className="rounded-[24px] border border-white/90 bg-white/92 p-5 shadow-sm backdrop-blur-xl ring-1 ring-cyan-100/60 transition hover:-translate-y-1 hover:bg-white"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-sm font-black text-cyan-800 ring-1 ring-cyan-200">
                  {step}
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-950">{title}</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-[24px] border border-cyan-200 bg-cyan-300 p-5 text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-800">
              Bảo mật
            </p>
            <h2 className="mt-3 text-xl font-black">OTP giúp chặn đăng ký giả</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-cyan-950/70">
              Mỗi email cần được xác nhận trước khi tạo tài khoản khách hàng.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
