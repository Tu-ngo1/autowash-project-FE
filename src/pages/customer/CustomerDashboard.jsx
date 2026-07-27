import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import { getUser } from "../../utils/auth";
import {
  getCustomerDashboardBookings,
  getCustomerDashboardLoyalty,
} from "../../services/customerDashboardApi";
import ReviewModal from "../../components/customer/ReviewModal";
import { createReview, getMyReviews } from "../../services/customerReviewApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";
import {
  cancelBooking,
  confirmBookingReceived,
} from "../../services/customerBookingApi";
import { sortNewestFirst, unwrapPayload } from "../../utils/dataHelpers";
import { formatCurrency } from "../../utils/formatters";
const statusLabels = {
  PENDING: "Chờ tiếp nhận",
  RECEIVED: "Đã tiếp nhận",
  ARRIVED: "Đã check-in",
  WASHING: "Đang rửa xe",
  IN_PROGRESS: "Đang rửa xe",
  WASHED: "Đã rửa xong",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  CONFIRM: "Đã xác nhận",
};

const formatDate = (value) => {
  if (!value) return "Chưa có ngày";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = getUser() || {};
  const [bookings, setBookings] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [dismissedReviewIds, setDismissedReviewIds] = useState([]);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelBookingItem, setCancelBookingItem] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [receivedBooking, setReceivedBooking] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const [bookingRes, loyaltyRes, reviewRes] = await Promise.allSettled([
          getCustomerDashboardBookings(),
          getCustomerDashboardLoyalty(),
          getMyReviews(),
        ]);

        if (!alive) return;

        if (bookingRes.status === "fulfilled") {
          const data = unwrapPayload(bookingRes.value);
          const list = Array.isArray(data) ? data : data.bookings || [];
          setBookings(sortNewestFirst(list));
        } else {
          setBookings([]);
        }
        if (loyaltyRes.status === "fulfilled") {
          const data = unwrapPayload(loyaltyRes.value);
          setLoyalty(Object.keys(data || {}).length ? data : null);
        } else {
          setLoyalty(null);
        }
        if (reviewRes.status === "fulfilled") {
          const data = unwrapPayload(reviewRes.value);
          const list = Array.isArray(data) ? data : data.reviews || [];
          setReviews(list);
        } else {
          setReviews([]);
        }
        if (
          bookingRes.status === "rejected" &&
          loyaltyRes.status === "rejected"
        ) {
          setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      alive = false;
    };
  }, []);

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (item) =>
          !["COMPLETED", "CANCELLED"].includes(
            String(item.status || "").toUpperCase(),
          ),
      ),
    [bookings],
  );

  const latestBooking = activeBookings[0] || bookings[0];
  const completedCount = bookings.filter(
    (item) => String(item.status || "").toUpperCase() === "COMPLETED",
  ).length;
  const points =
    loyalty?.points ?? loyalty?.redeemablePoints ?? loyalty?.rewardPoints ?? 0;
  const tier =
    loyalty?.tier || loyalty?.tierLevel || loyalty?.membership || "Member";
  const currentStatus = String(
    latestBooking?.status || "PENDING",
  ).toUpperCase();

  const statLine = [
    ["Đang xử lý", activeBookings.length],
    ["Hoàn thành", completedCount],
    ["Điểm thưởng", points],
    ["Hạng", tier],
  ];

  const getReviewByBookingId = (bookingId) =>
    reviews.find((review) => String(review.bookingId) === String(bookingId));

  const pendingReviewBooking = bookings.find(
    (booking) =>
      String(booking.status || "").toUpperCase() === "COMPLETED" &&
      !getReviewByBookingId(booking.id) &&
      !dismissedReviewIds.includes(String(booking.id)),
  );

  const washedBooking = bookings.find(
    (booking) => String(booking.status || "").toUpperCase() === "WASHED",
  );

  useEffect(() => {
    if (washedBooking) {
      setReceivedBooking((current) =>
        current && String(current.id) === String(washedBooking.id)
          ? current
          : washedBooking,
      );
    }
  }, [washedBooking]);

  const handleSubmitReview = async (payload) => {
    if (!payload.bookingId) {
      setReviewMessage("Không tìm thấy mã đơn để gửi đánh giá.");
      return;
    }

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

  const handleConfirmReceived = async () => {
    const bookingId = receivedBooking?.id || receivedBooking?.bookingId;
    if (!bookingId) return;

    setConfirmLoading(true);
    setReviewMessage("");
    try {
      const response = await confirmBookingReceived(bookingId);
      const updatedBooking = response?.data?.data ?? response?.data ?? {
        ...receivedBooking,
        status: "COMPLETED",
      };
      setBookings((prev) =>
        prev.map((booking) =>
          String(booking.id || booking.bookingId) === String(bookingId)
            ? { ...booking, ...updatedBooking, status: "COMPLETED" }
            : booking,
        ),
      );
      setReceivedBooking(null);
      setReviewMessage("Đã xác nhận nhận xe. Cảm ơn bạn đã sử dụng dịch vụ.");
    } catch (err) {
      setReviewMessage(
        getFriendlyErrorMessage(
          err,
          "Chưa xác nhận được nhận xe. Vui lòng thử lại sau.",
        ),
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="customer-motion-root min-h-screen overflow-hidden bg-[#f4fafc] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(244,253,255,0.96),rgba(244,250,252,0.84)_46%,rgba(70,190,230,0.48))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,116,158,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,116,158,0.1)_1px,transparent_1px)] bg-[size:74px_74px]" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="Home" />

        {receivedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <section className="w-full max-w-2xl overflow-hidden rounded-[34px] border border-white/40 ring-1 ring-white/10 bg-white/95 shadow-[0_34px_100px_rgba(2,40,70,0.16)] backdrop-blur-2xl">
              <div className="relative bg-[linear-gradient(135deg,rgba(207,250,254,0.96),rgba(240,253,250,0.98))] p-8 sm:p-10">
                <div className="absolute right-8 top-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <span className="material-symbols-outlined text-[32px]">
                    verified
                  </span>
                </div>
                <p className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-800">
                  Xe đã sẵn sàng
                </p>
                <h2 className="mt-7 max-w-xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                  Xe của bạn đã rửa xong
                </h2>
                <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">
                  Vui lòng kiểm tra xe tại khoang. Nếu mọi thứ ổn, hãy xác nhận
                  nhận xe để hoàn tất lượt rửa.
                </p>

                <div className="mt-7 grid gap-3 rounded-[24px] border border-white/80 bg-white/72 p-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                      Biển số
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {receivedBooking.plate ||
                        receivedBooking.vehicleLicensePlate ||
                        "Xe của bạn"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                      Dịch vụ
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-black text-slate-950">
                      {receivedBooking.service ||
                        receivedBooking.serviceName ||
                        "Dịch vụ rửa xe"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                      Tổng tiền
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {formatCurrency(
                        receivedBooking.finalPrice ??
                          receivedBooking.totalPrice ??
                          receivedBooking.price,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={confirmLoading}
                    onClick={handleConfirmReceived}
                    className="flex-1 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-cyan-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {confirmLoading ? "Đang xác nhận..." : "Xác nhận đã nhận xe"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/history")}
                    className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-700 ring-1 ring-cyan-100 transition hover:bg-cyan-50"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-32 sm:px-6 lg:px-10">
          <section className="grid min-h-[560px] gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
            <div className="relative overflow-hidden rounded-[34px] border border-white/75 bg-white/62 shadow-[0_32px_90px_rgba(2,74,138,0.14)] backdrop-blur-2xl">
              <img
                src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=1800&auto=format&fit=crop"
                alt="Xe đang được rửa bằng bọt tuyết và nước áp lực"
                className="absolute inset-0 h-full w-full object-cover opacity-72"
              />
              <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.92),rgba(15,23,42,0.72)_44%,rgba(15,23,42,0.28)_76%,rgba(255,255,255,0.06))]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,23,0.76),transparent_48%)]" />
              <div className="wash-scan absolute left-10 right-10 top-10 h-20 rounded-full bg-gradient-to-b from-white/70 via-cyan-200/62 to-transparent blur-xl" />

              <div className="relative flex min-h-[560px] flex-col justify-between p-7 text-white sm:p-10">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-slate-950/44 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[0_14px_34px_rgba(2,6,23,0.24)] backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                    Customer
                  </p>
                  <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.96] tracking-normal text-white drop-shadow-[0_8px_28px_rgba(2,6,23,0.72)] sm:text-6xl">
                    Xin chào, {user.name || "khách hàng"}
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-white drop-shadow-[0_4px_18px_rgba(2,6,23,0.72)]">
                    Theo dõi lịch rửa và ưu đãi của bạn.
                  </p>
                </div>

                <div className="grid gap-3 rounded-[26px] border border-white/28 bg-slate-950/58 p-4 shadow-[0_18px_55px_rgba(2,6,23,0.42)] backdrop-blur-xl sm:grid-cols-4">
                  {statLine.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/10"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                        {label}
                      </p>
                      <p className="mt-3 text-2xl font-black text-white drop-shadow-[0_4px_14px_rgba(2,6,23,0.55)]">
                        {loading ? "..." : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="grid gap-6">
              <section className="rounded-[34px] border border-white/75 bg-white/74 p-6 shadow-[0_26px_70px_rgba(2,74,138,0.12)] backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                      Đang xử lý
                    </p>
                    <h2 className="mt-3 whitespace-nowrap text-3xl font-black text-slate-950">
                      {latestBooking?.plate || "Chưa có xe"}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {latestBooking?.service ||
                        latestBooking?.serviceName ||
                        "Đặt lịch để bắt đầu theo dõi rửa xe"}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">
                    {statusLabels[currentStatus] || "Chờ tiếp nhận"}
                  </span>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
                  <span>{formatDate(latestBooking?.date)}</span>
                  <span>{latestBooking?.time || "Chưa có giờ"}</span>
                  <span>{formatCurrency(latestBooking?.price)}</span>
                  <span>
                    {latestBooking?.bayName ||
                      latestBooking?.bayCode ||
                      latestBooking?.bay ||
                      "Chưa phân khoang"}
                  </span>
                </div>
                {latestBooking && currentStatus === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => setCancelBookingItem(latestBooking)}
                    className="mt-5 w-full rounded-2xl bg-rose-500 py-3 text-sm font-black text-white transition hover:bg-rose-600"
                  >
                    Hủy lịch hẹn
                  </button>
                )}
              </section>

              {pendingReviewBooking && (
                <section className="rounded-[34px] border border-cyan-200 bg-white/82 p-6 shadow-[0_26px_70px_rgba(2,74,138,0.12)] backdrop-blur-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                    Dịch vụ đã hoàn tất
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">
                    Đánh giá lượt rửa xe {pendingReviewBooking.plate || ""}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Chia sẻ trải nghiệm của bạn sau khi nhận xe.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewBooking(pendingReviewBooking)}
                      className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      Đánh giá ngay
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDismissedReviewIds((prev) => [
                          ...prev,
                          String(pendingReviewBooking.id),
                        ])
                      }
                      className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-600 ring-1 ring-cyan-100 transition hover:bg-cyan-50"
                    >
                      Để sau
                    </button>
                  </div>
                </section>
              )}

              <section className="rounded-[34px] border border-white/75 bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(2,20,38,0.2)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Tác vụ nhanh
                </p>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Đặt lịch mới", "/booking", "local_car_wash"],
                    ["Xem lịch sử", "/history", "receipt_long"],
                    ["Cập nhật xe", "/profile", "directions_car"],
                  ].map(([label, path, icon]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => navigate(path)}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-left font-black transition hover:bg-white/14"
                    >
                      <span>{label}</span>
                      <span className="material-symbols-outlined text-cyan-200">
                        {icon}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </section>

          {reviewMessage && (
            <div className="mt-6 rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-800 ring-1 ring-cyan-100">
              {reviewMessage}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
              {error}
            </div>
          )}

          <section className="mt-8 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-[34px] border border-white/75 bg-white/72 p-7 shadow-sm backdrop-blur-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                Hồ sơ khách hàng
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-300 text-2xl font-black text-slate-950">
                  {(user.name || user.email || "K").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-black text-slate-950">
                    {user.name || "Khách hàng"}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-500">
                    {user.email || user.phone || "Chưa cập nhật liên hệ"}
                  </p>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-cyan-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    Hạng
                  </p>
                  <p className="mt-2 text-xl font-black">{tier}</p>
                </div>
                <div className="rounded-2xl bg-cyan-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    Điểm
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {loading ? "..." : points}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/rewards")}
                className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Xem ưu đãi thành viên
              </button>
            </div>

            <div className="relative min-h-[300px] overflow-hidden rounded-[34px] border border-white/75 bg-white/72 shadow-sm backdrop-blur-2xl">
              <div className="relative flex min-h-[300px] flex-col justify-center gap-9 p-7 text-slate-950 sm:p-9">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                    Quy trình
                  </p>
                  <h2 className="mt-3 text-4xl font-black leading-none text-slate-950">
                    Các bước rửa xe.
                  </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                  {[
                    ["1", "Đặt lịch hẹn", "event_available"],
                    ["2", "Kiểm tra", "manage_search"],
                    ["3", "Rửa và chăm sóc xe", "cleaning_services"],
                    ["4", "Kiểm tra và giao xe", "person_check"],
                  ].map(([step, title, icon], index, list) => (
                    <div
                      key={step}
                      className="relative flex flex-col items-center gap-4 text-center md:items-start md:text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700">
                          <span className="material-symbols-outlined text-[38px]">
                            {icon}
                          </span>
                        </div>
                        {index < list.length - 1 && (
                          <span className="material-symbols-outlined hidden text-[34px] text-cyan-600 md:block">
                            chevron_right
                          </span>
                        )}
                      </div>
                      <p className="text-base font-black text-slate-950">
                        {step}. {title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      <ReviewModal
        booking={reviewBooking}
        loading={reviewLoading}
        onClose={() => setReviewBooking(null)}
        onSubmit={handleSubmitReview}
      />
      {cancelBookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/75 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-4xl">
                warning
              </span>
              <h3 className="text-2xl font-black text-slate-950">
                Xác nhận hủy lịch
              </h3>
            </div>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-600">
              {(() => {
                const scheduledTime = new Date(
                  cancelBookingItem.scheduledStartTime,
                );
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
                    const scheduledTime = new Date(
                      cancelBookingItem.scheduledStartTime,
                    );
                    const now = new Date();
                    const diffInMs = scheduledTime.getTime() - now.getTime();
                    const diffInMinutes = diffInMs / (1000 * 60);

                    await cancelBooking(cancelBookingItem.id);

                    const bookingRes = await getCustomerDashboardBookings();
                    const data = unwrapPayload(bookingRes);
                    const list = Array.isArray(data)
                      ? data
                      : data.bookings || [];
                    setBookings(sortNewestFirst(list));

                    if (diffInMinutes >= 60) {
                      setReviewMessage(
                        "Hủy lịch thành công. Tiền đặt cọc (100%) đã được hoàn lại vào ví của bạn.",
                      );
                    } else {
                      setReviewMessage(
                        "Hủy lịch thành công. Bạn không được hoàn lại tiền đặt cọc do hủy dưới 60 phút.",
                      );
                    }
                  } catch (err) {
                    setReviewMessage(
                      getFriendlyErrorMessage(
                        err,
                        "Không thể hủy lịch. Vui lòng thử lại sau.",
                      ),
                    );
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
