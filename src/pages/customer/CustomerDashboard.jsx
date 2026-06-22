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
const statusLabels = {
  PENDING: "Chờ tiếp nhận",
  RECEIVED: "Đã tiếp nhận",
  WASHING: "Đang rửa xe",
  DRYING: "Sấy hoàn thiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const unwrap = (payload) =>
  payload?.data?.data ?? payload?.data ?? payload ?? {};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

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
          const data = unwrap(bookingRes.value);
          const list = Array.isArray(data) ? data : data.bookings || [];
          setBookings(list);
        } else {
          setBookings([]);
        }
        if (loyaltyRes.status === "fulfilled") {
          const data = unwrap(loyaltyRes.value);
          setLoyalty(Object.keys(data || {}).length ? data : null);
        } else {
          setLoyalty(null);
        }
        if (reviewRes.status === "fulfilled") {
          const data = unwrap(reviewRes.value);
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
  const points = loyalty?.points ?? loyalty?.redeemablePoints ?? 0;
  const tier = loyalty?.tier || "Member";
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
    reviews.find(
      (review) => String(review.bookingId) === String(bookingId),
    );

  const pendingReviewBooking = bookings.find(
    (booking) =>
      String(booking.status || "").toUpperCase() === "COMPLETED" &&
      !getReviewByBookingId(booking.id) &&
      !dismissedReviewIds.includes(String(booking.id)),
  );

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
    <div className="customer-motion-root min-h-screen overflow-hidden bg-[#eefbff] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <img
          src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.98),rgba(235,252,255,0.9)_46%,rgba(178,232,255,0.66))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.07)_1px,transparent_1px)] bg-[size:74px_74px]" />
        <div className="absolute left-[-120px] top-[-140px] h-[520px] w-[520px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="wash-foam-drift absolute bottom-[-120px] right-[-120px] h-72 w-[66vw] rounded-full bg-white/55 blur-3xl" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="Home" />

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
                    Customer wash dashboard
                  </p>
                  <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.96] tracking-normal text-white drop-shadow-[0_8px_28px_rgba(2,6,23,0.72)] sm:text-6xl">
                    Chào mừng {user.name || "khách hàng"}.
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-white drop-shadow-[0_4px_18px_rgba(2,6,23,0.72)]">
                    Xe của bạn được theo dõi theo từng công đoạn: phủ bọt, xịt
                    áp lực, lau chi tiết và sấy khô trước khi bàn giao.
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
                      Live bay
                    </p>
                    <h2 className="mt-3 text-3xl font-black text-slate-950">
                      {latestBooking?.plate || "Chưa có xe trong khoang"}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {latestBooking?.service ||
                        latestBooking?.serviceName ||
                        "Đặt lịch để bắt đầu theo dõi rửa xe"}
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">
                    {statusLabels[currentStatus] || "Chờ tiếp nhận"}
                  </span>
                </div>

                <div className="mt-7 space-y-4">
                  {[
                    ["PENDING", "Tiếp nhận", "schedule"],
                    ["WASHING", "Xịt bọt & nước", "water_drop"],
                    ["DRYING", "Sấy khô", "air"],
                    ["COMPLETED", "Hoàn tất", "verified"],
                  ].map(([key, label, icon], index) => {
                    const currentIndex = [
                      "PENDING",
                      "WASHING",
                      "DRYING",
                      "COMPLETED",
                    ].indexOf(currentStatus);
                    const isActive =
                      key === currentStatus ||
                      (currentIndex === -1 && index === 0);
                    const isDone = currentIndex > index;
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-4 rounded-2xl p-3 transition ${
                          isActive
                            ? "bg-cyan-50 ring-1 ring-cyan-200"
                            : isDone
                              ? "bg-emerald-50"
                              : "bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                            isActive
                              ? "bg-cyan-400 text-slate-950"
                              : isDone
                                ? "bg-emerald-400 text-white"
                                : "bg-white text-slate-400"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[22px]">
                            {icon}
                          </span>
                        </span>
                        <div>
                          <p className="font-black text-slate-950">{label}</p>
                          <p className="text-sm text-slate-500">
                            {isActive
                              ? "Đang cập nhật tại khoang rửa"
                              : "Theo dõi tự động"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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

            <div className="rounded-[34px] border border-white/75 bg-white/72 p-7 shadow-sm backdrop-blur-2xl">
              <div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                    Quy trình chăm sóc
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-950">
                    Một lượt rửa xe rõ từng công đoạn.
                  </h2>
                </div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-4">
                {[
                  ["01", "Phủ bọt", "Làm mềm bụi bẩn"],
                  ["02", "Xịt áp lực", "Rửa mâm, gầm, thân xe"],
                  ["03", "Lau chi tiết", "Kính và khoang cabin"],
                  ["04", "Sấy khô", "Kiểm tra bàn giao"],
                ].map(([step, title, description]) => (
                  <article key={step} className="rounded-2xl bg-cyan-50/70 p-5">
                    <p className="font-mono text-sm font-black text-cyan-700">
                      {step}
                    </p>
                    <h3 className="mt-4 text-lg font-black text-slate-950">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {description}
                    </p>
                  </article>
                ))}
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
    </div>
  );
}
