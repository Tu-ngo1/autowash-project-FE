import { useEffect, useMemo, useState } from "react";
import {
  //Gọi và xử lý dữ liệu để render lên Giao diện
  getAdminDashboardAnalytics,
  getAdminDashboardBookings,
  getAdminDashboardBookingsByStatus,
  getAdminDashboardRevenue,
  getAdminDashboardTopVouchers,
} from "../../services/adminDashboardApi";
import {
  asArrayPayload,
  normalizeAdminBooking,
  normalizeTopVoucher,
} from "../../utils/adminDto";

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return `${number.toLocaleString("vi-VN")}đ`;
};

const unwrap = (response) => response?.data?.data ?? response?.data ?? {};

const getList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  const allKeys = [...keys, "content"];
  for (const key of allKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const getMetric = (payload, keys, fallback = 0) => {
  for (const key of keys) {
    if (payload?.[key] !== undefined && payload?.[key] !== null) {
      return payload[key];
    }
  }
  return fallback;
};

function KpiCard({ title, value, icon, children, delay = 0 }) {
  return (
    <div
      className="admin-reveal group relative min-h-36 overflow-hidden rounded-none border border-zinc-800 bg-zinc-950 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/70 hover:bg-[#071014] hover:shadow-[0_22px_70px_rgba(34,211,238,0.08)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="admin-scanline absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="absolute left-0 top-0 h-full w-1 bg-cyan-300 opacity-70" />
      <div className="mb-5 flex items-start justify-between gap-4 pl-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          {title}
        </span>
        <span
          className="material-symbols-outlined text-[22px] text-cyan-300 transition duration-300 group-hover:scale-110 group-hover:text-cyan-100"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="mb-2 pl-3 font-mono text-[28px] font-black text-zinc-50 transition duration-300 group-hover:text-cyan-50">
        {value}
      </div>
      <div className="pl-3">{children}</div>
    </div>
  );
}

function RevenueChart({ points }) {
  const values = points.map((item) => Number(item.revenue ?? item.value ?? 0));
  const max = Math.max(...values, 0);
  const polyline =
    values.length > 0
      ? values
          .map((value, index) => {
            const x =
              values.length === 1 ? 100 : (index / (values.length - 1)) * 100;
            const y = max === 0 ? 90 : 90 - (value / max) * 70;
            return `${x},${y}`;
          })
          .join(" ")
      : "";
  const area = polyline
    ? `M${polyline.replaceAll(" ", " L")} L100,100 L0,100 Z`
    : "";

  return (
    <div className="relative flex-1 overflow-hidden bg-[#05070a] p-4 [background-image:linear-gradient(to_right,rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.08)_1px,transparent_1px)] [background-size:42px_42px]">
      <div className="admin-scanline pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent" />
      <div className="absolute bottom-8 left-0 top-0 flex w-20 flex-col justify-between border-r border-zinc-800 px-2 py-4 font-mono text-[10px] text-zinc-500">
        {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
          <span key={ratio}>{formatCurrency(max * ratio)}</span>
        ))}
      </div>
      <div className="relative ml-20 h-full">
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600">
            NO DATA
          </div>
        ) : (
          <>
            <svg
              className="h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient
                  id="adminRevenueGradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#8aebff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8aebff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 40, 60, 80].map((y) => (
                <line
                  key={y}
                  stroke="#263238"
                  strokeWidth="0.5"
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                />
              ))}
              <path d={area} fill="url(#adminRevenueGradient)" />
              <polyline
                className="admin-chart-line"
                fill="none"
                points={polyline}
                stroke="#8aebff"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="absolute bottom-0 left-0 flex w-full justify-between px-4 pb-1 font-mono text-[10px] text-zinc-500">
              {points.map((item, index) => (
                <span key={item.label || item.date || index}>
                  {item.label || item.day || item.date || ""}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ServiceRatio({ items }) {
  const total = items.reduce(
    (sum, item) => sum + (Number(item.value ?? item.count) || 0),
    0
  );
  let offset = 0;

  const STATUS_COLORS = {
    PENDING: "#fbbf24", // Màu vàng
    IN_PROGRESS: "#3b82f6", // Màu xanh biển
    WASHING: "#3b82f6", // Màu xanh biển (dự phòng)
    COMPLETED: "#22c55e", // Màu xanh lá
    CANCELLED: "#ef4444", // Màu đỏ
    CONFIRM: "#f59e0b",
    ARRIVED: "#06b6d4",
    WASHED: "#10b981",
  };

  const getStatusColor = (statusName, index) => {
    const key = String(statusName || "")
      .toUpperCase()
      .replace(" ", "_");
    return (
      STATUS_COLORS[key] ||
      ["#8aebff", "#22d3ee", "#3c494c", "#4edea3"][index % 4]
    );
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#05070a] p-5">
      <div className="relative mb-6 h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            fill="transparent"
            r="16"
            stroke="#27272a"
            strokeWidth="4"
          />
          {items.map((item, index) => {
            const value = Number(item.value ?? item.count) || 0;
            const percent = total ? (value / total) * 100 : 0;
            const color = getStatusColor(item.name, index);
            const circle = (
              <circle
                key={item.name || item.label || index}
                cx="16"
                cy="16"
                fill="transparent"
                r="16"
                stroke={color}
                strokeDasharray={`${percent} 100`}
                strokeDashoffset={-offset}
                strokeWidth="4"
              />
            );
            offset += percent;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-black text-zinc-50">
            {total ? "100%" : "0%"}
          </span>
          <span className="font-mono text-[8px] font-black tracking-[0.2em] text-zinc-500">
            TOTAL
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600">
          NO DATA
        </div>
      ) : (
        <div className="w-full space-y-2">
          {items.map((item, index) => {
            const value = Number(item.value ?? item.count) || 0;
            const percent = total ? Math.round((value / total) * 100) : 0;
            const color = getStatusColor(item.name, index);
            return (
              <div
                key={item.name || item.label || index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center">
                  <div
                    className="mr-2 h-2 w-2"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                    {item.name || item.label || "SERVICE"}
                  </span>
                </div>
                <span className="font-mono font-black text-zinc-100">
                  {percent}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState({});
  const [revenue, setRevenue] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsByStatus, setBookingsByStatus] = useState([]);
  const [topVouchers, setTopVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //Đưa vào danh sách gọi song song Promise.all trong hàm load
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, revenueRes, bookingsRes, statusRes, voucherRes] =
        await Promise.all([
          getAdminDashboardAnalytics().catch(() => null),
          getAdminDashboardRevenue({ range: "7d" }).catch(() => null),
          getAdminDashboardBookings().catch(() => null),
          getAdminDashboardBookingsByStatus().catch(() => null),
          getAdminDashboardTopVouchers().catch(() => null),
        ]);

      const dashboardPayload = unwrap(dashboardRes);
      const revenuePayload = unwrap(revenueRes);

      setDashboard(dashboardPayload || {});
      setRevenue(
        getList(revenuePayload, ["items", "revenue", "data", "chart"])
      );
      const bookingItems = asArrayPayload(bookingsRes, [
        "bookings",
        "items",
        "data",
      ]).map(normalizeAdminBooking);
      setBookings(bookingItems);
      setBookingsByStatus(
        asArrayPayload(statusRes, ["items", "statuses", "data"])
      );
      setTopVouchers(
        asArrayPayload(voucherRes, ["items", "vouchers", "data"]).map(
          normalizeTopVoucher
        )
      );
    } catch {
      setError("Không thể tải dữ liệu dashboard.");
      setDashboard({});
      setRevenue([]);
      setBookings([]);
      setBookingsByStatus([]);
      setTopVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const serviceRatios = useMemo(
    () =>
      bookingsByStatus.length > 0
        ? bookingsByStatus.map((item) => ({
            name: item.status,
            value: item.total,
          }))
        : getList(dashboard, [
            "serviceRatios",
            "serviceRatio",
            "serviceStats",
            "services",
          ]),
    [bookingsByStatus, dashboard]
  );
  // Lọc tìm phần tử có trạng thái "PENDING" và lấy số lượng tương ứng
  const pendingCount = useMemo(() => {
    const found = bookingsByStatus.find(
      (item) => String(item.status).toUpperCase() === "PENDING"
    );
    if (found) {
      return found.total ?? 0;
    }
    // Nếu chưa load xong hoặc không tìm thấy, lấy dự phòng từ API dashboard cũ
    return getMetric(dashboard, "PENDING");
  }, [bookingsByStatus, dashboard]);

  const bookingCount = useMemo(() => {
    if (bookingsByStatus.length > 0) {
      return bookingsByStatus
        .filter(
          (item) => String(item.status || "").toUpperCase() !== "CANCELLED"
        )
        .reduce((sum, item) => sum + (item.total ?? 0), 0);
    }
    return getMetric(dashboard, ["washCount", "totalWashes", "bookingCount"]); // Dòng dự phòng cần thêm
  }, [bookingsByStatus, dashboard]);

  const revenueTotal = useMemo(() => {
    const backendRevenue = getMetric(dashboard, ["totalRevenue", "revenue", "totalSales"]);
    if (backendRevenue !== undefined && backendRevenue !== null && backendRevenue !== 0) {
      return backendRevenue;
    }
    if (bookings.length > 0) {
      return bookings
        .filter(
          (item) => String(item.status || "").toUpperCase() === "COMPLETED"
        )
        .reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
    }
    return 0;
  }, [bookings, dashboard]); // Sửa lại mảng dependency chính xác

  return (
    <main className="min-h-full space-y-6 bg-[#05070a] p-4 text-zinc-100 sm:p-6 md:p-8">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(63,63,70,0.18),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <header className="admin-reveal relative overflow-hidden border border-zinc-800 bg-zinc-950">
        <div className="admin-scanline pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-transparent via-cyan-300/12 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-6">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                ADMIN ROOT
              </span>
              <span className="border border-zinc-800 bg-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                <span className="admin-pulse mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {loading ? "SYNCING" : "LIVE FEED"}
              </span>
            </div>
            <h2 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
              System Analytics
            </h2>
            <p className="mt-3 max-w-3xl font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-zinc-500">
              Revenue, operations, payment split and recent booking telemetry.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="group flex w-fit items-center border border-cyan-400/60 bg-cyan-400/10 px-4 py-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-400/20 hover:shadow-[0_18px_50px_rgba(34,211,238,0.12)]"
          >
            <span className="material-symbols-outlined mr-2 text-[16px] transition group-hover:rotate-180">
              refresh
            </span>
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="relative border border-red-500/40 bg-red-950/30 p-4 font-mono text-xs font-black uppercase tracking-[0.16em] text-red-300">
          {error}
        </div>
      )}

      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="TỔNG DOANH THU"
          icon="payments"
          delay={80}
          value={revenueTotal}
        />
        <KpiCard
          title="LƯỢT RỬA XE"
          icon="directions_car"
          delay={160}
          value={bookingCount}
        />
        <KpiCard
          title="KHÁCH MỚI"
          icon="person_add"
          delay={240}
          value={getMetric(dashboard, [
            "newCustomers",
            "customerCount",
            "customers",
          ])}
        />
        <KpiCard
          title="ĐƠN ĐANG CHỜ"
          icon="pending_actions"
          delay={320}
          value={pendingCount} // <--- Đổi sang biến mới tính từ bookingsByStatus
        />
      </div>

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <section
          className="admin-reveal flex h-[340px] flex-col overflow-hidden border border-zinc-800 bg-zinc-950 transition duration-300 hover:border-cyan-400/50"
          style={{ animationDelay: "380ms" }}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 bg-black p-4">
            <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
              DOANH THU 7 NGÀY QUA
            </span>
            <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[10px] font-black text-cyan-300">
              7D
            </span>
          </div>
          <RevenueChart points={revenue} />
        </section>

        <section
          className="admin-reveal flex h-[340px] flex-col overflow-hidden border border-zinc-800 bg-zinc-950 transition duration-300 hover:border-cyan-400/50"
          style={{ animationDelay: "460ms" }}
        >
          <div className="border-b border-zinc-800 bg-black p-4">
            <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
              TỶ LỆ TRẠNG THÁI BOOKING
            </span>
          </div>
          <ServiceRatio items={serviceRatios} />
        </section>
      </div>

      <section
        className="admin-reveal relative flex flex-col overflow-hidden border border-zinc-800 bg-zinc-950"
        style={{ animationDelay: "500ms" }}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 bg-black p-4">
          <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
            TOP VOUCHER ĐƯỢC DÙNG
          </span>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            {topVouchers.length} rows
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#080b10]">
                {["MÃ VOUCHER", "CHIẾN DỊCH", "GIẢM GIÁ", "LƯỢT DÙNG"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="p-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="font-mono text-[13px]">
              {topVouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-10 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    NO DATA
                  </td>
                </tr>
              ) : (
                topVouchers.map((voucher) => (
                  <tr
                    key={voucher.id || voucher.code}
                    className="border-b border-zinc-900 transition duration-200 hover:bg-cyan-400/[0.04]"
                  >
                    <td className="p-4 font-black text-cyan-300">
                      {voucher.code || "-"}
                    </td>
                    <td className="p-4 text-zinc-100">{voucher.name || "-"}</td>
                    <td className="p-4 text-zinc-400">
                      {voucher.discountPercent
                        ? `${voucher.discountPercent}%`
                        : formatCurrency(
                            voucher.discountAmount || voucher.maxDiscountAmount
                          )}
                    </td>
                    <td className="p-4 text-right font-black text-zinc-100">
                      {(voucher.usedCount || 0).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="admin-reveal relative flex flex-col overflow-hidden border border-zinc-800 bg-zinc-950"
        style={{ animationDelay: "540ms" }}
      >
        <div className="admin-scanline pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-transparent via-cyan-300/5 to-transparent" />
        <div className="flex items-center justify-between border-b border-zinc-800 bg-black p-4">
          <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
            GIAO DỊCH GẦN ĐÂY
          </span>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            {Math.min(bookings.length, 8)} rows
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#080b10]">
                {[
                  "MÃ ĐƠN",
                  "KHÁCH HÀNG",
                  "BIỂN SỐ",
                  "THANH TOÁN",
                  "TRẠNG THÁI",
                  "TỔNG TIỀN",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="p-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-[13px]">
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    NO DATA
                  </td>
                </tr>
              ) : (
                bookings.slice(0, 8).map((booking, index) => (
                  <tr
                    key={booking.id || booking.bookingId || index}
                    className="admin-reveal border-b border-zinc-900 transition duration-200 hover:translate-x-1 hover:bg-cyan-400/[0.04]"
                    style={{ animationDelay: `${620 + index * 45}ms` }}
                  >
                    <td className="p-4 font-black text-cyan-300">
                      {booking.bookingCode || `#${booking.id || "-"}`}
                    </td>
                    <td className="p-4 text-zinc-100">
                      {booking.customerName || "-"}
                    </td>
                    <td className="p-4 text-zinc-400">
                      {booking.vehicleLicensePlate || "-"}
                    </td>
                    <td className="p-4">
                      <span className="border border-cyan-400/50 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-300">
                        {booking.paymentMethod || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-emerald-300">
                      {booking.status || "-"}
                    </td>
                    <td className="p-4 text-right font-black text-zinc-100">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
