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
}) {
  return (
    <aside className="lg:col-span-4">
      <div className="sticky top-24 rounded-2xl border border-[#bfc7d5]/30 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
        <h3 className="mb-6 text-2xl font-semibold text-[#0061a5]">
          Tóm tắt đơn hàng
        </h3>

        <div className="mb-6 h-40 w-full overflow-hidden rounded-xl shadow-md">
          <img
            alt="Car wash visual"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuApBaoOniRyUxecZixfWiqlJEGutYjsF-aGNhWAjH-CBhMvE-s8NYboFKV74A6qV472gnBZ2YrzJH5X76FsrIv-JYMq-OvdKfWWNeRL5CySiAZfqnazqcBZTTozuxWsk2X3YGXUJF4FVYJLUMjma51gTiKdk2LQ4FfOHwwVZKj41OlCaAPzv3CZhLd0LSrE1Bzgd18r4KKj2B5OWTj9xnW1jVN9kNZ7hYbvgLnHW4HRzXkHis6k02hlVaa4eGzPyAA2p3YZHM1OYWo"
          />
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#bfc7d5]/30 pb-2">
            <span className="text-[#3f4753]">Loại xe:</span>
            <span className="font-bold">
              {selectedVehicle?.type || "Chưa chọn"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[#bfc7d5]/30 pb-2">
            <span className="text-[#3f4753]">Gói dịch vụ:</span>
            <span className="text-right font-bold">
              {serviceInfo.label || "Chưa chọn"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[#bfc7d5]/30 pb-2">
            <span className="text-[#3f4753]">Thời gian:</span>
            <span className="text-right font-bold">
              {date && timeSlot
                ? `${timeSlot} - ${getSlotEndTime(timeSlot)}, ${date}`
                : "Chưa chọn"}
            </span>
          </div>
        </div>

        <div className="mb-8 space-y-2">
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
