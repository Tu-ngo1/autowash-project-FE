const STATUS_STYLES = {
  COMPLETED: "border-emerald-400/50 text-emerald-300 bg-emerald-400/10",
  PENDING:
    "border-zinc-700 text-zinc-400 bg-zinc-900",
  "IN PROGRESS": "border-cyan-400/50 text-cyan-300 bg-cyan-400/10",
  IN_PROGRESS: "border-cyan-400/50 text-cyan-300 bg-cyan-400/10",
  CONFIRM: "border-yellow-300/50 text-yellow-200 bg-yellow-300/10",
  ARRIVED: "border-cyan-400/50 text-cyan-300 bg-cyan-400/10",
  WASHED: "border-emerald-400/50 text-emerald-300 bg-emerald-400/10",
  WASHING: "border-cyan-400/50 text-cyan-300 bg-cyan-400/10",
  CANCELLED: "border-red-400/50 text-red-300 bg-red-400/10",
};

function PaymentBadge({ method, status }) {
  const normalizedMethod = String(method || "UNPAID").toUpperCase();
  const normalizedStatus = String(status || "PENDING").toUpperCase();
  const isPaid = normalizedStatus === "PAID";

  let text = normalizedMethod;
  if (normalizedMethod === "PAYOS") {
    text = isPaid ? "PAYOS (PAID)" : "PAYOS (UNPAID)";
  } else if (normalizedMethod === "CASH") {
    text = isPaid ? "CASH (PAID)" : "CASH (UNPAID)";
  } else if (normalizedMethod === "UNPAID") {
    text = "UNPAID";
  }

  const styleClass = isPaid
    ? "border-emerald-400/50 text-emerald-300 bg-emerald-400/10"
    : normalizedMethod === "PAYOS"
      ? "border-cyan-400/50 text-cyan-300 bg-cyan-400/10"
      : "border-zinc-700 text-zinc-400 bg-zinc-900";

  return (
    <span
      className={`inline-block border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${styleClass}`}
    >
      {text}
    </span>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "PENDING").toUpperCase();
  const label = normalizedStatus.replaceAll("_", " ");
  return (
    <span
      className={`inline-block border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${STATUS_STYLES[normalizedStatus] || STATUS_STYLES.PENDING}`}
    >
      {label}
    </span>
  );
}

function CancelRequestBadge({ status }) {
  const normalizedStatus = String(status || "").toUpperCase();
  if (!normalizedStatus) return null;
  const styles = {
    PENDING: "border-amber-300/50 text-amber-200 bg-amber-300/10",
    APPROVED: "border-emerald-400/50 text-emerald-300 bg-emerald-400/10",
    REJECTED: "border-red-400/50 text-red-300 bg-red-400/10",
  };
  const labels = {
    PENDING: "Chờ duyệt hủy",
    APPROVED: "Đã duyệt hủy",
    REJECTED: "Bác bỏ yêu cầu hủy",
  };
  return (
    <span
      className={`inline-block border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] ${styles[normalizedStatus] || styles.PENDING}`}
    >
      {labels[normalizedStatus] || normalizedStatus}
    </span>
  );
}

const canDeleteBooking = (booking) =>
  String(booking?.status || "").toUpperCase() !== "COMPLETED" &&
  String(booking?.cancelRequestStatus || "").toUpperCase() !== "PENDING";

