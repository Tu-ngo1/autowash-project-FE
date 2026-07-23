import { formatLicensePlate } from "../../utils/licensePlate";

const STATUS_STYLES = {
  COMPLETED: "border-emerald-400/50 text-emerald-300 bg-emerald-400/10",
  PENDING: "border-amber-400/50 text-amber-300 bg-amber-400/10",
  "IN PROGRESS": "border-blue-400/50 text-blue-300 bg-blue-400/10",
  IN_PROGRESS: "border-blue-400/50 text-blue-300 bg-blue-400/10",
  CONFIRM: "border-cyan-400/50 text-cyan-300 bg-cyan-400/10",
  ARRIVED: "border-sky-400/50 text-sky-300 bg-sky-400/10",
  WASHED: "border-emerald-400/50 text-emerald-300 bg-emerald-400/10",
  WASHING: "border-blue-400/50 text-blue-300 bg-blue-400/10",
  CANCEL_REQUESTED: "border-orange-400/50 text-orange-300 bg-orange-400/10",
  CANCELLED: "border-red-400/50 text-red-300 bg-red-400/10",
};

const STATUS_LABELS = {
  PENDING: "CHỜ XÁC NHẬN",
  CONFIRM: "ĐÃ XÁC NHẬN",
  ARRIVED: "ĐÃ CHECK-IN",
  WASHING: "ĐANG RỬA",
  IN_PROGRESS: "ĐANG RỬA",
  "IN PROGRESS": "ĐANG RỬA",
  WASHED: "ĐÃ RỬA XONG",
  COMPLETED: "HOÀN THÀNH",
  CANCEL_REQUESTED: "YÊU CẦU HỦY",
  CANCELLED: "ĐÃ HỦY",
};

