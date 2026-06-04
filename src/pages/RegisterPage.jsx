import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();

  // Gom nhóm state thành một object form để đồng bộ cách xử lý với LoginPage
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Tên không được để trống.";

    if (!form.email.trim()) {
      next.email = "Email không được để trống.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      next.email = "Email không đúng định dạng.";
    }

    if (!form.phone.trim()) {
      next.phone = "SĐT không được để trống.";
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

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setSubmitError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      // Trường hợp backend trả lỗi theo format field-level (không chắc DB đã lên luôn)
      const payload = err?.response?.data;
      const fieldErrors = payload?.errors || payload?.fieldErrors;
      if (fieldErrors && typeof fieldErrors === "object") {
        const next = {};
        for (const key of Object.keys(fieldErrors)) {
          const v = fieldErrors[key];
          next[key] = Array.isArray(v) ? v[0] : v;
        }
        setErrors(next);
      }

      setSubmitError(
        payload?.message ||
          payload?.error ||
          (typeof payload === "string" ? payload : "") ||
          err?.message ||
          "Đăng ký thất bại, vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-white p-10 shadow-xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-500">
              Đăng ký tài khoản
            </p>
            <h1 className="mt-4 text-4xl font-bold text-slate-900">
              Tạo tài khoản khách hàng
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Đăng ký ngay để đặt lịch rửa xe, tích điểm loyalty và nhận ưu đãi
              thành viên.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Họ và tên
                </span>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-rose-600">{errors.name}</p>
                )}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-rose-600">{errors.email}</p>
                )}
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Số điện thoại
                </span>
                <input
                  name="phone"
                  type="text"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-rose-600">{errors.phone}</p>
                )}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Mật khẩu
                </span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.password}
                  </p>
                )}
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Xác nhận mật khẩu
              </span>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-rose-600">
                  {errors.confirmPassword}
                </p>
              )}
            </label>

            {submitError && (
              <div className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
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
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Ưu điểm khi đăng ký
            </p>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Bắt đầu đặt lịch nhanh chóng
            </h2>
            <ul className="mt-6 space-y-4 text-sm text-slate-600">
              <li className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <span className="font-semibold text-slate-900">•</span> Lưu
                thông tin cá nhân và lịch sử xe.
              </li>
              <li className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <span className="font-semibold text-slate-900">•</span> Tích
                điểm loyalty ngay sau lần đầu đặt dịch vụ.
              </li>
              <li className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <span className="font-semibold text-slate-900">•</span> Nhận ưu
                đãi theo hạng thẻ và voucher đặc biệt.
              </li>
            </ul>
          </div>

          <div className="rounded-[2rem] bg-sky-600 p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em]">
              Thông tin
            </p>
            <h2 className="mt-4 text-2xl font-bold">Quyền lợi thành viên</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm font-semibold">Member</p>
                <p className="mt-2 text-sm text-sky-100">
                  Đặt lịch trước 7 ngày, tích lũy điểm.
                </p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm font-semibold">Silver</p>
                <p className="mt-2 text-sm text-sky-100">
                  Nhận voucher giảm giá và ưu tiên booking.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
