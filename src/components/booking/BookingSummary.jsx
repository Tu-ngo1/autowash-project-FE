export default function BookingSummary({
  date,
  discountAmount,
  discountPercent,
  formatPrice,
  getSlotEndTime,
  handleSubmit,
  loading,
  selectedVehicle,
  serviceInfo,
  subtotal,
  success,
  timeSlot,
  totalPrice,
  userTier,
  voucherAmount,
  totalDuration = 0,
}) {
  return (
    <aside className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-[#bfc7d5]/30 bg-white/90 p-5 shadow-lg shadow-[#0061a5]/5 backdrop-blur-xl transition-shadow duration-300 hover:shadow-xl lg:p-6">
        <h3 className="mb-5 text-2xl font-semibold text-[#0061a5]">
          Tóm tắt đơn hàng
        </h3>

        <div className="mb-5 h-32 w-full overflow-hidden rounded-xl shadow-md xl:h-36">
          <img
            alt="Car wash visual"
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=1000&auto=format&fit=crop"
          />
        </div>

        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#bfc7d5]/30 pb-2">
            <span className="text-[#3f4753]">Loại xe:</span>
            <span className="font-bold">
              {selectedVehicle?.type ||
                selectedVehicle?.label ||
                selectedVehicle?.name ||
                "Chưa chọn"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[#bfc7d5]/30 pb-2">
            <span className="text-[#3f4753]">Gói dịch vụ:</span>
            <span className="text-right font-bold">
              {serviceInfo.label || "Chưa chọn"}
            </span>
          </div>
          {totalDuration > 0 && (
            <div className="flex items-center justify-between gap-4 border-b border-[#bfc7d5]/30 pb-2">
              <span className="text-[#3f4753]">Tổng thời lượng:</span>
              <span className="font-bold">{totalDuration} phút</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 border-b border-[#bfc7d5]/30 pb-2">
            <span className="text-[#3f4753]">Thời gian:</span>
            <span className="text-right font-bold">
              {date && timeSlot
                ? `${timeSlot} - ${getSlotEndTime(timeSlot)}, ${date}`
                : "Chưa chọn"}
            </span>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-[#3f4753]">Gói dịch vụ</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#3f4753]">
              Giảm giá theo hạng ({userTier} - {discountPercent}%)
            </span>
            <span className="text-emerald-500">
              -{formatPrice(discountAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#3f4753]">Voucher</span>
            <span className="text-emerald-500">
              -{formatPrice(voucherAmount)}
            </span>
          </div>
          <div className="mt-4 flex justify-between border-t border-[#0061a5]/20 pt-4 text-2xl font-bold text-[#0061a5]">
            <span>Tổng cộng</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full rounded-xl py-4 text-lg font-bold text-white transition-all active:scale-[0.98] disabled:bg-[#707884] ${
            success
              ? "bg-emerald-500"
              : "bg-[#0d99ff] hover:bg-[#005bbf] hover:shadow-xl"
          }`}
        >
          {loading
            ? "ĐANG XỬ LÝ..."
            : success
              ? "ĐÃ XÁC NHẬN ĐẶT LỊCH!"
              : "XÁC NHẬN ĐẶT LỊCH"}
        </button>

        <p className="mt-4 text-center text-xs font-semibold text-[#3f4753]">
          Bằng việc xác nhận, bạn đồng ý với{" "}
          <button type="button" className="text-[#0061a5] underline">
            Điều khoản dịch vụ
          </button>{" "}
          của chúng tôi.
        </p>
      </div>
    </aside>
  );
}
