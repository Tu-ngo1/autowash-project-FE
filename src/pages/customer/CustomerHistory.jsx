import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerBookingHistory } from "../../services/customerHistoryApi";
import { cancelBooking } from "../../services/customerBookingApi";
import ReviewModal from "../../components/customer/ReviewModal";
import UserNavbar from "../../components/UserNavbar";
import { createReview, getMyReviews } from "../../services/customerReviewApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";
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

const formatBookingTime = (item = {}) => {
  if (item.time) return item.time;
  const source = item.scheduledStartTime || item.dateTime || item.date;
  if (!source) return "-";
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getBookingServicesText = (item = {}) => {
  if (Array.isArray(item.services) && item.services.length > 0) {
    return item.services
      .map((service) =>
        typeof service === "string"
          ? service
          : service.serviceName || service.name || service.title,
      )
      .filter(Boolean)
      .join(", ");
  }
  return item.service || item.serviceName || "Dịch vụ chăm sóc xe";
};

const getBookingTotal = (item = {}) =>
  item.finalPrice ?? item.totalPrice ?? item.price ?? item.total ?? 0;

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
  const [reviews, setReviews] = useState([]);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [cancelBookingItem, setCancelBookingItem] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const [historyRes, reviewRes] = await Promise.all([
          getCustomerBookingHistory(),
          getMyReviews().catch(() => []),
        ]);
        const bookings = Array.isArray(historyRes.data)
          ? historyRes.data
          : historyRes.data?.bookings || [];
        const reviewList = Array.isArray(reviewRes)
          ? reviewRes
          : reviewRes?.reviews || [];

        setHistory(bookings);
        setReviews(reviewList);
      } catch {
        setHistory([]);
        setReviews([]);
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
      (sum, item) => sum + (Number(getBookingTotal(item)) || 0),
      0,
    );
    return { completed, pending, cancelled, total, spent };
  }, [history]);

  const getReviewByBookingId = (bookingId) =>
    reviews.find((review) => String(review.bookingId) === String(bookingId));

  const handleSubmitReview = async (payload) => {
    setReviewLoading(true);
    setReviewMessage("");

    try {
      const created = await createReview(payload);
      setReviews((prev) => [...prev, created]);
      setReviewBooking(null);
      setReviewMessage("Cảm ơn bạn đã đánh giá dịch vụ.");
    } catch (err) {
      setReviewMessage(
        getFriendlyErrorMessage(
          err,
          "Chưa gửi được đánh giá. Vui lòng thử lại sau.",
        ),
      );
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="customer-motion-root min-h-screen overflow-hidden bg-[#d9f7ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(244,253,255,0.96),rgba(204,243,255,0.84)_46%,rgba(70,190,230,0.48))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,116,158,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,116,158,0.1)_1px,transparent_1px)] bg-[size:74px_74px]" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="History" />

        <main className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-32 sm:px-6 lg:px-10">
          <section className="relative mb-8 overflow-hidden rounded-[34px] border border-white/75 bg-white/58 p-7 shadow-[0_32px_90px_rgba(2,74,138,0.12)] backdrop-blur-2xl sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.18),transparent_28%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_640px] lg:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                  Lịch sử
                </p>
                <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-normal text-slate-950 sm:text-6xl">
                  Lịch sử rửa xe
                </h1>
                <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                  Xem lại đơn, chi phí và đánh giá.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(190px,1.35fr)]">
                {[
                  ["Tổng đơn", summary.total, "receipt_long"],
                  ["Hoàn thành", summary.completed, "verified"],
                  ["Đang chờ", summary.pending, "schedule"],
                  ["Tổng chi", formatCurrency(summary.spent), "payments"],
                ].map(([label, value, icon]) => (
                  <div
                    key={label}
                    className="rounded-[24px] border border-white/75 bg-white/62 p-5 shadow-sm backdrop-blur-xl"
                  >
                    <span className="material-symbols-outlined text-[22px] text-cyan-700">
                      {icon}
                    </span>
                    <p className="mt-4 whitespace-nowrap text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                      {label}
                    </p>
                    <p
                      className={`mt-2 font-black leading-none text-slate-950 ${
                        label === "Tổng chi"
                          ? "whitespace-nowrap text-[clamp(1.25rem,1.55vw,1.6rem)] tracking-normal"
                          : "text-2xl"
                      }`}
                    >
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
            {reviewMessage && (
              <div className="mb-6 rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-800 ring-1 ring-cyan-100">
                {reviewMessage}
              </div>
            )}

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
                  Tất cả lịch sử đặt lịch sẽ hiển thị ở đây sau khi bạn hoàn
                  thành hoặc lưu đơn dịch vụ.
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
                              {formatCurrency(getBookingTotal(item))}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="self-center rounded-[24px] bg-slate-950 p-4 text-white">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                            Wash record
                          </p>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-2">
                          {statusKey === "COMPLETED" &&
                            (getReviewByBookingId(item.id) ? (
                              <button
                                type="button"
                                disabled
                                className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700"
                              >
                                Đã đánh giá
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setReviewBooking(item)}
                                className="rounded-xl bg-amber-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-200"
                              >
                                Đánh giá
                              </button>
                            ))}
                          {statusKey === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => setCancelBookingItem(item)}
                              className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-black text-white transition hover:bg-rose-600"
                            >
                              Hủy lịch
                            </button>
                          )}
                          {(statusKey === "COMPLETED" ||
                            statusKey === "PENDING") && (
                            <button
                              type="button"
                              onClick={() => navigate("/booking")}
                              className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-white"
                            >
                              {statusKey === "COMPLETED"
                                ? "Đặt lại"
                                : "Sửa lịch"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailBooking(item)}
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
      <ReviewModal
        booking={reviewBooking}
        loading={reviewLoading}
        onClose={() => setReviewBooking(null)}
        onSubmit={handleSubmitReview}
      />
      {detailBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={() => setDetailBooking(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/75 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-cyan-100 bg-cyan-50/80 p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                  Chi tiết booking
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {detailBooking.bookingCode ||
                    detailBooking.code ||
                    detailBooking.id ||
                    "Đơn rửa xe"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-950 hover:text-white"
                aria-label="Đóng chi tiết booking"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              {[
                ["Biển số", detailBooking.plate || detailBooking.vehicleLicensePlate || "-"],
                ["Dịch vụ", getBookingServicesText(detailBooking)],
                ["Ngày", formatBookingDate(detailBooking.date || detailBooking.scheduledStartTime)],
                ["Giờ", formatBookingTime(detailBooking)],
                [
                  "Trạng thái",
                  STATUS_LABELS[String(detailBooking.status || "").toUpperCase()]?.label ||
                    detailBooking.status ||
                    "-",
                ],
                [
                  "Thanh toán",
                  [
                    detailBooking.paymentMethod,
                    detailBooking.paymentStatus,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "-",
                ],
                ["Voucher", detailBooking.voucherCode || detailBooking.voucherName || "-"],
                ["Tổng tiền", formatCurrency(getBookingTotal(detailBooking))],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-base font-black text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
      {cancelBookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/75 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-4xl">warning</span>
              <h3 className="text-2xl font-black text-slate-950">Xác nhận hủy lịch</h3>
            </div>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-600">
              {(() => {
                const scheduledTime = new Date(cancelBookingItem.scheduledStartTime);
                const now = new Date();
                const diffInMs = scheduledTime.getTime() - now.getTime();
                const diffInMinutes = diffInMs / (1000 * 60);
                if (diffInMinutes < 60) {
                  return "Bạn đang hủy lịch sát giờ hẹn (dưới 60 phút). Bạn sẽ không được hoàn trả lại tiền cọc. Bạn có chắc chắn muốn hủy không?";
                }
                return "Bạn có chắc chắn muốn hủy lịch hẹn này không? Tiền đặt cọc (100%) sẽ được hoàn lại vào ví của bạn.";
              })()}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelBookingItem(null)}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={async () => {
                  setCancelLoading(true);
                  try {
                    const scheduledTime = new Date(cancelBookingItem.scheduledStartTime);
                    const now = new Date();
                    const diffInMs = scheduledTime.getTime() - now.getTime();
                    const diffInMinutes = diffInMs / (1000 * 60);
                    
                    await cancelBooking(cancelBookingItem.id);
                    
                    const historyRes = await getCustomerBookingHistory();
                    const bookings = Array.isArray(historyRes.data)
                      ? historyRes.data
                      : historyRes.data?.bookings || [];
                    setHistory(bookings);

                    if (diffInMinutes >= 60) {
                      setReviewMessage("Hủy lịch thành công. Tiền đặt cọc (100%) đã được hoàn lại vào ví của bạn.");
                    } else {
                      setReviewMessage("Hủy lịch thành công. Bạn không được hoàn lại tiền đặt cọc do hủy dưới 60 phút.");
                    }
                  } catch (err) {
                    setReviewMessage(getFriendlyErrorMessage(err, "Không thể hủy lịch. Vui lòng thử lại sau."));
                  } finally {
                    setCancelLoading(false);
                    setCancelBookingItem(null);
                  }
                }}
                className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {cancelLoading ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
