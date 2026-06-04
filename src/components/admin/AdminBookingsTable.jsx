const STATUS_STYLES = {
  COMPLETED: "border-secondary text-secondary bg-secondary/5",
  PENDING:
    "border-outline-variant text-on-surface-variant bg-surface-container-highest",
  "IN PROGRESS": "border-primary text-primary bg-primary/5",
  WASHING: "border-primary text-primary bg-primary/5",
  CANCELLED: "border-error text-error bg-error/5",
};

const PAYMENT_STYLES = {
  PAYOS: "border-primary text-primary bg-primary/5",
  CASH: "border-outline text-outline bg-surface-container-highest",
  UNPAID: "border-outline text-outline bg-surface-container-highest",
};

function PaymentBadge({ method }) {
  return (
    <span
      className={`inline-block border px-1 py-0.5 font-label-caps text-[10px] ${PAYMENT_STYLES[method] || PAYMENT_STYLES.CASH}`}
    >
      {method === "PAYOS"
        ? "PAYOS (PAID)"
        : method === "CASH"
          ? "CASH (UNPAID)"
          : method}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block border px-1 py-0.5 font-label-caps text-[10px] ${STATUS_STYLES[status] || STATUS_STYLES.PENDING}`}
    >
      {status === "COMPLETED"
        ? "COMPLETED"
        : status === "IN PROGRESS"
          ? "IN PROGRESS"
          : status || "PENDING"}
    </span>
  );
}

export default function AdminBookingsTable({
  bookings,
  fetchBookingDetails,
  loading,
}) {
  if (loading) {
    return (
      <div className="border border-outline-variant bg-surface-container py-12 text-center text-on-surface-variant">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="border border-outline-variant bg-surface-container py-12 text-center text-on-surface-variant">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {bookings.map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() => fetchBookingDetails(booking.id)}
            className="border border-outline-variant bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-data-display text-primary">
                  {booking.code || `#B-${booking.id}`}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-on-surface">
                  {booking.customerName || "-"}
                </p>
                <p className="font-data-display text-xs text-on-surface-variant">
                  {booking.plate || "-"}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="space-y-2 text-xs text-on-surface-variant">
              <div className="flex justify-between gap-3">
                <span>Thời gian</span>
                <span className="text-right font-data-display text-on-surface">
                  {booking.date} {booking.time}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Dịch vụ</span>
                <span className="text-right text-on-surface">
                  {booking.service || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Thanh toán</span>
                <PaymentBadge method={booking.paymentMethod} />
              </div>
              <div className="flex justify-between gap-3 border-t border-outline-variant pt-2">
                <span>Tổng tiền</span>
                <span className="font-data-display text-on-surface">
                  {booking.total?.toLocaleString()} ₫
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden w-full border border-outline-variant bg-surface-container lg:block">
        <table className="w-full table-fixed border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-outline-variant bg-surface-container-high shadow-[0_1px_0_0_#3c494c]">
            <tr>
              <th className="w-20 truncate whitespace-nowrap px-2 py-2 font-label-caps text-on-surface-variant">
                MÃ ĐƠN
              </th>
              <th className="w-40 truncate whitespace-nowrap px-2 py-2 font-label-caps text-on-surface-variant">
                THỜI GIAN
              </th>
              <th className="truncate whitespace-nowrap px-2 py-2 font-label-caps text-on-surface-variant">
                KHÁCH HÀNG & XE
              </th>
              <th className="truncate whitespace-nowrap px-2 py-2 font-label-caps text-on-surface-variant">
                DỊCH VỤ
              </th>
              <th className="w-28 truncate whitespace-nowrap px-2 py-2 font-label-caps text-on-surface-variant">
                THANH TOÁN
              </th>
              <th className="w-28 truncate whitespace-nowrap px-2 py-2 font-label-caps text-on-surface-variant">
                TRẠNG THÁI
              </th>
              <th className="w-24 truncate whitespace-nowrap px-2 py-2 text-right font-label-caps text-on-surface-variant">
                TỔNG TIỀN
              </th>
              <th className="w-12 truncate whitespace-nowrap px-2 py-2 text-center font-label-caps text-on-surface-variant">
                ACT
              </th>
            </tr>
          </thead>
          <tbody className="font-body-md text-xs">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="cursor-pointer border-b border-outline-variant transition-colors hover:bg-surface-container-high"
                onClick={() => fetchBookingDetails(booking.id)}
              >
                <td className="truncate whitespace-nowrap px-2 py-2 align-middle">
                  <span className="font-data-display text-primary">
                    {booking.code || `#B-${booking.id}`}
                  </span>
                </td>
                <td className="truncate whitespace-nowrap px-2 py-2 align-middle">
                  <span className="font-data-display text-on-surface">
                    {booking.date}
                  </span>
                  <span className="ml-1 font-data-display text-on-surface-variant">
                    {booking.time}
                  </span>
                </td>
                <td className="truncate whitespace-nowrap px-2 py-2 align-middle">
                  <span className="font-body-md font-semibold text-on-surface">
                    {booking.customerName}
                  </span>
                  <span className="ml-1 font-data-display text-on-surface-variant">
                    • {booking.plate}
                  </span>
                </td>
                <td
                  className="truncate whitespace-nowrap px-2 py-2 align-middle text-on-surface"
                  title={booking.service}
                >
                  {booking.service}
                </td>
                <td className="truncate whitespace-nowrap px-2 py-2 align-middle">
                  <PaymentBadge method={booking.paymentMethod} />
                </td>
                <td className="truncate whitespace-nowrap px-2 py-2 align-middle">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="truncate whitespace-nowrap px-2 py-2 text-right align-middle">
                  <span className="font-data-display text-on-surface">
                    {booking.total?.toLocaleString()} ₫
                  </span>
                </td>
                <td className="px-2 py-2 text-center align-middle">
                  <button className="p-0.5 transition-colors hover:text-primary">
                    <span className="material-symbols-outlined text-[16px]">
                      more_vert
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
