import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authApi";
import { getUserRole, isAuthenticated, setAuth } from "../utils/auth";

const ROLE_PATHS = {
  CUSTOMER: "/booking",
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    account: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(ROLE_PATHS[getUserRole()] || "/dashboard");
    }
  }, [navigate]);

  const validate = () => {
    const next = {};
    if (!form.account.trim()) {
      next.account = "Email hoặc SĐT không được để trống.";
    }
    if (!form.password) {
      next.password = "Mật khẩu không được để trống.";
    } else if (form.password.length < 6) {
      next.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const authResponse = await login({
        account: form.account,
        password: form.password,
      });

      setAuth(authResponse);
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
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-[#191c1e] selection:bg-[#0d99ff] selection:text-white">
      <nav className="sticky top-0 z-50 border-b border-[#bfc7d5]/30 bg-white/80 shadow-[0_4px_20px_rgba(13,153,255,0.05)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 md:px-12">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-2xl font-bold text-[#0061a5]"
          >
            autoWash
          </button>
        </div>
      </nav>

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[2rem] border border-[#bfc7d5]/30 bg-white p-8 shadow-xl shadow-[#0061a5]/5">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#191c1e]">Đăng nhập</h1>
            <p className="mt-2 text-sm text-[#3f4753]">
              Chào mừng bạn quay lại với autoWash
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="px-1 text-xs font-semibold text-[#3f4753]">
                Số điện thoại hoặc Email
              </label>
              <input
                name="account"
                value={form.account}
                onChange={handleChange}
                placeholder="Nhập SĐT hoặc email"
                className="h-12 w-full rounded-xl border border-[#bfc7d5] bg-[#f7f9fb] px-4 text-sm text-[#191c1e] outline-none transition-all focus:border-[#0061a5] focus:ring-2 focus:ring-[#0061a5]/20"
              />
              {errors.account && (
                <p className="px-1 text-sm text-[#ba1a1a]">{errors.account}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="px-1 text-xs font-semibold text-[#3f4753]">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#0061a5] hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-[#bfc7d5] bg-[#f7f9fb] px-4 text-sm text-[#191c1e] outline-none transition-all focus:border-[#0061a5] focus:ring-2 focus:ring-[#0061a5]/20"
              />
              {errors.password && (
                <p className="px-1 text-sm text-[#ba1a1a]">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={form.remember}
                onChange={handleChange}
                className="rounded border-[#bfc7d5] text-[#0061a5] focus:ring-[#0061a5]"
              />
              <label
                htmlFor="remember"
                className="text-xs font-semibold text-[#3f4753]"
              >
                Duy trì đăng nhập
              </label>
            </div>

            {submitError && (
              <div className="rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-14 w-full rounded-xl bg-[#0061a5] text-lg font-bold text-white shadow-md shadow-[#0061a5]/10 transition-all hover:bg-[#005bbf] disabled:cursor-not-allowed disabled:bg-[#707884]"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#3f4753]">
            Chưa có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-bold text-[#0061a5] hover:underline"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
