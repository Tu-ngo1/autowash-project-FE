// src/pages/admin/AdminBookings.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import AdminBookingsTable from "../../components/admin/AdminBookingsTable";
import {
  approveCancelRequest,
  deleteAdminBooking,
  getAdminBooking,
  getAdminBookings,
  rejectCancelRequest,
  updateAdminBookingStatus,
} from "../../services/adminBookingApi";
import { asArrayPayload, normalizeAdminBooking } from "../../utils/adminDto";

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

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

const getBookingIsoDate = (booking) => {
  const source = booking.scheduledStartTime || booking.dateTime || booking.date;
  if (!source) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(String(source))) {
    return String(source).slice(0, 10);
  }
  return toIsoDate(String(source));
};

const getNewestValue = (item = {}) => {
  const raw =
    item.createdAt ||
    item.updatedAt ||
    item.scheduledStartTime ||
    item.dateTime ||
    item.date ||
    "";
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? Number(item.id || item.bookingId || 0) : time;
};

const sortNewestFirst = (items = []) =>
  [...items].sort((a, b) => {
    const newestDiff = getNewestValue(b) - getNewestValue(a);
    if (newestDiff !== 0) return newestDiff;
    return Number(b?.id || b?.bookingId || 0) - Number(a?.id || a?.bookingId || 0);
  });

