import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import {
  register,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from "../services/authApi";

const RESEND_SECONDS = 60;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return "Email không đúng định dạng.";
    }
    return "";
  };

  const validateForm = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Họ và tên không được để trống.";
    const emailError = validateEmail();
    if (emailError) next.email = emailError;
    if (!form.phone.trim()) {
      next.phone = "Số điện thoại không được để trống.";
    } else if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      next.phone = "Số điện thoại phải bao gồm 10 chữ số.";
    }
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
    return (
      payload?.message ||
      payload?.error ||
      (typeof payload === "string" ? payload : "") ||
      err?.message ||
      "Thao tác thất bại, vui lòng thử lại."
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "otp" ? value.replace(/\D/g, "").slice(0, 6) : value,
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
        password: form.password,
        otp: form.otp,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setSubmitError(applyBackendErrors(err));
    } finally {
      setRegistering(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">
              Đăng ký tài khoản
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
              Tạo tài khoản khách hàng
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Xác thực email bằng OTP trước khi hoàn tất đăng ký để bảo vệ tài
              khoản và nhận thông báo đặt lịch.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
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

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
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

            <section className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 rounded-xl bg-white p-2 text-sky-700 ring-1 ring-sky-100">
                  <Mail size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900">
                    Xác thực email
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Nhập email rồi nhấn nhận mã OTP. Mã chỉ dùng một lần và sẽ
                    được gửi qua email từ hệ thống.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Email
                  </span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    autoComplete="email"
                    disabled={sendingOtp || verifyingOtp || registering}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-rose-600">{errors.email}</p>
                  )}
                </label>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || cooldown > 0 || registering}
                  className="mt-7 inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                  <span className="text-sm font-semibold text-slate-700">
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
                    disabled={!otpSent || verifyingOtp || registering}
                  />
                  {errors.otp && (
                    <p className="mt-2 text-sm text-rose-600">{errors.otp}</p>
                  )}
                </label>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!otpSent || verifyingOtp || otpVerified || registering}
                  className="mt-7 inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
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
                <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-sky-800 ring-1 ring-sky-100">
                  {otpMessage}
                </div>
              )}
            </section>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
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
                <span className="text-sm font-semibold text-slate-700">
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

            {submitError && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={registering}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {registering && <Loader2 size={18} className="animate-spin" />}
              {registering ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-sky-700 hover:underline"
            >
              Đăng nhập
            </button>
          </p>
        </main>

        <aside className="space-y-4">
          {[
            ["1", "Nhập email", "Dùng đúng email bạn muốn nhận thông báo."],
            ["2", "Nhận OTP", "Kiểm tra hộp thư đến hoặc thư rác nếu chưa thấy mã."],
            ["3", "Xác thực", "Nhập mã 6 số rồi hoàn tất đăng ký."],
          ].map(([step, title, description]) => (
            <div
              key={step}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
                  {step}
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl bg-sky-600 p-5 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">
              Bảo mật
            </p>
            <h2 className="mt-3 text-xl font-bold">OTP giúp chặn đăng ký giả</h2>
            <p className="mt-2 text-sm leading-6 text-sky-50">
              Mỗi email cần được xác nhận trước khi tạo tài khoản khách hàng.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
