import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerBookingHistory } from "../../services/customerHistoryApi";
import UserNavbar from "../../components/UserNavbar";
const STATUS_LABELS = {
  COMPLETED: {
    label: "Hoàn thành",
    classes: "bg-emerald-100 text-emerald-700",
  },
  PENDING: { label: "Chờ phục vụ", classes: "bg-amber-100 text-amber-700" },
  RECEIVED: { label: "Đã tiếp nhận", classes: "bg-sky-100 text-sky-700" },
  WASHING: { label: "Đang rửa xe", classes: "bg-cyan-100 text-cyan-700" },
  DRYING: {
    label: "Sấy & hoàn thiện",
    classes: "bg-indigo-100 text-indigo-700",
  },
  CANCELLED: { label: "Đã hủy", classes: "bg-rose-100 text-rose-700" },
};

const formatCurrency = (value) => {
  if (value == null || value === "") return "-";
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(number)) return value;
  return number.toLocaleString("vi-VN") + "đ";
};

const formatBookingDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// removed getLocalHistory
export default function CustomerHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
      const response = await getCustomerBookingHistory();
        const bookings = Array.isArray(response.data)
          ? response.data
          : response.data?.bookings || [];

        if (bookings.length) {
          setHistory(bookings);
        } else {
          setHistory([]);
        }
      } catch {
        setHistory([]);
        setError("Không thể tải lịch sử dịch vụ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const serviceOptions = useMemo(() => {
    return [...new Set(history.map((item) => item.service).filter(Boolean))];
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const normalizedStatus = String(item.status || "").toUpperCase();
      const normalizedService = String(item.service || "").toLowerCase();
      const normalizedSearch = search.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        String(item.plate || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        normalizedService.includes(normalizedSearch) ||
        String(item.paymentMethod || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus = !statusFilter || normalizedStatus === statusFilter;
      const matchesService =
        !serviceFilter ||
        normalizedService.includes(serviceFilter.toLowerCase());

      // CHỈNH SỬA: Chuẩn hóa so sánh ngày để khớp với input type="date" (YYYY-MM-DD)
      let matchesDate = true;
      if (dateFilter && item.date) {
        const bookingDate = new Date(item.date);
        if (!isNaN(bookingDate.getTime())) {
          // Chuyển đổi bookingDate về định dạng YYYY-MM-DD tương thích với dateFilter
          const yyyy = bookingDate.getFullYear();
          const mm = String(bookingDate.getMonth() + 1).padStart(2, "0");
          const dd = String(bookingDate.getDate()).padStart(2, "0");
          const formattedItemDate = `${yyyy}-${mm}-${dd}`;

          matchesDate = formattedItemDate === dateFilter;
        } else {
          // Fallback nếu item.date là chuỗi thông thường không parse được bằng v8 engine
          matchesDate = String(item.date).startsWith(dateFilter);
        }
      }

      return matchesSearch && matchesStatus && matchesService && matchesDate;
    });
  }, [history, search, statusFilter, serviceFilter, dateFilter]);

  const summary = useMemo(() => {
    const completed = history.filter(
      (item) => String(item.status || "").toUpperCase() === "COMPLETED",
    ).length;
    const pending = history.filter(
      (item) => String(item.status || "").toUpperCase() === "PENDING",
    ).length;
    const cancelled = history.filter(
      (item) => String(item.status || "").toUpperCase() === "CANCELLED",
    ).length;
    const total = history.length;
    const spent = history.reduce(
      (sum, item) => sum + (Number(item.price) || 0),
      0,
    );
    return { completed, pending, cancelled, total, spent };
  }, [history]);

  return (
    <div className="customer-motion-root min-h-screen overflow-hidden bg-[#eefbff] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <img
          src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-16"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.98),rgba(235,252,255,0.9)_46%,rgba(178,232,255,0.66))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.07)_1px,transparent_1px)] bg-[size:74px_74px]" />
        <div className="absolute left-[-140px] top-[-120px] h-[520px] w-[520px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="wash-foam-drift absolute bottom-[-120px] right-[-120px] h-72 w-[66vw] rounded-full bg-white/55 blur-3xl" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="History" />

        <main className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-32 sm:px-6 lg:px-10">
          <section className="relative mb-8 overflow-hidden rounded-[34px] border border-white/75 bg-white/58 p-7 shadow-[0_32px_90px_rgba(2,74,138,0.12)] backdrop-blur-2xl sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.18),transparent_28%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_560px] lg:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                  Lịch sử rửa xe
                </p>
                <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-normal sm:text-6xl">
                  Nhật ký chăm sóc xe của bạn.
                </h1>
                <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                  Xem lại từng lượt phủ bọt, xịt áp lực, sấy khô và chi phí đã
                  sử dụng. Mọi lịch sử được gom lại để bạn theo dõi dễ hơn.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Tổng đơn", summary.total, "receipt_long"],
                  ["Hoàn thành", summary.completed, "verified"],
                  ["Đang chờ", summary.pending, "schedule"],
                  ["Tổng chi", formatCurrency(summary.spent), "payments"],
                ].map(([label, value, icon]) => (
                  <div
                    key={label}
                    className="rounded-[24px] border border-white/75 bg-white/62 p-4 shadow-sm backdrop-blur-xl"
                  >
                    <span className="material-symbols-outlined text-[22px] text-cyan-700">
                      {icon}
                    </span>
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-[30px] border border-white/75 bg-white/70 p-5 shadow-sm backdrop-blur-2xl sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
              {[
                ["Tìm kiếm", "input"],
                ["Trạng thái", "status"],
                ["Dịch vụ", "service"],
                ["Ngày", "date"],
              ].map(([label, type]) => (
                <div key={type} className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    {label}
                  </label>
                  {type === "input" && (
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Biển số, dịch vụ hoặc thanh toán"
                      className="w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    />
                  )}
                  {type === "status" && (
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                      <option value="">Tất cả</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="PENDING">Chờ phục vụ</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  )}
                  {type === "service" && (
                    <select
                      value={serviceFilter}
                      onChange={(event) => setServiceFilter(event.target.value)}
                      className="w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                      <option value="">Tất cả</option>
                      {serviceOptions.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  )}
                  {type === "date" && (
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(event) => setDateFilter(event.target.value)}
                      className="w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            {loading ? (
              <div className="rounded-[30px] border border-white/75 bg-white/70 p-8 font-black text-slate-500 shadow-sm backdrop-blur-2xl">
                Đang tải lịch sử dịch vụ...
              </div>
            ) : error ? (
              <div className="rounded-[30px] border border-rose-100 bg-rose-50 p-8 font-semibold text-rose-700 shadow-sm">
                {error}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="rounded-[34px] border border-white/75 bg-white/70 p-10 text-center shadow-sm backdrop-blur-2xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">
                  Chưa có lịch sử
                </p>
                <h2 className="mt-4 text-4xl font-black text-slate-950">
                  Bạn chưa có lượt rửa xe nào.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                  Tất cả lịch sử đặt lịch sẽ hiển thị ở đây sau khi bạn hoàn thành
                  hoặc lưu đơn dịch vụ.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/booking")}
                  className="mt-8 inline-flex items-center rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  Đặt lịch ngay
                  <span className="material-symbols-outlined ml-2">east</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredHistory.map((item, index) => {
                  const statusKey = String(item.status || "").toUpperCase();
                  const statusInfo = STATUS_LABELS[statusKey] || {
                    label: item.status || "Không xác định",
                    classes: "bg-slate-100 text-slate-700",
                  };

                  return (
                    <article
                      key={item.id || `${item.plate}-${item.date}-${item.time}`}
                      className="group grid gap-5 rounded-[30px] border border-white/75 bg-white/72 p-5 shadow-sm backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(2,74,138,0.14)] lg:grid-cols-[110px_minmax(0,1fr)_220px]"
                    >
                      <div className="flex items-center gap-4 lg:block">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-xl font-black text-cyan-200">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="lg:mt-4">
                          <p className="text-sm font-black text-slate-950">
                            {formatBookingDate(item.date)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {item.time || "Chưa có giờ"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-2xl font-black text-slate-950">
                              {item.plate || "Xe của bạn"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              {item.service || "Dịch vụ chăm sóc xe"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${statusInfo.classes}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-cyan-50/70 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                              Thanh toán
                            </p>
                            <p className="mt-2 font-black text-slate-950">
                              {item.paymentMethod || "-"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-cyan-50/70 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                              Voucher
                            </p>
                            <p className="mt-2 font-black text-slate-950">
                              {item.voucherCode || "-"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-cyan-50/70 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                              Tổng
                            </p>
                            <p className="mt-2 font-black text-slate-950">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-3 rounded-[24px] bg-slate-950 p-4 text-white">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                            Wash record
                          </p>
                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                            Hồ sơ lượt rửa được lưu lại để bạn đặt lại hoặc kiểm tra
                            thông tin nhanh.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(statusKey === "COMPLETED" || statusKey === "PENDING") && (
                            <button
                              type="button"
                              onClick={() => navigate("/booking")}
                              className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-white"
                            >
                              {statusKey === "COMPLETED" ? "Đặt lại" : "Sửa lịch"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate("/profile")}
                            className="rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-black text-white transition hover:bg-white/14"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