const downloadCsv = (filename, rows) => {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [rejectAction, setRejectAction] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 10,
  });

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const { startDate, endDate } = parseDateRange(dateRange);

    return allBookings.filter((booking) => {
      const haystack = [
        booking.customerName,
        booking.customerPhone,
        booking.customerEmail,
        booking.vehicleLicensePlate,
        booking.plate,
        booking.vehicleModel,
        booking.service,
        ...(booking.services || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !keyword || haystack.includes(keyword);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "cancel_pending" &&
          String(booking.cancelRequestStatus || "").toUpperCase() ===
            "PENDING") ||
        String(booking.status || "").toUpperCase() ===
          statusFilter.toUpperCase();

      const bookingDate = getBookingIsoDate(booking);
      const matchDate =
        !startDate ||
        (bookingDate &&
          bookingDate >= startDate &&
          bookingDate <= (endDate || startDate));

      return matchSearch && matchStatus && matchDate;
    });
  }, [allBookings, dateRange, search, statusFilter]);

  const bookings = useMemo(() => {
    if (isClientSide) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      return filteredBookings.slice(startIndex, startIndex + pagination.limit);
    }
    return filteredBookings;
  }, [
    filteredBookings,
    isClientSide,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    if (!isClientSide) return;
    setPagination((prev) => ({ ...prev, total: filteredBookings.length }));
  }, [filteredBookings.length, isClientSide]);

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
        status:
          statusFilter !== "all" && statusFilter !== "cancel_pending"
            ? statusFilter
            : undefined,
        cancelRequestStatus:
          statusFilter === "cancel_pending" ? "PENDING" : undefined,
        search: search || undefined,
        ...parseDateRange(dateRange),
      });
      const payload = res.data?.data ?? res.data ?? {};
      const apiItems = asArrayPayload(res, ["bookings", "items", "data"]);
      const items = sortNewestFirst(apiItems.map(normalizeAdminBooking));

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
      setPagination((prev) => ({ ...prev, total: 0 }));
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

  const handleDeleteBooking = (booking) => {
    const id = booking.id || booking.bookingId;
    if (!id) return;
    setActionNote("");
    setConfirmAction({
      type: "delete",
      booking,
      title: "Xóa vĩnh viễn đơn đặt lịch",
      message:
        "Hành động này sẽ xóa vĩnh viễn đơn đặt lịch khỏi hệ thống. Bạn có chắc chắn muốn xóa?",
      confirmLabel: "Xóa đơn",
    });
  };

  const handleDirectCancel = (booking) => {
    setActionNote("");
    setConfirmAction({
      type: "direct-cancel",
      booking,
      title: "Hủy đơn đặt lịch",
      message:
        "Bạn có chắc chắn muốn hủy trực tiếp đơn đặt lịch này? Hệ thống sẽ cập nhật trạng thái đơn thành ĐÃ HỦY và tự động hoàn tiền vào ví khách hàng (nếu có).",
      confirmLabel: "Xác nhận Hủy đơn",
    });
  };

  const executeDeleteBooking = async (booking) => {
    const id = booking.id || booking.bookingId;
    if (!id) return;
    setActionMessage("");
    setActionLoading(true);
    try {
      await deleteAdminBooking(id);
      setActionMessage("ĐÃ XÓA ĐƠN ĐẶT LỊCH");
    } catch {
      setActionMessage("XÓA TRÊN API THẤT BẠI, ĐÃ ẨN KHỎI DANH SÁCH CỤC BỘ");
    }
    setAllBookings((current) =>
      current.filter((item) => (item.id || item.bookingId) !== id)
    );
    setActionLoading(false);
    setConfirmAction(null);
  };

  const executeDirectCancel = async (booking, note) => {
    const id = booking.id || booking.bookingId;
    if (!id) return;
    setActionLoading(true);
    setActionMessage("");
    try {
      await updateAdminBookingStatus(id, "CANCELLED", note);
      setActionMessage("ĐÃ HỦY ĐƠN ĐẶT LỊCH THÀNH CÔNG");
      await fetchBookings();
    } catch {
      setActionMessage("KHÔNG THỂ HỦY ĐƠN ĐẶT LỊCH");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setActionNote("");
    }
  };

  const handleApproveCancelRequest = (booking) => {
    setActionNote("");
    setConfirmAction({
      type: "approve-cancel",
      booking,
      title: "Duyệt yêu cầu hủy đơn",
      message:
        "Bạn có chắc chắn muốn duyệt yêu cầu hủy lịch đặt này? Khách hàng sẽ được hoàn lại 100% tiền vào ví.",
      confirmLabel: "Duyệt hủy đơn",
    });
  };

  const executeApproveCancelRequest = async (booking, note) => {
    const id = booking.id || booking.bookingId;
    if (!id) return;
    setActionLoading(true);
    setActionMessage("");
    try {
      await approveCancelRequest(id, note);
      setActionMessage("ĐÃ DUYỆT YÊU CẦU HỦY ĐƠN");
      await fetchBookings();
    } catch {
      setActionMessage("KHÔNG THỂ DUYỆT YÊU CẦU HỦY");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setActionNote("");
    }
  };

  const handleRejectCancelRequest = (booking) => {
    setRejectAction(booking);
    setRejectNote("");
  };

  const executeRejectCancelRequest = async () => {
    const id = rejectAction?.id || rejectAction?.bookingId;
    if (!id) return;
    setActionLoading(true);
    setActionMessage("");
    try {
      await rejectCancelRequest(id, rejectNote);
      setActionMessage("ĐÃ BÁC BỎ YÊU CẦU HỦY");
      await fetchBookings();
    } catch {
      setActionMessage("KHÔNG THỂ BÁC BỎ YÊU CẦU HỦY");
    } finally {
      setActionLoading(false);
      setRejectAction(null);
      setRejectNote("");
    }
  };

  const exportBookings = () => {
    downloadCsv("admin-bookings.csv", [
      [
        "Mã đơn",
        "Customer",
        "Số điện thoại",
        "Biển số",
        "Dịch vụ",
        "Trạng thái",
        "Phương thức thanh toán",
        "Trạng thái thanh toán",
        "Ngày",
        "Tổng tiền",
      ],
      ...filteredBookings.map((booking) => [
        booking.bookingCode || booking.code,
        booking.customerName,
        booking.customerPhone,
        booking.vehicleLicensePlate || booking.plate,
        booking.service || booking.services?.join("; "),
        booking.status,
        booking.paymentMethod,
        booking.paymentStatus,
        booking.scheduledStartTime || `${booking.date} ${booking.time}`,
        booking.finalPrice ?? booking.totalPrice ?? booking.total,
      ]),
    ]);
    setActionMessage("ĐÃ XUẤT CSV");
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
      setActionMessage("ĐÃ CẬP NHẬT TRẠNG THÁI");
    } catch {
      setActionMessage("ĐÃ CẬP NHẬT CỤC BỘ, API CHƯA NHẬN");
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
                  CHẾ ĐỘ BẢO MẬT
                </span>
              </div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
                Quản lý đơn đặt lịch
              </h1>
              <p className="mt-3 font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-zinc-500">
                SYS_TIME: <span className="text-cyan-300">{systemTime}</span> |
                Đơn đặt lịch, lịch hẹn, cập nhật trạng thái và thao tác xóa
              </p>
            </div>
            <button
              type="button"
              onClick={exportBookings}
              className="group flex h-11 items-center gap-2 border border-cyan-400/60 bg-cyan-400/10 px-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/20"
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>{" "}
              Xuất CSV
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
              TÌM NHANH
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
                placeholder="Tìm tên khách hàng, số điện thoại, biển số xe..."
                className="h-full w-full border-none bg-transparent pl-10 pr-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              KHOẢNG NGÀY
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
              TRẠNG THÁI
            </label>
            <div className="relative flex h-11 w-full items-center border border-zinc-800 bg-black transition-colors focus-within:border-cyan-400 lg:w-52">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="h-full w-full appearance-none border-none bg-transparent pl-3 pr-8 font-mono text-xs font-bold uppercase text-zinc-100 outline-none focus:ring-0"
              >
                <option className="bg-black text-zinc-100" value="all">
                  TẤT CẢ TRẠNG THÁI
                </option>
                <option className="bg-black text-amber-300 font-bold" value="cancel_pending">
                  ⚠️ CHỜ DUYỆT HỦY
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
          pagination={pagination}
          onDeleteBooking={handleDeleteBooking}
          onCancelBooking={handleDirectCancel}
          onEditBooking={openEditBooking}
          onApproveCancelRequest={handleApproveCancelRequest}
          onRejectCancelRequest={handleRejectCancelRequest}
          fetchBookingDetails={fetchBookingDetails}
          loading={loading}
        />

        {/* Pagination */}
        <div
          className="admin-reveal flex items-center justify-between py-2"
          style={{ animationDelay: "260ms" }}
        >
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
            ĐANG HIỂN THỊ{" "}
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
                TRONG <span className="text-zinc-100">{pagination.total}</span>{" "}
                KẾT QUẢ
              </>
            ) : (
              "KẾT QUẢ"
            )}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <button
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              className="h-9 border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              TRƯỚC
            </button>
            {(() => {
              const totalPages =
                pagination.total > 0
                  ? Math.ceil(pagination.total / pagination.limit)
                  : isClientSide
                  ? Math.ceil(filteredBookings.length / pagination.limit)
                  : 1;

              const pageItems = getPageNumbers(pagination.page, Math.max(1, totalPages));

              return pageItems.map((item, idx) => {
                if (item === "...") {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="flex h-9 w-7 items-center justify-center font-mono text-xs font-bold text-zinc-600 select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = item === pagination.page;

                return (
                  <button
                    key={`page-${item}`}
                    onClick={() => setPagination((prev) => ({ ...prev, page: item }))}
                    className={`h-9 min-w-9 px-2 font-mono text-xs font-black transition ${
                      isActive
                        ? "border border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        : "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {item}
                  </button>
                );
              });
            })()}
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
              className="h-9 border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              SAU
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
                        ? "SỬA ĐƠN"
                        : "CHI TIẾT ĐƠN"}
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
              {selectedBooking.cancelRequestStatus && (
                <section className="border border-amber-300/40 bg-amber-300/10 p-4">
                  <h3 className="mb-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
                    Yêu cầu hủy
                  </h3>
                  <div className="space-y-3 text-sm text-zinc-200">
                    <div>
                      <span className="text-zinc-500">Trạng thái: </span>
                      <span className="font-mono font-black uppercase text-amber-200">
                        {selectedBooking.cancelRequestStatus}
                      </span>
                    </div>
                    {selectedBooking.cancelRequestReason && (
                      <div>
                        <span className="text-zinc-500">Lý do Staff: </span>
                        <span>{selectedBooking.cancelRequestReason}</span>
                      </div>
                    )}
                    {selectedBooking.cancelRequestedByName && (
                      <div>
                        <span className="text-zinc-500">Người yêu cầu: </span>
                        <span>{selectedBooking.cancelRequestedByName}</span>
                      </div>
                    )}
                    {selectedBooking.cancelRequestedAt && (
                      <div>
                        <span className="text-zinc-500">Thời gian: </span>
                        <span>{new Date(selectedBooking.cancelRequestedAt).toLocaleString("vi-VN")}</span>
                      </div>
                    )}
                    {selectedBooking.cancelRequestAdminNote && (
                      <div>
                        <span className="text-zinc-500">Ghi chú Admin: </span>
                        <span>{selectedBooking.cancelRequestAdminNote}</span>
                      </div>
                    )}
                  </div>
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
                      Biển số xe
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
                    CHI TIẾT THANH TOÁN
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center text-on-surface">
                    <span>{selectedBooking.service || "-"}</span>
                    <span className="font-data-display">
                        {(selectedBooking.totalPrice ?? 0).toLocaleString()}đ
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
                      {(
                        selectedBooking.finalPrice ??
                        selectedBooking.totalPrice ??
                        0
                      ).toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {(() => {
                      const rawPayStatus = String(selectedBooking.paymentStatus || "").toUpperCase();
                      const rawPayMethod = String(selectedBooking.paymentMethod || "").toUpperCase();
                      const isPaid = rawPayStatus === "PAID";
                      const isRefunded = rawPayStatus === "REFUNDED";
                      const isFailed = rawPayStatus === "FAILED" || rawPayStatus === "CANCELLED";

                      let badgeClass = "bg-amber-500/10 border-amber-500/30 text-amber-400";
                      let icon = "pending";
                      let text = `CHƯA THANH TOÁN ${rawPayMethod ? `(${rawPayMethod})` : ""}`;

                      if (isPaid) {
                        badgeClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                        icon = "check_circle";
                        text = rawPayMethod === "PAYOS" ? "ĐÃ THANH TOÁN QUA PAYOS" : `ĐÃ THANH TOÁN (${rawPayMethod || "TIỀN MẶT"})`;
                      } else if (isRefunded) {
                        badgeClass = "bg-purple-500/10 border-purple-500/30 text-purple-300";
                        icon = "undo";
                        text = `ĐÃ HOÀN TIỀN ${rawPayMethod ? `(${rawPayMethod})` : ""}`;
                      } else if (isFailed) {
                        badgeClass = "bg-red-500/10 border-red-500/30 text-red-400";
                        icon = "cancel";
                        text = `THANH TOÁN THẤT BẠI ${rawPayMethod ? `(${rawPayMethod})` : ""}`;
                      } else {
                        if (rawPayMethod === "PAYOS") {
                          text = "CHƯA THANH TOÁN (PAYOS)";
                        } else if (rawPayMethod === "CASH") {
                          text = "CHƯA THANH TOÁN (TIỀN MẶT)";
                        }
                      }

                      return (
                        <div className={`inline-flex items-center px-3 py-1 border rounded-full ${badgeClass}`}>
                          <span className="material-symbols-outlined text-[16px] mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {icon}
                          </span>
                          <span className="text-[10px] font-bold tracking-widest uppercase">
                            {text}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Operational Timeline */}
              <div className="bg-surface-container-low border border-outline-variant">
                <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-highest">
                  <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                    NHẬT KÝ XỬ LÝ
                  </h3>
                </div>
                <div className="p-5">
                  <div className="relative pl-6 border-l border-outline-variant space-y-6 pb-2">
                    {/* 1. Tạo đơn đặt lịch */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-surface-container-low"></div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-on-surface">
                            Tạo đơn đặt lịch
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {selectedBooking.createdAt
                              ? formatDateTime(selectedBooking.createdAt)
                              : `${selectedBooking.date || ""} ${selectedBooking.time || ""}`}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Giờ hẹn rửa: {selectedBooking.scheduledStartTime ? formatDateTime(selectedBooking.scheduledStartTime) : `${selectedBooking.date || ""} ${selectedBooking.time || ""}`}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-cyan-400 text-[18px]">
                          event_available
                        </span>
                      </div>
                    </div>

                    {/* 2. Check-in QR */}
                    {(selectedBooking.arrivedAt || ["ARRIVED", "IN_PROGRESS", "WASHED", "COMPLETED"].includes(String(selectedBooking.status).toUpperCase())) && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-surface-container-low"></div>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-medium text-on-surface">
                              Check-in QR
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {selectedBooking.arrivedAt
                                ? formatDateTime(selectedBooking.arrivedAt)
                                : selectedBooking.time}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-cyan-400 text-[18px]">
                            qr_code_scanner
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 3. Bắt đầu rửa xe */}
                    {(selectedBooking.washStartedAt || ["IN_PROGRESS", "WASHED", "COMPLETED"].includes(String(selectedBooking.status).toUpperCase())) && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-surface-container-low"></div>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-medium text-on-surface">
                              Đưa vào khoang rửa {selectedBooking.bayNumber ? `#${selectedBooking.bayNumber}` : ""}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {selectedBooking.washStartedAt
                                ? formatDateTime(selectedBooking.washStartedAt)
                                : "-"}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-cyan-400 text-[18px]">
                            local_car_wash
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 4. Hoàn tất & Giao xe */}
                    {(String(selectedBooking.status).toUpperCase() === "COMPLETED" || selectedBooking.completedAt) && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface-container-low"></div>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-emerald-400 font-medium">
                              Hoàn tất & Giao xe
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {selectedBooking.completedAt
                                ? formatDateTime(selectedBooking.completedAt)
                                : "-"}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-emerald-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            task_alt
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 5. Gửi yêu cầu hủy (nếu có) */}
                    {(selectedBooking.cancelRequestedAt || selectedBooking.cancelRequestStatus) && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-surface-container-low"></div>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-amber-300 font-medium">
                              Yêu cầu hủy ({selectedBooking.cancelRequestStatus})
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {selectedBooking.cancelRequestedAt
                                ? formatDateTime(selectedBooking.cancelRequestedAt)
                                : "-"}
                            </div>
                            {selectedBooking.cancelRequestedByName && (
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                Người yêu cầu: {selectedBooking.cancelRequestedByName}
                              </div>
                            )}
                            {selectedBooking.cancelRequestReason && (
                              <div className="text-[10px] text-amber-200/80 mt-0.5">
                                Lý do: {selectedBooking.cancelRequestReason}
                              </div>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-amber-400 text-[18px]">
                            history_toggle_off
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 6. Đã hủy đơn */}
                    {String(selectedBooking.status).toUpperCase() === "CANCELLED" && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-surface-container-low"></div>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-red-400 font-medium">
                              Đã hủy đơn
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {selectedBooking.cancelRequestedAt
                                ? formatDateTime(selectedBooking.cancelRequestedAt)
                                : selectedBooking.updatedAt
                                ? formatDateTime(selectedBooking.updatedAt)
                                : "-"}
                            </div>
                            {selectedBooking.cancelRequestAdminNote && (
                              <div className="text-[10px] text-red-300/80 mt-0.5">
                                Ghi chú Admin: {selectedBooking.cancelRequestAdminNote}
                              </div>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-red-400 text-[18px]">
                            cancel
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
      {confirmAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !actionLoading && setConfirmAction(null)}
        >
          <div
            className="w-full max-w-lg border border-cyan-400/30 bg-zinc-950 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-4xl text-amber-300">
                warning
              </span>
              <div className="w-full min-w-0">
                <h3 className="font-mono text-xl font-black uppercase text-zinc-50">
                  {confirmAction.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
                  {confirmAction.message}
                </p>
                <p className="mt-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  {confirmAction.booking?.bookingCode ||
                    `#${confirmAction.booking?.id || ""}`}{" "}
                  • {confirmAction.booking?.vehicleLicensePlate || "-"}
                </p>
                {(confirmAction.type === "approve-cancel" || confirmAction.type === "direct-cancel") && (
                  <div className="mt-4">
                    <label className="block mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Ghi chú Admin / Lý do (Không bắt buộc)
                    </label>
                    <textarea
                      rows={2}
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder={
                        confirmAction.type === "approve-cancel"
                          ? "Ghi chú duyệt hủy..."
                          : "Lý do hủy đơn..."
                      }
                      className="w-full bg-black border border-zinc-700 p-2.5 font-mono text-xs font-semibold text-zinc-100 outline-none focus:border-cyan-400"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setConfirmAction(null);
                  setActionNote("");
                }}
                className="border border-zinc-700 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-400 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  if (confirmAction.type === "approve-cancel") {
                    executeApproveCancelRequest(confirmAction.booking, actionNote);
                  } else if (confirmAction.type === "direct-cancel") {
                    executeDirectCancel(confirmAction.booking, actionNote);
                  } else {
                    executeDeleteBooking(confirmAction.booking);
                  }
                }}
                className="border border-cyan-400/50 bg-cyan-400/15 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-200 transition hover:bg-cyan-400/25 disabled:opacity-50"
              >
                {actionLoading ? "Đang xử lý..." : confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      {rejectAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !actionLoading && setRejectAction(null)}
        >
          <div
            className="w-full max-w-lg border border-amber-300/30 bg-zinc-950 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-mono text-xl font-black uppercase text-zinc-50">
              Bác bỏ yêu cầu hủy
            </h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
              Nhập ghi chú phản hồi cho Staff nếu cần.
            </p>
            <textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              rows={4}
              className="mt-5 w-full border border-zinc-700 bg-black p-3 text-sm font-semibold text-zinc-100 outline-none focus:border-amber-300"
              placeholder="Ghi chú phản hồi..."
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setRejectAction(null)}
                className="border border-zinc-700 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-400 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={executeRejectCancelRequest}
                className="border border-amber-300/50 bg-amber-300/15 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-amber-200 transition hover:bg-amber-300/25 disabled:opacity-50"
              >
                {actionLoading ? "Đang xử lý..." : "Bác bỏ yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
