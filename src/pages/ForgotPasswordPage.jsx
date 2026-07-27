import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from "../services/authApi";
import { getFriendlyErrorMessage } from "../utils/errorMessage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Steps: 1 = Enter Email, 2 = Enter OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Định dạng email không hợp lệ.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await sendForgotPasswordOtp(cleanEmail);
      setMessage("Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          "Không thể gửi mã OTP. Vui lòng kiểm tra lại email hoặc thử lại sau."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await sendForgotPasswordOtp(email.trim());
      setMessage("Đã gửi lại mã OTP thành công. Vui lòng kiểm tra email.");
      setResendTimer(60);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(err, "Không thể gửi lại mã OTP. Vui lòng thử lại sau.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }
    if (cleanOtp.length < 4) {
      setError("Mã OTP không hợp lệ.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await verifyForgotPasswordOtp(email.trim(), cleanOtp);
      setMessage("Xác thực OTP thành công. Vui lòng nhập mật khẩu mới.");
      setStep(3);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải chứa ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setMessage("Đặt lại mật khẩu thành công!");
      setStep(4);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          "Không thể đặt lại mật khẩu. Vui lòng thử lại."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-motion-root min-h-screen overflow-hidden bg-[#f4fafc] text-slate-950">
      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0">
        <img
          src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-42"
        />
        <div className="absolute inset-0 bg-[linear-gradient(102deg,rgba(2,22,42,0.9),rgba(0,104,151,0.66)_42%,rgba(244,250,252,0.86)_84%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(0,210,255,0.48),transparent_30%),radial-gradient(circle_at_20%_76%,rgba(88,231,255,0.22),transparent_28%)]" />
        <div className="absolute left-0 top-0 h-[520px] w-[520px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-[460px] w-[460px] rounded-full bg-blue-300/30 blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed left-1/2 top-5 z-50 w-[calc(100%-24px)] max-w-[1520px] -translate-x-1/2 md:w-[82vw]">
        <nav className="home-reveal mx-auto flex min-h-16 w-full items-center justify-between overflow-hidden rounded-[24px] border border-white/75 bg-white/76 px-4 py-3 shadow-[0_22px_70px_rgba(2,40,70,0.18)] backdrop-blur-2xl sm:px-6 lg:h-[76px]">
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

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-800 transition hover:bg-white"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Đăng nhập
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 pb-12 pt-32 sm:px-6">
        <div className="home-reveal relative w-full max-w-lg overflow-hidden rounded-[34px] border border-white/75 bg-white/90 p-6 shadow-[0_34px_110px_rgba(2,74,138,0.2)] backdrop-blur-2xl sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-cyan-200/70 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />

          {/* Stepper Header */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600">
              Khôi phục mật khẩu
            </p>
            <span className="text-xs font-black text-slate-400">
              Bước {step > 3 ? 3 : step} / 3
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-500"
              style={{
                width: `${(Math.min(step, 3) / 3) * 100}%`,
              }}
            />
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
              <span className="material-symbols-outlined text-rose-500">error</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {message && step < 4 && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-cyan-50 p-4 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-100">
              <span className="material-symbols-outlined text-cyan-600">info</span>
              <span className="flex-1">{message}</span>
            </div>
          )}

          {/* Step 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Quên mật khẩu?
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Nhập email đăng ký của bạn. Chúng tôi sẽ gửi mã xác thực OTP để đặt lại mật khẩu.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email của bạn</span>
                <div className="relative mt-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="example@domain.com"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 pl-12 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-4 text-slate-400">
                    mail
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="group relative h-[56px] w-full overflow-hidden rounded-2xl bg-slate-950 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <span className="relative">
                  {loading ? "Đang gửi mã OTP..." : "Gửi mã xác thực (OTP)"}
                </span>
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Nhập mã OTP
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Mã OTP 6 chữ số đã được gửi đến email <strong className="text-slate-800">{email}</strong>.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Mã xác thực OTP</span>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError("");
                  }}
                  placeholder="123456"
                  className="mt-2 h-14 w-full tracking-[0.4em] text-center text-2xl font-black rounded-2xl border border-slate-200 bg-white px-5 text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold text-slate-500 hover:text-slate-800"
                >
                  Đổi email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="font-bold text-cyan-700 hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {resendTimer > 0
                    ? `Gửi lại mã sau ${resendTimer}s`
                    : "Gửi lại mã OTP"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative h-[56px] w-full overflow-hidden rounded-2xl bg-slate-950 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <span className="relative">
                  {loading ? "Đang xác thực..." : "Xác nhận OTP"}
                </span>
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Đặt lại mật khẩu
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Tạo mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Mật khẩu mới</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Ít nhất 6 ký tự..."
                  className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Xác nhận mật khẩu mới</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="group relative h-[56px] w-full overflow-hidden rounded-2xl bg-slate-950 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <span className="relative">
                  {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </span>
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h2 className="text-2xl font-black text-slate-950">
                Đổi mật khẩu thành công!
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập bằng mật khẩu mới.
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-6 h-14 w-full rounded-2xl bg-slate-950 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-900"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
