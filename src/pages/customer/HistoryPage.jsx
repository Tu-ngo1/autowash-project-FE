import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookings } from "../../services/bookingApi";
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
export default function HistoryPage() {
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
        const response = await getMyBookings();
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
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      <UserNavbar active="History" />

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-12 xl:px-14">
        <section className="mb-8 space-y-4">
          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/40 border border-slate-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Lịch sử dịch vụ
                </p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">
                  Tất cả lịch sử đặt lịch của bạn
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Xem lại những lần chăm sóc xe, trạng thái đơn hàng và tổng chi
                  phí đã sử dụng.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <p className="text-slate-500">Tổng đơn</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {summary.total}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <p className="text-slate-500">Hoàn thành</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-700">
                    {summary.completed}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <p className="text-slate-500">Đang chờ</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-700">
                    {summary.pending}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <p className="text-slate-500">Tổng chi</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatCurrency(summary.spent)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/40 border border-slate-200">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Biển số, dịch vụ hoặc phương thức thanh toán"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Tất cả</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="PENDING">Chờ phục vụ</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">
                  Dịch vụ
                </label>
                <select
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Tất cả</option>
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">
                  Ngày
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/40 border border-slate-200">
              <p className="text-slate-500">Đang tải lịch sử dịch vụ...</p>
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-rose-50 p-8 text-rose-700 shadow-lg shadow-rose-100 border border-rose-100">
              <p className="font-semibold">{error}</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-lg shadow-slate-200/40 border border-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                Chưa có lịch sử
              </p>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">
                Bạn chưa có lịch sử dịch vụ nào
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Tất cả lịch sử đặt lịch sẽ hiển thị ở đây sau khi bạn hoàn thành
                hoặc lưu đơn dịch vụ.
              </p>
              <button
                type="button"
                onClick={() => navigate("/booking")}
                className="mt-8 inline-flex items-center rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                Đặt lịch ngay
                <span className="material-symbols-outlined ml-2">east</span>
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/40 border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ngày
                      </th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Biển số
                      </th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Dịch vụ
                      </th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Giờ
                      </th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em] text-slate-500 text-right">
                        Tổng
                      </th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredHistory.map((item) => {
                      const statusKey = String(item.status || "").toUpperCase();
                      const statusInfo = STATUS_LABELS[statusKey] || {
                        label: item.status || "Không xác định",
                        classes: "bg-slate-100 text-slate-700",
                      };

                      return (
                        <tr
                          key={
                            item.id || `${item.plate}-${item.date}-${item.time}`
                          }
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-5 align-top">
                            <div className="text-slate-900 font-semibold">
                              {formatBookingDate(item.date)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.date}
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top">
                            <p className="font-semibold text-slate-900">
                              {item.plate || "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.paymentMethod || "-"}
                            </p>
                          </td>
                          <td className="px-6 py-5 align-top">
                            <p className="font-semibold text-slate-900">
                              {item.service || "-"}
                            </p>
                            {item.voucherCode && (
                              <span className="mt-1 inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                {item.voucherCode}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 align-top text-slate-900">
                            {item.time || "-"}
                          </td>
                          <td className="px-6 py-5 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.classes}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-5 align-top text-right font-semibold text-slate-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-6 py-5 align-top">
                            <div className="flex flex-wrap gap-2 justify-start">
                              {statusKey === "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() => navigate("/booking")}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                >
                                  Đặt lại
                                </button>
                              )}
                              {statusKey === "PENDING" && (
                                <button
                                  type="button"
                                  onClick={() => navigate("/booking")}
                                  className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                                >
                                  Sửa lịch
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => navigate("/profile")}
                                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                              >
                                Chi tiết
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
