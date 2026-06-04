// src/pages/admin/AdminBookings.jsx
import { useState, useEffect } from "react";
import { useCallback } from "react";
import AdminBookingsTable from "../../components/admin/AdminBookingsTable";
import {
  getAdminBooking,
  getAdminBookings,
} from "../../services/bookingApi";

const toIsoDate = (value) => {
  const trimmed = value.trim();
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
};

const parseDateRange = (value) => {
  const [start, end] = value.split(/\s+-\s+/).map((part) => toIsoDate(part));
  return {
    dateRange: value.trim() || undefined,
    startDate: start || undefined,
    endDate: end || undefined,
  };
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("");
  const [systemTime, setSystemTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: false }),
  );
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 10,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminBookings({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
        ...parseDateRange(dateRange),
      });
      const payload = res.data?.data ?? res.data;
      const items = Array.isArray(payload)
        ? payload
        : payload.bookings || payload.items || [];
      setBookings(items);
      setPagination((prev) => ({
        ...prev,
        total: payload.total || items.length || 0,
      }));
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, pagination.limit, pagination.page, search, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const fetchBookingDetails = async (id) => {
    try {
      const res = await getAdminBooking(id);
      setSelectedBooking(res.data?.data ?? res.data);
      setIsDrawerOpen(true);
    } catch {
      setSelectedBooking(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-headline-lg text-on-surface">
              Quản lý Lịch hẹn & Đơn hàng
            </h1>
            <p className="font-data-display text-sm text-on-surface-variant">
              SYS_TIME:{" "}
              <span>{systemTime}</span>{" "}
              | SECURE_MODE: ACTIVE
            </p>
          </div>
          <button className="h-10 px-4 border border-primary text-primary font-label-caps hover:bg-primary/10 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>{" "}
            EXPORT CSV
          </button>
        </div>

        {/* Tool & Filter Bar */}
        <div className="flex flex-col gap-4 border-b border-outline-variant bg-surface-container py-4 lg:flex-row lg:items-end">
          <div className="w-full lg:max-w-sm lg:flex-1">
            <label className="font-label-caps text-on-surface-variant block mb-2">
              QUICK FIND
            </label>
            <div className="relative flex h-10 w-full items-center border border-outline-variant bg-surface transition-colors focus-within:border-primary">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm biển số, mã đơn..."
                className="w-full bg-transparent border-none text-on-surface pl-10 pr-3 h-full focus:ring-0 placeholder:text-outline"
              />
            </div>
          </div>

          <div>
            <label className="font-label-caps text-on-surface-variant block mb-2">
              DATE RANGE
            </label>
            <div className="relative flex h-10 w-full items-center border border-outline-variant bg-surface transition-colors focus-within:border-primary lg:w-64">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">
                calendar_month
              </span>
              <input
                type="text"
                placeholder="DD/MM/YYYY - DD/MM/YYYY"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-transparent border-none text-on-surface pl-10 pr-3 h-full focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label className="font-label-caps text-on-surface-variant block mb-2">
              STATUS
            </label>
            <div className="relative flex h-10 w-full items-center border border-outline-variant bg-surface transition-colors focus-within:border-primary lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-transparent border-none text-on-surface pl-3 pr-10 h-full focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="all">ALL STATUS</option>
                <option value="PENDING">PENDING</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 text-on-surface-variant pointer-events-none">
                arrow_drop_down
              </span>
            </div>
          </div>
        </div>

        <AdminBookingsTable
          bookings={bookings}
          fetchBookingDetails={fetchBookingDetails}
          loading={loading}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between py-2">
          <p className="font-label-caps text-on-surface-variant">
            SHOWING <span className="text-on-surface">{bookings.length}</span>{" "}
            OF <span className="text-on-surface">{pagination.total}</span>{" "}
            RESULTS
          </p>
          <div className="flex gap-1">
            <button
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              className="h-8 px-3 border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-caps disabled:opacity-50 disabled:cursor-not-allowed"
            >
              PREV
            </button>
            <span className="h-8 min-w-8 border border-primary bg-primary/10 px-3 text-primary font-data-display flex items-center justify-center">
              {pagination.page}
            </span>
            <button
              disabled={
                pagination.total > 0 &&
                pagination.page * pagination.limit >= pagination.total
              }
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              className="h-8 px-3 border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-caps disabled:opacity-50 disabled:cursor-not-allowed"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

      {/* Booking Detail Drawer */}
      {isDrawerOpen && selectedBooking && (
        <>
          <div
            className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-40"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] lg:w-[450px] bg-surface-container border-l border-outline-variant shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
            <header className="flex items-center justify-between p-6 border-b border-outline-variant bg-surface-container-high shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Chi tiết Đơn{" "}
                  {selectedBooking.code || `#${selectedBooking.id}`}
                </h2>
                <div className="flex items-center px-2 py-1 border border-secondary bg-secondary/10">
                  <span className="font-label-caps text-label-caps text-secondary">
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-on-surface-variant hover:text-secondary transition-colors p-2"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Customer & Vehicle Info */}
              <div className="space-y-4">
                <div className="p-4 bg-surface-container-low border border-outline-variant flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant shrink-0 bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">
                        person
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-on-surface truncate">
                        {selectedBooking.customerName}
                      </div>
                      <div className="flex items-center gap-1 text-[#FFD700]">
                        <span
                          className="material-symbols-outlined text-[14px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          stars
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {selectedBooking.tier || "Gold"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-surface-container-low border border-outline-variant flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                      License Plate
                    </div>
                    <div className="border border-outline-variant px-1.5 py-0.5">
                      <span className="font-data-display text-[12px] text-on-surface tracking-tight font-bold">
                        {selectedBooking.plate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Breakdown */}
              <div className="bg-surface-container-low border border-outline-variant">
                <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-highest">
                  <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                    INVOICE BREAKDOWN
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center text-on-surface">
                    <span>{selectedBooking.service}</span>
                    <span className="font-data-display">
                      {selectedBooking.subtotal?.toLocaleString() ||
                        selectedBooking.total?.toLocaleString()}
                      đ
                    </span>
                  </div>
                  {selectedBooking.discount > 0 && (
                    <div className="flex justify-between items-center text-primary">
                      <span>Giảm giá Hạng {selectedBooking.tier}</span>
                      <span className="font-data-display">
                        -{selectedBooking.discount?.toLocaleString()}đ
                      </span>
                    </div>
                  )}
                  <div className="border-t border-outline-variant border-dashed pt-4 flex justify-between items-center">
                    <span className="font-semibold text-on-surface">
                      Tổng thanh toán
                    </span>
                    <span className="font-headline-sm text-secondary">
                      {selectedBooking.total?.toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="inline-flex items-center px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full">
                      <span
                        className="material-symbols-outlined text-[16px] text-secondary mr-2"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">
                        {selectedBooking.paymentMethod === "PAYOS"
                          ? "PAID VIA PAYOS"
                          : "CASH PAYMENT"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operational Timeline */}
              <div className="bg-surface-container-low border border-outline-variant">
                <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-highest">
                  <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                    AUDIT TRAIL
                  </h3>
                </div>
                <div className="p-5">
                  <div className="relative pl-6 border-l border-outline-variant space-y-8 pb-4">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-outline-variant border-2 border-surface-container-low"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <div className="text-sm text-on-surface">
                            Đặt lịch trực tuyến
                          </div>
                          <div className="text-[10px] text-on-surface-variant">
                            {selectedBooking.createdAt || selectedBooking.date}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-outline-variant text-[18px]">
                          event_available
                        </span>
                      </div>
                    </div>
                    {selectedBooking.status !== "PENDING" && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-outline-variant border-2 border-surface-container-low"></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-on-surface">
                              Check-in QR
                            </div>
                            <span className="text-[10px] text-on-surface-variant">
                              {selectedBooking.time}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-outline-variant text-[18px]">
                            qr_code_scanner
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedBooking.status === "COMPLETED" && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-secondary border-2 border-surface-container-low"></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            <div className="text-sm text-secondary font-medium">
                              Hoàn tất & Giao xe
                            </div>
                          </div>
                          <span
                            className="material-symbols-outlined text-secondary text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            task_alt
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

