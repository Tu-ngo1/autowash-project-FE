// src/pages/admin/AdminBookings.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import AdminBookingsTable from "../../components/admin/AdminBookingsTable";
import {
  deleteAdminBooking,
  getAdminBooking,
  getAdminBookings,
  updateAdminBookingStatus,
} from "../../services/adminBookingApi";
import { asArrayPayload, normalizeAdminBooking } from "../../utils/adminDto";

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
    startDate: start || undefined,
    endDate: end || undefined,
  };
};

export default function AdminBookings() {
  const [allBookings, setAllBookings] = useState([]);
  const [isClientSide, setIsClientSide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("");
  const [systemTime, setSystemTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: false })
  );
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("view");
  const [actionMessage, setActionMessage] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 10,
  });

  const bookings = useMemo(() => {
    if (isClientSide) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      return allBookings.slice(startIndex, startIndex + pagination.limit);
    }
    return allBookings;
  }, [allBookings, isClientSide, pagination.page, pagination.limit]);

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
      const payload = res.data?.data ?? res.data ?? {};
      const items = asArrayPayload(res, ["bookings", "items", "data"]).map(
        normalizeAdminBooking
      );

      const detectClientSide =
        Array.isArray(payload) && items.length > pagination.limit;
      setIsClientSide(detectClientSide);
      setAllBookings(items);

      const backendTotal =
        payload.total ?? payload.totalElements ?? payload.totalItems;
      const hasBackendTotal =
        backendTotal !== undefined && backendTotal !== null;

      setPagination((prev) => ({
        ...prev,
        total: hasBackendTotal
          ? backendTotal
          : detectClientSide
          ? items.length
          : -1,
      }));
    } catch {
      setAllBookings([]);
      setIsClientSide(false);
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
      setSelectedBooking(normalizeAdminBooking(res.data?.data ?? res.data));
      setDrawerMode("view");
      setIsDrawerOpen(true);
    } catch {
      setSelectedBooking(null);
    }
  };

  const openEditBooking = async (booking) => {
    try {
      const res = await getAdminBooking(booking.id);
      setSelectedBooking(normalizeAdminBooking(res.data?.data ?? res.data));
    } catch {
      setSelectedBooking(normalizeAdminBooking(booking));
    }
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleDeleteBooking = async (booking) => {
    const id = booking.id;
    if (!id) return;
    const ok = window.confirm(
      `Xóa booking ${booking.bookingCode || `#${id}`}?`
    );
    if (!ok) return;
    setActionMessage("");
    try {
      await deleteAdminBooking(id);
      setActionMessage("BOOKING DELETED");
    } catch {
      setActionMessage("DELETE REQUEST FAILED, REMOVED FROM LOCAL VIEW");
    }
    setAllBookings((current) =>
      current.filter((item) => (item.id || item.bookingId) !== id)
    );
  };

  const handleStatusChange = async (status) => {
    if (!selectedBooking) return;
    const id = selectedBooking.id || selectedBooking.bookingId;
    setSelectedBooking((current) => ({ ...current, status }));
    setAllBookings((current) =>
      current.map((item) =>
        item.bookingId === id ? { ...item, status } : item
      )
    );
    try {
      await updateAdminBookingStatus(id, status);
      setActionMessage("STATUS UPDATED");
    } catch {
      setActionMessage("STATUS UPDATED LOCALLY, API REQUEST FAILED");
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#05070a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.11),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(63,63,70,0.2),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>
      <div className="relative flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        {/* Header */}
        <div className="admin-reveal relative overflow-hidden border border-zinc-800 bg-zinc-950 p-5">
          <div className="admin-scanline pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-transparent via-cyan-300/12 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                  BOOKING OPS
                </span>
                <span className="border border-zinc-800 bg-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  <span className="admin-pulse mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  SECURE MODE
                </span>
              </div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
                Booking Control
              </h1>
              <p className="mt-3 font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-zinc-500">
                SYS_TIME: <span className="text-cyan-300">{systemTime}</span> |
                Orders, schedules, status override and deletion console
              </p>
            </div>
            <button className="group flex h-11 items-center gap-2 border border-cyan-400/60 bg-cyan-400/10 px-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/20">
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>{" "}
              EXPORT CSV
            </button>
          </div>
        </div>

        {/* Tool & Filter Bar */}
        <div
          className="admin-reveal flex flex-col gap-4 border border-zinc-800 bg-zinc-950 p-4 lg:flex-row lg:items-end"
          style={{ animationDelay: "120ms" }}
        >
          <div className="w-full lg:max-w-sm lg:flex-1">
            <label className="mb-2 block font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              QUICK FIND
            </label>
            <div className="relative flex h-11 w-full items-center border border-zinc-800 bg-black transition-colors focus-within:border-cyan-400">
              <span className="material-symbols-outlined absolute left-3 text-zinc-500">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Tìm biển số, mã đơn..."
                className="h-full w-full border-none bg-transparent pl-10 pr-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              DATE RANGE
            </label>
            <div className="relative flex h-11 w-full items-center border border-zinc-800 bg-black transition-colors focus-within:border-cyan-400 lg:w-72">
              <span className="material-symbols-outlined absolute left-3 text-zinc-500">
                calendar_month
              </span>
              <input
                type="text"
                placeholder="DD/MM/YYYY - DD/MM/YYYY"
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="h-full w-full border-none bg-transparent pl-10 pr-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              STATUS
            </label>
            <div className="relative flex h-11 w-full items-center border border-zinc-800 bg-black transition-colors focus-within:border-cyan-400 lg:w-52">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="h-full w-full cursor-pointer appearance-none border-none bg-black pl-3 pr-10 font-mono text-sm text-zinc-100 focus:ring-0"
              >
                <option className="bg-black text-zinc-100" value="all">
                  ALL STATUS
                </option>
                <option className="bg-black text-zinc-100" value="PENDING">
                  PENDING
                </option>
                <option className="bg-black text-zinc-100" value="CONFIRM">
                  CONFIRM
                </option>
                <option className="bg-black text-zinc-100" value="ARRIVED">
                  ARRIVED
                </option>
                <option className="bg-black text-zinc-100" value="IN_PROGRESS">
                  IN_PROGRESS
                </option>
                <option className="bg-black text-zinc-100" value="WASHED">
                  WASHED
                </option>
                <option className="bg-black text-zinc-100" value="COMPLETED">
                  COMPLETED
                </option>
                <option className="bg-black text-zinc-100" value="CANCELLED">
                  CANCELLED
                </option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 text-zinc-500">
                arrow_drop_down
              </span>
            </div>
          </div>
        </div>

        {actionMessage && (
          <div className="admin-reveal border border-cyan-400/40 bg-cyan-400/10 p-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
            {actionMessage}
          </div>
        )}

        <AdminBookingsTable
          bookings={bookings}
          onDeleteBooking={handleDeleteBooking}
          onEditBooking={openEditBooking}
          fetchBookingDetails={fetchBookingDetails}
          loading={loading}
        />

        {/* Pagination */}
        <div
          className="admin-reveal flex items-center justify-between py-2"
          style={{ animationDelay: "260ms" }}
        >
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
            SHOWING{" "}
            <span className="text-zinc-100">
              {bookings.length > 0
                ? (pagination.page - 1) * pagination.limit + 1
                : 0}
            </span>{" "}
            -{" "}
            <span className="text-zinc-100">
              {(pagination.page - 1) * pagination.limit + bookings.length}
            </span>{" "}
            {pagination.total !== -1 ? (
              <>
                OF <span className="text-zinc-100">{pagination.total}</span>{" "}
                RESULTS
              </>
            ) : (
              "RESULTS"
            )}
          </p>
          <div className="flex gap-1">
            <button
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              className="h-9 border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              PREV
            </button>
            <span className="flex h-9 min-w-9 items-center justify-center border border-cyan-400/60 bg-cyan-400/10 px-3 font-mono font-black text-cyan-300">
              {pagination.page}
            </span>
            <button
              disabled={
                pagination.total !== -1
                  ? pagination.total > 0 &&
                    pagination.page * pagination.limit >= pagination.total
                  : bookings.length < pagination.limit
              }
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              className="h-9 border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="admin-reveal fixed inset-y-0 right-0 z-50 flex w-full translate-x-0 transform flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300 ease-in-out md:w-[420px] lg:w-[480px]">
            <header className="shrink-0 border-b border-zinc-800 bg-black p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                      {drawerMode === "edit"
                        ? "EDIT BOOKING"
                        : "BOOKING DETAIL"}
                    </p>
                    <h2 className="font-headline-md text-headline-md text-zinc-100">
                      Chi tiết Đơn{" "}
                      {selectedBooking.bookingCode || `#${selectedBooking.id}`}
                    </h2>
                  </div>
                  <div className="flex items-center px-2 py-1 border border-secondary bg-secondary/10">
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-zinc-500 transition-colors hover:text-cyan-300"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {drawerMode === "edit" && (
                <section className="border border-cyan-400/40 bg-cyan-400/10 p-4">
                  <label className="mb-2 block font-mono text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
                    Chỉnh trạng thái
                  </label>
                  <select
                    value={selectedBooking.status || "PENDING"}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="h-11 w-full border border-zinc-700 bg-black px-3 font-mono text-sm font-bold text-zinc-100 outline-none focus:border-cyan-400"
                  >
                    <option className="bg-black text-zinc-100" value="PENDING">
                      PENDING
                    </option>
                    <option className="bg-black text-zinc-100" value="CONFIRM">
                      CONFIRM
                    </option>
                    <option className="bg-black text-zinc-100" value="ARRIVED">
                      ARRIVED
                    </option>
                    <option
                      className="bg-black text-zinc-100"
                      value="IN_PROGRESS"
                    >
                      IN_PROGRESS
                    </option>
                    <option className="bg-black text-zinc-100" value="WASHED">
                      WASHED
                    </option>
                    <option
                      className="bg-black text-zinc-100"
                      value="COMPLETED"
                    >
                      COMPLETED
                    </option>
                    <option
                      className="bg-black text-zinc-100"
                      value="CANCELLED"
                    >
                      CANCELLED
                    </option>
                  </select>
                </section>
              )}
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
                          {selectedBooking.tierLevel || "-"}
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
                        {selectedBooking.vehicleLicensePlate || "-"}
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
                    <span>{selectedBooking.service || "-"}</span>
                    <span className="font-data-display">
                      {selectedBooking.totalPrice?.toLocaleString()}đ
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
                      {selectedBooking.totalPrice?.toLocaleString()}đ
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
                          ? `PAID VIA PAYOS`
                          : selectedBooking.paymentStatus || "CASH PAYMENT"}
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
                            {selectedBooking.scheduledStartTime ||
                              `${selectedBooking.date} ${selectedBooking.time}`}
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