function PaymentBadge({ method, status }) {
  const normalizedMethod = String(method || "UNPAID").toUpperCase();
  const normalizedStatus = String(status || "PENDING").toUpperCase();
  const isPaid = normalizedStatus === "PAID";

  let text = normalizedMethod;
  let icon = null;
  let styleClass = "border-zinc-700 text-zinc-400 bg-zinc-900";

  if (normalizedMethod === "PAYOS") {
    text = isPaid ? "PAYOS (ĐÃ TT)" : "PAYOS (CHƯA TT)";
    icon = "credit_card";
    styleClass = isPaid
      ? "border-purple-400/50 text-purple-300 bg-purple-400/10"
      : "border-amber-400/50 text-amber-300 bg-amber-400/10";
  } else if (normalizedMethod === "CASH" || normalizedMethod.includes("TIỀN MẶT")) {
    text = isPaid ? "TIỀN MẶT (ĐÃ TT)" : "TIỀN MẶT (CHƯA TT)";
    icon = "payments";
    styleClass = isPaid
      ? "border-emerald-400/50 text-emerald-300 bg-emerald-400/10"
      : "border-amber-400/50 text-amber-300 bg-amber-400/10";
  } else {
    text = isPaid ? `${normalizedMethod} (ĐÃ TT)` : `${normalizedMethod} (CHƯA TT)`;
    styleClass = isPaid
      ? "border-emerald-400/50 text-emerald-300 bg-emerald-400/10"
      : "border-amber-400/50 text-amber-300 bg-amber-400/10";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wide ${styleClass}`}
    >
      {icon && <span className="material-symbols-outlined text-[12px]">{icon}</span>}
      {text}
    </span>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "PENDING").toUpperCase();
  const label = STATUS_LABELS[normalizedStatus] || normalizedStatus.replaceAll("_", " ");
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wide ${STATUS_STYLES[normalizedStatus] || STATUS_STYLES.PENDING}`}
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
      className={`inline-block border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${styles[normalizedStatus] || styles.PENDING}`}
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
  pagination = { page: 1, limit: 10 },
  fetchBookingDetails,
  loading,
  onDeleteBooking,
  onCancelBooking,
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
        {bookings.map((booking, index) => {
          const bookingId = booking.id || booking.bookingId || booking._id;
          const plate = formatLicensePlate(booking.vehicleLicensePlate || booking.plate || "");
          const sttNumber = ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1;
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
                  #{sttNumber}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                  {booking.customerName || "-"}
                </p>
                <p className="font-mono text-xs text-zinc-500">
                  {plate || "-"}
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
              {(() => {
                const normStatus = String(booking.status || "").toUpperCase();
                const isCancelPending = String(booking.cancelRequestStatus || "").toUpperCase() === "PENDING";

                if (normStatus === "CANCELLED" || normStatus === "COMPLETED") {
                  return null;
                }

                if (isCancelPending) {
                  return (
                    <div className="flex gap-2 border-t border-zinc-800 pt-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onApproveCancelRequest?.(booking);
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 border border-emerald-400/50 bg-emerald-400/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-400/20"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Xác nhận
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRejectCancelRequest?.(booking);
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 border border-rose-400/50 bg-rose-400/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-rose-300 transition hover:bg-rose-400/20"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        Từ chối
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="flex gap-2 border-t border-zinc-800 pt-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCancelBooking?.(booking);
                      }}
                      className="flex flex-1 items-center justify-center gap-1.5 border border-rose-400/50 bg-rose-400/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-rose-300 transition hover:bg-rose-400/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      Hủy đơn
                    </button>
                  </div>
                );
              })()}
            </div>
          </button>
        );
        })}
      </div>

      <div className="admin-reveal hidden w-full overflow-hidden border border-zinc-800 bg-zinc-950 lg:block overflow-x-auto custom-scrollbar" style={{ animationDelay: "200ms" }}>
        <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-black shadow-[0_1px_0_0_rgba(34,211,238,0.25)]">
            <tr>
              <th className="w-[50px] whitespace-nowrap px-2 py-3 text-center font-mono text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                NO.
              </th>
              <th className="w-[110px] whitespace-nowrap px-2 py-3 font-mono text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                THỜI GIAN
              </th>
              <th className="w-[20%] whitespace-nowrap px-2 py-3 font-mono text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                KHÁCH HÀNG & XE
              </th>
              <th className="w-[16%] whitespace-nowrap px-2 py-3 font-mono text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                DỊCH VỤ
              </th>
              <th className="w-[160px] whitespace-nowrap px-2 py-3 font-mono text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                THANH TOÁN
              </th>
              <th className="w-[125px] whitespace-nowrap px-2 py-3 font-mono text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                TRẠNG THÁI
              </th>
              <th className="w-[100px] whitespace-nowrap px-2 py-3 text-right font-mono text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                TỔNG TIỀN
              </th>
              <th className="w-[105px] whitespace-nowrap px-2 py-3 text-center font-mono text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                THAO TÁC
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {bookings.map((booking, index) => {
              const bookingId = booking.id || booking.bookingId || booking._id;
              const plate = formatLicensePlate(booking.vehicleLicensePlate || booking.plate || "");
              return (
              <tr
                key={bookingId}
                className="admin-reveal cursor-pointer border-b border-zinc-900 transition duration-200 hover:translate-x-1 hover:bg-cyan-400/[0.04]"
                style={{ animationDelay: `${260 + index * 40}ms` }}
                onClick={() => fetchBookingDetails(bookingId)}
              >
                <td className="whitespace-nowrap px-2 py-2.5 text-center align-middle font-mono font-black text-cyan-300">
                  {((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 align-middle">
                  <span className="text-zinc-100">
                    {booking.date || "-"}
                  </span>
                  <span className="ml-1 text-zinc-500">
                    {booking.time || ""}
                  </span>
                </td>
                <td
                  className="truncate whitespace-nowrap px-2 py-2.5 align-middle"
                  title={`${booking.customerName || "-"} • ${plate || "-"}`}
                >
                  <span className="font-semibold text-zinc-100">
                    {booking.customerName}
                  </span>
                  <span className="ml-1 text-zinc-500">
                    • {plate || "-"}
                  </span>
                </td>
                <td
                  className="truncate whitespace-nowrap px-2 py-2.5 align-middle text-zinc-300"
                  title={booking.service || booking.services?.join(", ")}
                >
                  {booking.service || booking.services?.join(", ") || "-"}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 align-middle">
                  <PaymentBadge method={booking.paymentMethod} status={booking.paymentStatus} />
                </td>
                <td className="px-2 py-2.5 align-middle">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={booking.status} />
                    <CancelRequestBadge status={booking.cancelRequestStatus} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right align-middle">
                  <span className="font-black text-zinc-100">
                    {(booking.finalPrice ?? booking.totalPrice ?? booking.total ?? 0).toLocaleString()} ₫
                  </span>
                </td>
                <td className="px-2 py-2.5 text-center align-middle">
                  {(() => {
                    const normStatus = String(booking.status || "").toUpperCase();
                    const isCancelPending = String(booking.cancelRequestStatus || "").toUpperCase() === "PENDING";

                    if (normStatus === "CANCELLED" || normStatus === "COMPLETED") {
                      return <span className="font-mono text-xs font-semibold text-zinc-600">—</span>;
                    }

                    if (isCancelPending) {
                      return (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onApproveCancelRequest?.(booking);
                            }}
                            className="flex h-7 items-center gap-1 border border-emerald-400/50 bg-emerald-400/10 px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-400/20"
                            title="Duyệt yêu cầu hủy từ Staff"
                          >
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            Xác nhận
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onRejectCancelRequest?.(booking);
                            }}
                            className="flex h-7 items-center gap-1 border border-rose-400/50 bg-rose-400/10 px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300 transition hover:bg-rose-400/20"
                            title="Từ chối yêu cầu hủy"
                          >
                            <span className="material-symbols-outlined text-[15px]">cancel</span>
                            Từ chối
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onCancelBooking?.(booking);
                          }}
                          className="flex h-8 w-8 items-center justify-center border border-rose-400/40 bg-rose-400/10 text-rose-300 transition hover:bg-rose-400/20"
                          title="Hủy đơn đặt lịch"
                        >
                          <span className="material-symbols-outlined text-[17px]">block</span>
                        </button>
                      </div>
                    );
                  })()}
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
