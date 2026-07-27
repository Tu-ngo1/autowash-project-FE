import { useEffect, useState } from "react";
import StaffNavbar from "../../components/StaffNavbar";
import AddServiceModal from "../../components/staff/AddServiceModal";
import {
  getWashedBookings,
  checkoutBooking,
  addServicesToBooking,
} from "../../services/staffBookingApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";

const TIER_STYLES = {
  Platinum: "border-[#6ff6df] text-[#6ff6df] bg-[#6ff6df]/10",
  Gold: "border-amber-400 text-amber-300 bg-amber-400/10",
  Silver: "border-cyan-400 text-cyan-200 bg-cyan-400/10",
  Member: "border-[#4f7883] text-[#b8d8de] bg-[#123746]",
};

function formatCurrency(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "0 ₫";
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

function formatTime(value) {
  if (!value) return "";
  const text = String(value);
  if (text.includes("T")) return text.split("T")[1]?.slice(0, 5) || "";
  return text.slice(0, 5);
}

export default function StaffCheckout() {
  const [activeTab, setActiveTab] = useState("washed"); // 'washed' | 'completed'
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modals state
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState(null);
  const [checkoutModalBooking, setCheckoutModalBooking] = useState(null);
  const [paymentMethodSelect, setPaymentMethodSelect] = useState("CASH");
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

  const fetchWashedData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getWashedBookings();
      const raw = res?.data?.data ?? res?.data ?? res ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setBookings(list);
    } catch (err) {
      console.error("Lỗi lấy danh sách xe rửa xong:", err);
      setError(getFriendlyErrorMessage(err, "Không thể lấy danh sách xe đã rửa xong"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWashedData();
  }, []);

  const washedBookings = bookings.filter(
    (b) => String(b.status).toUpperCase() === "WASHED"
  );
  const completedBookings = bookings.filter(
    (b) => String(b.status).toUpperCase() === "COMPLETED"
  );

  const handleConfirmCheckout = async () => {
    if (!checkoutModalBooking) return;
    try {
      setIsSubmittingCheckout(true);
      setError("");
      await checkoutBooking(checkoutModalBooking.id || checkoutModalBooking.bookingId, paymentMethodSelect);

      setSuccessMessage(
        `✅ Đã xác nhận thanh toán & giao xe thành công cho biển số ${
          checkoutModalBooking.vehicleLicensePlate || "xe"
        }!`
      );
      setCheckoutModalBooking(null);
      await fetchWashedData();

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Lỗi xác nhận thanh toán:", err);
      setError(getFriendlyErrorMessage(err, "Xác nhận thanh toán thất bại"));
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  const handleSaveServices = async (serviceIds) => {
    if (!selectedBookingForEdit) return;
    try {
      await addServicesToBooking(selectedBookingForEdit.id, serviceIds);
      setSelectedBookingForEdit(null);
      setSuccessMessage("✅ Cập nhật dịch vụ đơn hàng thành công!");
      await fetchWashedData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Lỗi cập nhật dịch vụ:", err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#071724] text-[#ecfeff]">
      <StaffNavbar />

      <main className="lg:pl-64 pb-24 lg:pb-12 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Banner tiêu đề */}
        <div className="relative overflow-hidden rounded-3xl border border-[#72f3ff]/30 bg-gradient-to-r from-[#0c2b3e] via-[#091e2b] to-[#071724] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#72f3ff] text-[28px]">
                  receipt_long
                </span>
                <span
                  className="rounded-full bg-[#72f3ff]/15 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#72f3ff] border border-[#72f3ff]/30"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Trung tâm Giao xe & Thanh toán
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black leading-tight text-[#ecfeff] sm:text-3xl">
                Xác nhận Thanh toán & Giao xe
              </h1>
              <p className="mt-1 text-xs text-[#8fb5c7]">
                Đơn hàng ở ca rửa xong được tự động đẩy về đây. Staff kiểm tra thông tin, thu tiền và bấm hoàn thành giao xe.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchWashedData}
              disabled={isLoading}
              className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#72f3ff]/40 bg-[#72f3ff]/10 px-4 py-2.5 text-xs font-bold text-[#72f3ff] transition hover:bg-[#72f3ff]/20 active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? "animate-spin" : ""}`}>
                refresh
              </span>
              Làm mới dữ liệu
            </button>
          </div>

          {/* Stat Badges */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-white/10 pt-4">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3">
              <p className="text-[11px] font-bold text-emerald-200">Đã Rửa Xong (Chờ Giao Xe)</p>
              <p className="mt-1 text-2xl font-black text-emerald-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {washedBookings.length} xe
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3">
              <p className="text-[11px] font-bold text-cyan-200">Đã Hoàn Thành Giao Xe Hôm Nay</p>
              <p className="mt-1 text-2xl font-black text-cyan-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {completedBookings.length} xe
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[#72f3ff]/30 bg-[#092233] p-3">
              <p className="text-[11px] font-bold text-[#b8d8de]">Tổng Đơn Xử Lý Cả Ngày</p>
              <p className="mt-1 text-2xl font-black text-[#72f3ff]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {bookings.length} xe
              </p>
            </div>
          </div>
        </div>

        {/* Success & Error Alert Banners */}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-200 flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-[24px] text-emerald-400">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs font-bold text-rose-200 flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-rose-400">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex gap-3 border-b border-sky-100/15 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("washed")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black transition ${
              activeTab === "washed"
                ? "bg-[#72f3ff] text-[#061424] shadow-[0_0_20px_rgba(114,243,255,0.3)]"
                : "bg-white/5 text-[#b8d8de] hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">directions_car</span>
            Chờ Giao Xe & Thanh Toán ({washedBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black transition ${
              activeTab === "completed"
                ? "bg-[#72f3ff] text-[#061424] shadow-[0_0_20px_rgba(114,243,255,0.3)]"
                : "bg-white/5 text-[#b8d8de] hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
            Đã Hoàn Thành Giao Xe ({completedBookings.length})
          </button>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-sm font-semibold text-[#72f3ff]">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#72f3ff]/30 border-t-[#72f3ff] mb-3" />
            Đang lấy dữ liệu đơn hàng...
          </div>
        ) : (activeTab === "washed" ? washedBookings : completedBookings).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1c3e54] bg-[#04111c] p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#4edea3]/50 mb-2">
              no_crash
            </span>
            <p className="text-sm font-bold text-[#ecfeff]">
              {activeTab === "washed"
                ? "Hiện chưa có xe nào ở khu vực chờ giao xe."
                : "Chưa có đơn hàng nào hoàn tất giao xe hôm nay."}
            </p>
            <p className="mt-1 text-xs text-[#8faabf]">
              Khi Staff nhấn "Đã rửa xong" ở các khoang rửa, xe sẽ tự động chuyển sang trang này.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {(activeTab === "washed" ? washedBookings : completedBookings).map((item) => {
              const isPaid = String(item.paymentStatus || "").toUpperCase() === "PAID";
              const isWashedStatus = String(item.status).toUpperCase() === "WASHED";

              const finalPrice = item.finalPrice ?? item.totalPrice ?? 0;
              const actualPaid = item.actualPaidAmount ?? (isPaid ? finalPrice : 0);
              const remaining = finalPrice - actualPaid;

              const tierBadgeClass = TIER_STYLES[item.tierLevel] || TIER_STYLES.Member;

              const displayServices = (Array.isArray(item.details) && item.details.length > 0)
                ? item.details.map(d => ({
                    name: d.serviceName || d.name || "Dịch vụ rửa xe",
                    price: d.actualPrice ?? d.price ?? 0
                  }))
                : (Array.isArray(item.services) && item.services.length > 0)
                  ? item.services.map(s => (
                      typeof s === "string"
                        ? { name: s, price: 0 }
                        : { name: s.serviceName || s.name || s.label || "Dịch vụ rửa xe", price: s.actualPrice ?? s.price ?? s.basePrice ?? 0 }
                    ))
                  : [];

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#1c3e54] bg-gradient-to-b from-[#092233] to-[#051421] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.4)] transition hover:border-[#72f3ff]/50 hover:shadow-[0_20px_50px_rgba(114,243,255,0.12)]"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full bg-[#72f3ff]/15 px-3 py-0.5 text-xs font-black text-[#72f3ff] border border-[#72f3ff]/30 tracking-wider"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {item.vehicleLicensePlate || "BIỂN SỐ N/A"}
                          </span>
                          {item.vehicleSize && (
                            <span className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-cyan-200 border border-cyan-400/30">
                              Size: {item.vehicleSize}
                            </span>
                          )}
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${tierBadgeClass}`}>
                            {item.tierLevel || "Member"}
                          </span>
                        </div>

                        <h3 className="mt-2 text-base font-black text-[#ecfeff]">
                          {item.customerName || "Khách vãng lai"}
                        </h3>
                        <p className="text-xs text-[#8fb5c7]">
                          📞 {item.customerPhone || "Chưa cập nhật SĐT"}
                        </p>
                      </div>

                      {/* Payment Badge Status */}
                      <div className="text-right">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${
                            isPaid && remaining <= 0
                              ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/30"
                              : "bg-amber-400/20 text-amber-200 border-amber-400/30"
                          }`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {isPaid && remaining <= 0 ? "Đã trả đủ" : "Cần thu tiền"}
                        </span>
                      </div>
                    </div>

                    {/* Service & Time Info */}
                    <div className="mt-4 space-y-2.5 text-xs">
                      <div className="flex justify-between text-[#b8d8de]">
                        <span>Thời gian hoàn thành rửa:</span>
                        <span className="font-bold text-[#6ff6df]">
                          ⏱️ {formatTime(item.completedAt || item.updatedAt)}
                        </span>
                      </div>

                      {/* Service Items List */}
                      <div className="rounded-2xl border border-white/5 bg-[#030e17] p-3 space-y-1.5">
                        <p className="text-[11px] font-bold text-[#72f3ff] uppercase tracking-wider">
                          Dịch vụ đã thực hiện ({displayServices.length}):
                        </p>
                        {displayServices.length > 0 ? (
                          displayServices.map((svc, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-[#dff7fb]">
                              <span className="font-medium">• {svc.name}</span>
                              {svc.price > 0 && (
                                <span className="font-bold text-[#72f3ff]">
                                  {formatCurrency(svc.price)}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#8faabf]">Gói rửa xe tiêu chuẩn</p>
                        )}
                      </div>

                      {/* Detailed Price Summary */}
                      <div className="rounded-2xl border border-[#72f3ff]/30 bg-[#071d2b] p-3.5 space-y-1.5">
                        <div className="flex justify-between text-xs text-[#b8d8de]">
                          <span>Giá thực tế đơn hàng:</span>
                          <span className="font-extrabold text-[#ecfeff]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {formatCurrency(finalPrice)}
                          </span>
                        </div>

                        {remaining > 0 ? (
                          <div className="flex justify-between border-t border-white/10 pt-1.5 text-sm font-black text-amber-300">
                            <span>Thu thêm tại quầy:</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              +{formatCurrency(remaining)}
                            </span>
                          </div>
                        ) : remaining < 0 ? (
                          <div className="flex justify-between border-t border-white/10 pt-1.5 text-sm font-black text-emerald-300">
                            <span>Hoàn lại Ví khách:</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              -{formatCurrency(Math.abs(remaining))}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between border-t border-white/10 pt-1.5 text-xs font-bold text-[#6ff6df]">
                            <span>Đã thanh toán đủ trực tuyến:</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {formatCurrency(finalPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons (Chỉ gồm In Hóa Đơn & Giao Xe) */}
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    {/* Button 1: Print/View Receipt */}
                    <button
                      type="button"
                      onClick={() => setSelectedBookingForReceipt(item)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-[#dff7fb] transition hover:bg-white/10"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      In Hóa Đơn
                    </button>

                    {/* Button 2: Checkout Handover */}
                    {isWashedStatus ? (
                      <button
                        type="button"
                        onClick={() => setCheckoutModalBooking(item)}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-[#72f3ff] px-4 py-2.5 text-xs font-black text-[#061424] shadow-[0_4px_20px_rgba(114,243,255,0.3)] transition hover:bg-[#9ff4ff] active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Giao Xe
                      </button>
                    ) : (
                      <div className="flex items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-4 py-2.5">
                        ✓ Đã Hoàn Thành
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL 1: Confirm Checkout Payment Modal */}
      {checkoutModalBooking && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#020b12]/85 px-4 backdrop-blur-md">
          <div className="staff-reveal w-full max-w-md overflow-hidden rounded-3xl border border-[#72f3ff]/30 bg-[#071724] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
                <span className="material-symbols-outlined text-[26px]">task_alt</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-[#ecfeff]">
                  Xác nhận Thanh toán & Giao xe
                </h3>
                <p className="text-xs text-[#8fb5c7]">
                  Biển số xe: <strong className="text-[#72f3ff]">{checkoutModalBooking.vehicleLicensePlate}</strong>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#72f3ff]/20 bg-[#04111c] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#b8d8de]">Khách hàng:</span>
                <span className="font-extrabold text-[#ecfeff]">{checkoutModalBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#b8d8de]">Tổng giá đơn hàng:</span>
                <span className="font-extrabold text-[#72f3ff]">
                  {formatCurrency(checkoutModalBooking.finalPrice ?? checkoutModalBooking.totalPrice)}
                </span>
              </div>
            </div>

            {/* Thông tin Thanh toán chi tiết */}
            {(() => {
              const isPaid = String(checkoutModalBooking.paymentStatus || "").toUpperCase() === "PAID";
              const finalPrice = checkoutModalBooking.finalPrice ?? checkoutModalBooking.totalPrice ?? 0;
              const actualPaid = checkoutModalBooking.actualPaidAmount ?? (isPaid ? finalPrice : 0);
              const remaining = finalPrice - actualPaid;
              const isFullyPrepaid = isPaid && remaining <= 0;

              if (isFullyPrepaid) {
                return (
                  <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-200 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[26px] text-emerald-400">check_circle</span>
                    <div>
                      <p className="font-extrabold text-[#ecfeff]">Đã thanh toán đủ 100% qua {checkoutModalBooking.paymentMethod || "Trực tuyến"}</p>
                      <p className="mt-0.5 text-[11px] text-emerald-300/90 font-normal">
                        Khách không cần trả thêm bất kỳ khoản phí nào tại quầy. Bấm nút dưới để hoàn tất giao xe.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {remaining > 0 && (
                    <div className="rounded-2xl border border-amber-400/40 bg-amber-400/15 p-3.5 text-xs font-bold text-amber-200 flex justify-between items-center">
                      <span>Cần thu tại quầy:</span>
                      <span className="text-base text-amber-300 font-black" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        +{formatCurrency(remaining)}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#b8d8de]">
                      Hình thức thu tiền tại quầy:
                    </label>
                    <select
                      value={paymentMethodSelect}
                      onChange={(e) => setPaymentMethodSelect(e.target.value)}
                      className="w-full rounded-xl border border-[#1c3e54] bg-[#040f1a] px-3 py-2.5 text-xs font-bold text-[#ecfeff] focus:border-[#72f3ff] focus:outline-none"
                    >
                      <option value="CASH">💵 Tiền mặt tại quầy (CASH)</option>
                      <option value="BANK_TRANSFER">📱 Chuyển khoản / Quét mã QR tại quầy</option>
                    </select>
                  </div>

                  {paymentMethodSelect === "BANK_TRANSFER" && (
                    <div className="rounded-2xl border border-cyan-400/40 bg-cyan-950/40 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                        <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                        <span>Thông tin Quét mã QR / Chuyển khoản ngân hàng</span>
                      </div>
                      
                      <div className="rounded-xl border border-cyan-400/20 bg-[#04111c] p-3 text-[11px] space-y-1.5 text-[#b8d8de]">
                        <div className="flex justify-between">
                          <span>Số tài khoản:</span>
                          <span className="font-extrabold text-[#72f3ff]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            1900 8888 9999 (MB Bank)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Chủ tài khoản:</span>
                          <span className="font-extrabold text-white">AUTOWASH CENTER HCMC</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nội dung chuyển khoản:</span>
                          <span className="font-extrabold text-amber-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {checkoutModalBooking.bookingCode || checkoutModalBooking.id}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-cyan-400/20 pt-1.5 font-bold text-emerald-300">
                          <span>Số tiền cần chuyển:</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {formatCurrency(remaining > 0 ? remaining : finalPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-[11px] font-semibold text-amber-200 bg-amber-400/10 border border-amber-400/30 p-2.5 rounded-xl">
                        <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0 mt-0.5">photo_camera</span>
                        <span>
                          <strong>Quy trình Staff:</strong> Đưa mã QR cho khách quét, đối soát thông báo tiền về tài khoản và <strong>chụp ảnh màn hình bill chuyển khoản thành công</strong> để đối soát doanh thu cửa hàng trước khi bấm giao xe.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmittingCheckout}
                onClick={() => setCheckoutModalBooking(null)}
                className="rounded-xl border border-[#1c3e54] bg-white/5 py-3 font-bold text-[#dff7fb] hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmittingCheckout}
                onClick={handleConfirmCheckout}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#72f3ff] py-3 font-black text-[#061424] hover:bg-[#9ff4ff]"
              >
                {isSubmittingCheckout && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#061424]/30 border-t-[#061424]" />
                )}
                Hoàn Thành Giao Xe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add/Modify Service Modal */}
      {selectedBookingForEdit && (
        <AddServiceModal
          isOpen={Boolean(selectedBookingForEdit)}
          onClose={() => setSelectedBookingForEdit(null)}
          appointment={selectedBookingForEdit}
          onConfirm={handleSaveServices}
        />
      )}

      {/* MODAL 3: Print Receipt Preview Modal */}
      {selectedBookingForReceipt && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#020b12]/85 px-4 backdrop-blur-md">
          <div className="staff-reveal w-full max-w-lg overflow-hidden rounded-3xl border border-[#72f3ff]/30 bg-[#071724] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#72f3ff]">receipt</span>
                <h3 className="text-base font-black text-[#ecfeff]">Hóa Đơn Rửa Xe AutoWash</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForReceipt(null)}
                className="text-[#8fb5c7] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Printable Receipt Paper layout */}
            <div className="rounded-2xl border border-slate-300 bg-white p-6 text-slate-900 shadow-inner font-mono text-xs space-y-3">
              <div className="text-center border-b border-slate-300 pb-3">
                <h2 className="text-base font-black uppercase tracking-wider">HỆ THỐNG RỬA XE AUTOWASH</h2>
                <p className="text-[11px] text-slate-600">ĐC: 123 Đường Rửa Xe, TP.HCM • Hotline: 1900 8888</p>
                <p className="mt-1 text-[11px] font-bold text-slate-800">
                  HÓA ĐƠN DỊCH VỤ RỬA XE
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Mã đơn:</span>
                  <span className="font-bold">{selectedBookingForReceipt.bookingCode || selectedBookingForReceipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biển số xe:</span>
                  <span className="font-bold">{selectedBookingForReceipt.vehicleLicensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span>{selectedBookingForReceipt.customerName || "Khách vãng lai"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian hoàn thành:</span>
                  <span>{formatTime(selectedBookingForReceipt.completedAt || new Date())}</span>
                </div>
              </div>

              <div className="border-t border-b border-slate-300 py-2 space-y-1">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>Dịch vụ</span>
                  <span>Giá</span>
                </div>
                {selectedBookingForReceipt.services?.map((s, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>• {s.name || s.serviceName}</span>
                    <span>{formatCurrency(s.price ?? s.basePrice ?? 0)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Tổng tiền niêm yết:</span>
                  <span>{formatCurrency(selectedBookingForReceipt.totalPrice)}</span>
                </div>
                {selectedBookingForReceipt.discount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Giảm giá / Ưu đãi:</span>
                    <span>-{formatCurrency(selectedBookingForReceipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-300 pt-1.5">
                  <span>TỔNG THANH TOÁN:</span>
                  <span>{formatCurrency(selectedBookingForReceipt.finalPrice ?? selectedBookingForReceipt.totalPrice)}</span>
                </div>
              </div>

              <div className="text-center border-t border-slate-300 pt-3 text-[10px] text-slate-600">
                <p>Cảm ơn quý khách đã sử dụng dịch vụ AutoWash!</p>
                <p>Hẹn gặp lại quý khách!</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForReceipt(null)}
                className="rounded-xl border border-[#1c3e54] bg-white/5 px-4 py-2 text-xs font-bold text-[#dff7fb] hover:bg-white/10"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-[#72f3ff] px-4 py-2 text-xs font-black text-[#061424] hover:bg-[#9ff4ff]"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                In Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
