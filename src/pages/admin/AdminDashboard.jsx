import { useEffect, useMemo, useState } from "react";
import { getDashboardAnalytics, getRevenueAnalytics } from "../../services/analyticsApi";
import { getAdminBookings } from "../../services/bookingApi";

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return `${number.toLocaleString("vi-VN")}đ`;
};

const unwrap = (response) => response?.data?.data ?? response?.data ?? {};

const getList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
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

function KpiCard({ title, value, icon, children }) {
  return (
    <div className="group relative flex flex-col border border-surface-container-highest bg-surface-container p-5">
      <div className="absolute left-0 top-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-4 flex items-start justify-between">
        <span className="font-label-caps text-[12px] text-on-surface-variant">
          {title}
        </span>
        <span className="material-icons text-[20px] text-primary">{icon}</span>
      </div>
      <div className="mb-2 font-data-display text-[24px] text-on-surface">
        {value}
      </div>
      {children}
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
            const x = values.length === 1 ? 100 : (index / (values.length - 1)) * 100;
            const y = max === 0 ? 90 : 90 - (value / max) * 70;
            return `${x},${y}`;
          })
          .join(" ")
      : "";
  const area = polyline ? `M${polyline.replaceAll(" ", " L")} L100,100 L0,100 Z` : "";

  return (
    <div className="relative flex-1 bg-background p-4 [background-image:linear-gradient(to_right,#191f31_1px,transparent_1px),linear-gradient(to_bottom,#191f31_1px,transparent_1px)] [background-size:40px_40px]">
      <div className="absolute bottom-8 left-0 top-0 flex w-16 flex-col justify-between border-r border-surface-container-highest px-2 py-4 font-data-display text-[10px] text-outline">
        {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
          <span key={ratio}>{formatCurrency(max * ratio)}</span>
        ))}
      </div>
      <div className="relative ml-16 h-full">
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center font-label-caps text-outline">
            NO DATA
          </div>
        ) : (
          <>
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="adminRevenueGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8aebff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8aebff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 40, 60, 80].map((y) => (
                <line
                  key={y}
                  stroke="#2e3447"
                  strokeWidth="0.5"
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                />
              ))}
              <path d={area} fill="url(#adminRevenueGradient)" />
              <polyline
                fill="none"
                points={polyline}
                stroke="#8aebff"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="absolute bottom-0 left-0 flex w-full justify-between px-4 pb-1 font-data-display text-[10px] text-outline">
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
  const total = items.reduce((sum, item) => sum + (Number(item.value ?? item.count) || 0), 0);
  const colors = ["#8aebff", "#22d3ee", "#3c494c", "#4edea3"];
  let offset = 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="relative mb-6 h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" fill="transparent" r="16" stroke="#3c494c" strokeWidth="4" />
          {items.map((item, index) => {
            const value = Number(item.value ?? item.count) || 0;
            const percent = total ? (value / total) * 100 : 0;
            const circle = (
              <circle
                key={item.name || item.label || index}
                cx="16"
                cy="16"
                fill="transparent"
                r="16"
                stroke={colors[index % colors.length]}
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
          <span className="font-data-display text-lg text-on-surface">
            {total ? "100%" : "0%"}
          </span>
          <span className="font-label-caps text-[8px] text-outline">TOTAL</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="font-label-caps text-outline">NO DATA</div>
      ) : (
        <div className="w-full space-y-2">
          {items.map((item, index) => {
            const value = Number(item.value ?? item.count) || 0;
            const percent = total ? Math.round((value / total) * 100) : 0;
            return (
              <div
                key={item.name || item.label || index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center">
                  <div
                    className="mr-2 h-2 w-2"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="font-label-caps text-on-surface-variant">
                    {item.name || item.label || "SERVICE"}
                  </span>
                </div>
                <span className="font-data-display text-on-surface">{percent}%</span>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, revenueRes, bookingsRes] = await Promise.all([
        getDashboardAnalytics().catch(() => null),
        getRevenueAnalytics({ range: "7d" }).catch(() => null),
        getAdminBookings().catch(() => null),
      ]);

      const dashboardPayload = unwrap(dashboardRes);
      const revenuePayload = unwrap(revenueRes);
      const bookingsPayload = unwrap(bookingsRes);

      setDashboard(dashboardPayload || {});
      setRevenue(getList(revenuePayload, ["items", "revenue", "data", "chart"]));
      setBookings(getList(bookingsPayload, ["bookings", "items", "data"]).slice(0, 8));
    } catch {
      setError("Không thể tải dữ liệu dashboard.");
      setDashboard({});
      setRevenue([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const serviceRatios = useMemo(
    () =>
      getList(dashboard, [
        "serviceRatios",
        "serviceRatio",
        "serviceStats",
        "services",
      ]),
    [dashboard],
  );

  const payment = dashboard.paymentRatio || dashboard.payments || {};
  const payosPercent = Number(payment.payosPercent ?? payment.payos ?? 0);
  const cashPercent = Number(payment.cashPercent ?? payment.cash ?? 0);

  return (
    <main className="h-full flex-1 space-y-6 overflow-y-auto bg-background p-6">
      <header className="flex flex-col gap-4 border-b border-surface-container-highest pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline-md text-on-surface">
            System Analytics Overview
          </h2>
          <p className="mt-1 font-label-caps text-on-surface-variant">
            LAST UPDATED:{" "}
            <span className="font-data-display text-primary">
              {loading ? "LOADING" : "LIVE"}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex w-fit items-center border border-primary bg-surface-container px-4 py-2 font-label-caps text-primary transition-colors hover:bg-primary/10"
        >
          <span className="material-icons mr-2 text-[16px]">refresh</span>
          REFRESH
        </button>
      </header>

      {error && (
        <div className="border border-error-container bg-error-container/20 p-4 font-label-caps text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="TỔNG DOANH THU"
          icon="payments"
          value={formatCurrency(
            getMetric(dashboard, ["totalRevenue", "revenue", "totalSales"]),
          )}
        />
        <KpiCard
          title="LƯỢT RỬA XE"
          icon="directions_car"
          value={getMetric(dashboard, ["washCount", "totalWashes", "bookingCount"])}
        />
        <KpiCard
          title="KHÁCH MỚI"
          icon="person_add"
          value={getMetric(dashboard, ["newCustomers", "customerCount", "customers"])}
        />
        <KpiCard title="THANH TOÁN PAYOS" icon="qr_code_scanner" value={`${payosPercent}%`}>
          <div className="mt-2 h-1 w-full bg-surface-container-highest">
            <div className="h-1 bg-primary" style={{ width: `${payosPercent}%` }} />
          </div>
          <div className="mt-auto border-t border-surface-container-highest pt-2 font-label-caps text-on-surface-variant">
            Cash: {cashPercent}%
          </div>
        </KpiCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <section className="flex h-[320px] flex-col border border-surface-container-highest bg-surface-container">
          <div className="flex items-center justify-between border-b border-surface-container-highest bg-surface-container-lowest p-4">
            <span className="font-label-caps text-on-surface">DOANH THU 7 NGÀY QUA</span>
            <span className="bg-surface-variant px-2 py-1 font-label-caps text-[10px] text-on-surface">
              7D
            </span>
          </div>
          <RevenueChart points={revenue} />
        </section>

        <section className="flex h-[320px] flex-col border border-surface-container-highest bg-surface-container">
          <div className="border-b border-surface-container-highest bg-surface-container-lowest p-4">
            <span className="font-label-caps text-on-surface">TỶ LỆ GÓI DỊCH VỤ</span>
          </div>
          <ServiceRatio items={serviceRatios} />
        </section>
      </div>

      <section className="flex flex-col border border-surface-container-highest bg-surface-container">
        <div className="border-b border-surface-container-highest bg-surface-container-lowest p-4">
          <span className="font-label-caps text-on-surface">GIAO DỊCH GẦN ĐÂY</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-container-highest bg-[#0a101f]">
                {["MÃ ĐƠN", "KHÁCH HÀNG", "BIỂN SỐ", "THANH TOÁN", "TRẠNG THÁI", "TỔNG TIỀN"].map(
                  (heading) => (
                    <th key={heading} className="p-4 font-label-caps font-normal text-outline">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="font-data-display text-[14px]">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-label-caps text-outline">
                    NO DATA
                  </td>
                </tr>
              ) : (
                bookings.map((booking, index) => (
                  <tr
                    key={booking.id || booking.bookingId || index}
                    className="border-b border-surface-container-highest transition-colors hover:bg-surface-variant"
                  >
                    <td className="p-4 text-primary">
                      #{booking.id || booking.bookingId || "-"}
                    </td>
                    <td className="p-4 text-on-surface">
                      {booking.customerName || booking.customer || booking.name || "-"}
                    </td>
                    <td className="p-4 text-on-surface-variant">{booking.plate || "-"}</td>
                    <td className="p-4">
                      <span className="border border-primary px-2 py-1 text-[10px] uppercase text-primary">
                        {booking.paymentMethod || booking.method || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-secondary">{booking.status || "-"}</td>
                    <td className="p-4 text-right text-on-surface">
                      {formatCurrency(booking.price || booking.totalPrice || booking.amount)}
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
