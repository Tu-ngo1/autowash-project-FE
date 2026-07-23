export const BOOKING_STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRM", label: "Đã xác nhận" },
  { value: "ARRIVED", label: "Đã check-in" },
  { value: "IN_PROGRESS", label: "Đang rửa" },
  { value: "WASHED", label: "Đã rửa xong" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export const BOOKING_STATUS_LABELS = BOOKING_STATUS_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {
    "IN PROGRESS": "Đang rửa",
    WASHING: "Đang rửa",
    CANCEL_REQUESTED: "Yêu cầu hủy",
    PAID: "Đã thanh toán",
    UNPAID: "Chưa thanh toán",
    FAILED: "Thất bại",
    REFUNDED: "Đã hoàn tiền",
  },
);

export const BOOKING_STATUS_STYLES = {
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

export const CUSTOMER_STATUS_STYLES = {
  PENDING: "bg-[#0061a5]/10 text-[#0061a5]",
  CONFIRM: "bg-[#0061a5]/10 text-[#0061a5]",
  ARRIVED: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-cyan-100 text-cyan-700",
  WASHED: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-emerald-500/10 text-emerald-600",
  CANCELLED: "bg-rose-100 text-rose-700",
};

export const getBookingStatusLabel = (status) => {
  const key = String(status || "").toUpperCase();
  return BOOKING_STATUS_LABELS[key] || status || "-";
};