export default function AdminBookingsTable({
  bookings,
  fetchBookingDetails,
  loading,
  onDeleteBooking,
  onEditBooking,
  onApproveCancelRequest,
  onRejectCancelRequest,
}) {
  if (loading) {
    return (
      <div className="admin-reveal border border-zinc-800 bg-zinc-950 py-14 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="admin-reveal border border-zinc-800 bg-zinc-950 py-14 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {bookings.map((booking) => {
          const bookingId = booking.id || booking.bookingId || booking._id;
          return (
          <button
            key={bookingId}
            type="button"
            onClick={() => fetchBookingDetails(bookingId)}
            className="admin-reveal border border-zinc-800 bg-zinc-950 p-4 text-left transition hover:-translate-y-1 hover:border-cyan-400/60 hover:bg-[#071014]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono font-black text-cyan-300">
                  {booking.bookingCode || booking.code || `#B-${bookingId}`}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                  {booking.customerName || "-"}
                </p>
                <p className="font-mono text-xs text-zinc-500">
                  {booking.vehicleLicensePlate || booking.plate || "-"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                <StatusBadge status={booking.status} />
                <CancelRequestBadge status={booking.cancelRequestStatus} />
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between gap-3">
                <span>Thời gian</span>
                <span className="text-right font-mono text-zinc-100">
                  {booking.date || "-"} {booking.time || ""}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Dịch vụ</span>
                <span className="text-right text-zinc-100">
                  {booking.service || booking.services?.join(", ") || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Thanh toán</span>
                <PaymentBadge method={booking.paymentMethod} status={booking.paymentStatus} />
              </div>
              <div className="flex justify-between gap-3 border-t border-zinc-800 pt-2">
                <span>Tổng tiền</span>
                <span className="font-mono font-black text-zinc-100">
                  {(booking.finalPrice ?? booking.totalPrice ?? booking.total ?? 0).toLocaleString()} ₫
                </span>
              </div>
              <div className="flex gap-2 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditBooking?.(booking);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Sửa
                </button>
                {canDeleteBooking(booking) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteBooking?.(booking);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 border border-red-400/50 bg-red-400/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-red-300"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      delete
                    </span>
                    Xóa
                  </button>
                )}
                {String(booking.cancelRequestStatus || "").toUpperCase() === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onApproveCancelRequest?.(booking);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 border border-emerald-400/50 bg-emerald-400/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300"
                    >
                      Duyệt hủy
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRejectCancelRequest?.(booking);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 border border-amber-400/50 bg-amber-400/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-amber-200"
                    >
                      Từ chối
                    </button>
                  </>
                )}
              </div>
            </div>
          </button>
        );
        })}
      </div>

      <div className="admin-reveal hidden w-full overflow-hidden border border-zinc-800 bg-zinc-950 lg:block" style={{ animationDelay: "200ms" }}>
        <table className="w-full table-fixed border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-black shadow-[0_1px_0_0_rgba(34,211,238,0.25)]">
            <tr>
              <th className="w-32 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                MÃ ĐƠN
              </th>
              <th className="w-36 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                THỜI GIAN
              </th>
              <th className="whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                KHÁCH HÀNG & XE
              </th>
              <th className="whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                DỊCH VỤ
              </th>
              <th className="w-40 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                THANH TOÁN
              </th>
              <th className="w-36 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                TRẠNG THÁI
              </th>
              <th className="w-28 whitespace-nowrap px-3 py-3 text-right font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                TỔNG TIỀN
              </th>
              <th className="w-32 whitespace-nowrap px-3 py-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                THAO TÁC
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {bookings.map((booking, index) => {
              const bookingId = booking.id || booking.bookingId || booking._id;
              return (
              <tr
                key={bookingId}
                className="admin-reveal cursor-pointer border-b border-zinc-900 transition duration-200 hover:translate-x-1 hover:bg-cyan-400/[0.04]"
                style={{ animationDelay: `${260 + index * 40}ms` }}
                onClick={() => fetchBookingDetails(bookingId)}
              >
                <td className="whitespace-nowrap px-3 py-3 align-middle">
                  <span className="font-black text-cyan-300">
                    {booking.bookingCode || booking.code || `#B-${bookingId}`}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-middle">
                  <span className="text-zinc-100">
                    {booking.date || "-"}
                  </span>
                  <span className="ml-1 text-zinc-500">
                    {booking.time || ""}
                  </span>
                </td>
                <td
                  className="truncate whitespace-nowrap px-3 py-3 align-middle"
                  title={`${booking.customerName || "-"} • ${booking.vehicleLicensePlate || booking.plate || "-"}`}
                >
                  <span className="font-semibold text-zinc-100">
                    {booking.customerName}
                  </span>
                  <span className="ml-1 text-zinc-500">
                    • {booking.vehicleLicensePlate || booking.plate || "-"}
                  </span>
                </td>
                <td
                  className="truncate whitespace-nowrap px-3 py-3 align-middle text-zinc-300"
                  title={booking.service || booking.services?.join(", ")}
                >
                  {booking.service || booking.services?.join(", ") || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-middle">
                  <PaymentBadge method={booking.paymentMethod} status={booking.paymentStatus} />
                </td>
                <td className="px-3 py-3 align-middle">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={booking.status} />
                    <CancelRequestBadge status={booking.cancelRequestStatus} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right align-middle">
                  <span className="font-black text-zinc-100">
                    {(booking.finalPrice ?? booking.totalPrice ?? booking.total ?? 0).toLocaleString()} ₫
                  </span>
                </td>
                <td className="px-3 py-3 text-center align-middle">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditBooking?.(booking);
                      }}
                      className="flex h-8 w-8 items-center justify-center border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20"
                      title="Chỉnh sửa booking"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        edit
                      </span>
                    </button>
                    {canDeleteBooking(booking) && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteBooking?.(booking);
                        }}
                        className="flex h-8 w-8 items-center justify-center border border-red-400/40 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                        title="Xóa booking"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          delete
                        </span>
                      </button>
                    )}
                    {String(booking.cancelRequestStatus || "").toUpperCase() === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onApproveCancelRequest?.(booking);
                          }}
                          className="flex h-8 w-8 items-center justify-center border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 transition hover:bg-emerald-400/20"
                          title="Duyệt yêu cầu hủy"
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            check
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRejectCancelRequest?.(booking);
                          }}
                          className="flex h-8 w-8 items-center justify-center border border-amber-400/40 bg-amber-400/10 text-amber-200 transition hover:bg-amber-400/20"
                          title="Bác bỏ yêu cầu hủy"
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            close
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
