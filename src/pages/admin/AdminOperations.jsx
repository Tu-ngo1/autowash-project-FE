// src/pages/admin/AdminOperations.jsx
import { useState, useMemo } from "react";
import { configureTomorrow } from "../../services/adminOperationsApi";

export default function AdminOperations() {
  const [openTime, setOpenTime] = useState("08:00");
  const [slotCount, setSlotCount] = useState(6);
  const [bayCount, setBayCount] = useState(3);

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState("");
  const [conflictBookings, setConflictBookings] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Calculate tomorrow's date
  const tomorrowStr = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const tomorrowFormatted = useMemo(() => {
    const parts = tomorrowStr.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }, [tomorrowStr]);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      const hh = String(hour).padStart(2, "0");
      options.push(`${hh}:00`);
      options.push(`${hh}:30`);
    }
    return options;
  }, []);

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessData(null);
    setLoading(true);

    if (slotCount < 1 || !Number.isInteger(Number(slotCount))) {
      setError("Số lượng ca phải là số nguyên lớn hơn hoặc bằng 1.");
      setLoading(false);
      return;
    }

    if (bayCount < 1 || !Number.isInteger(Number(bayCount))) {
      setError("Số khoang rửa phải là số nguyên lớn hơn hoặc bằng 1.");
      setLoading(false);
      return;
    }

    try {
      const response = await configureTomorrow({
        openTime,
        slotCount: Number(slotCount),
        bayCount: Number(bayCount),
        forceSave: force,
      });

      const data = response?.data?.data ?? response?.data ?? {};
      setSuccessData(data);
      setShowWarningModal(false);
      setConflictBookings([]);
    } catch (err) {
      const responseData = err.response?.data;
      const status = err.response?.status;
      const message = responseData?.message || responseData?.error || "";

      if (status === 409 && message.startsWith("CONFLICT:")) {
        const bookingIdsStr = message.substring("CONFLICT:".length);
        const bookingIds = bookingIdsStr.split(",").map(id => id.trim()).filter(Boolean);
        setConflictBookings(bookingIds);
        setShowWarningModal(true);
      } else {
        setError(
          message || "Đã xảy ra lỗi khi cấu hình vận hành cho ngày mai."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070a] text-zinc-100 flex flex-col">
      {/* Visual background grids */}
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
                  SYSTEM OPERATIONS
                </span>
                <span className="border border-zinc-800 bg-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  <span className="admin-pulse mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  TOMORROW CONFIG
                </span>
              </div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
                Cấu hình thời gian mở cửa
              </h1>
              <p className="mt-3 max-w-3xl font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-zinc-500">
                Thiết lập lịch mở cửa, số khoang rửa và ca hoạt động áp dụng cho
                ngày mai:{" "}
                <span className="text-cyan-300 font-black">
                  {tomorrowFormatted} ({tomorrowStr})
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Content form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 admin-reveal border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 bg-black p-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-sm font-black uppercase tracking-[0.18em] text-zinc-100">
                <span className="material-symbols-outlined text-[20px] text-cyan-300">
                  settings_suggest
                </span>
                Thiết lập cấu hình vận hành ngày mai
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="border border-red-500/35 bg-red-950/20 p-4 font-mono text-xs text-red-400 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-red-400 mt-0.5">
                    warning
                  </span>
                  <div>
                    <div className="font-black uppercase tracking-wider mb-1">
                      Cấu hình không hợp lệ
                    </div>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {successData && (
                <div className="border border-emerald-500/35 bg-emerald-950/20 p-4 font-mono text-xs text-emerald-400 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <div className="font-black uppercase tracking-wider mb-1">
                      Cập nhật thành công
                    </div>
                    <p className="mb-2">
                      Đã thiết lập cấu hình cho ngày{" "}
                      <span className="font-black underline">
                        {successData.configDate || tomorrowStr}
                      </span>
                      .
                    </p>
                    <div className="space-y-1 pl-2 border-l border-emerald-500/30 text-emerald-300 font-bold uppercase tracking-wide">
                      <div>Giờ mở cửa: {successData.openTime}</div>
                      <div>
                        Giờ đóng cửa tính toán:{" "}
                        {successData.closeTime || "Chưa xác định"}
                      </div>
                      <div>
                        Số lượng khoang rửa: {successData.bayCount} khoang
                      </div>
                      <div>
                        Trạng thái hoạt động:{" "}
                        {successData.isActive ? "ĐANG HOẠT ĐỘNG" : "TẮT"}
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] font-black text-cyan-300 uppercase tracking-widest">
                      * VUI LÒNG KIỂM TRA LẠI GIỜ ĐÓNG CỬA TÍNH TOÁN TRƯỚC KHI
                      ĐỒNG Ý
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Application Date Indicator */}
                <div>
                  <label className="block font-mono text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 mb-2">
                    Ngày áp dụng cấu hình
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${tomorrowFormatted} (Ngày mai)`}
                    className="h-11 w-full border border-zinc-800 bg-zinc-900/50 px-3 font-mono text-sm text-zinc-400 outline-none cursor-not-allowed"
                  />
                </div>

                {/* Field 1: Open Time Select */}
                <div>
                  <label className="block font-mono text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 mb-2">
                    Giờ mở cửa (Open Time)
                  </label>
                  <select
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="h-11 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                  >
                    {timeOptions.map((time) => (
                      <option
                        key={time}
                        value={time}
                        className="bg-black text-zinc-100"
                      >
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Slot Count */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-mono text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                      Số lượng ca hoạt động
                    </label>
                    <span className="font-mono text-[9px] font-bold text-cyan-300 border border-cyan-400/20 bg-cyan-400/5 px-2 py-0.5 uppercase tracking-wider">
                      Ca kéo dài 90 phút
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={slotCount}
                    onChange={(e) => setSlotCount(e.target.value)}
                    placeholder="Nhập số lượng ca (ví dụ: 6)"
                    className="h-11 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                  />
                  <p className="mt-1 font-mono text-[10px] text-zinc-500 italic">
                    * Lưu ý: Mỗi ca làm việc kéo dài cố định 90 phút. Ví dụ: 6
                    ca từ 08:00 sẽ kết thúc vào lúc 17:00.
                  </p>
                </div>

                {/* Field 3: Bay Count */}
                <div>
                  <label className="block font-mono text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 mb-2">
                    Số khoang rửa khả dụng (Bay Count)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={bayCount}
                    onChange={(e) => setBayCount(e.target.value)}
                    placeholder="Nhập số khoang rửa (ví dụ: 3)"
                    className="h-11 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-11 w-full items-center justify-center gap-2 border border-cyan-400 bg-cyan-400/10 px-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {loading ? "sync" : "save"}
                  </span>
                  {loading ? "Đang gửi cấu hình..." : "Xác nhận & lưu cấu hình"}
                </button>
              </div>
            </form>
          </div>

          {/* Quick instructions sidebar panel */}
          <div className="space-y-6">
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-zinc-100 mb-4 pb-2 border-b border-zinc-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-cyan-300">
                  info
                </span>
                Hướng dẫn cấu hình
              </h3>
              <div className="font-mono text-xs text-zinc-500 space-y-3 leading-relaxed">
                <p>
                  1. <strong className="text-zinc-300">Giờ mở cửa</strong>: Chọn
                  thời gian tiệm bắt đầu đón những lượt khách rửa đầu tiên trong
                  ngày mai.
                </p>
                <p>
                  2. <strong className="text-zinc-300">Số lượng ca</strong>: Xác
                  định tổng số ca hoạt động liên tục trong ngày. Mỗi ca kéo dài
                  đúng 90 phút. Hệ thống sẽ tự động tính toán ra{" "}
                  <strong className="text-zinc-300">Giờ đóng cửa</strong>.
                </p>
                <p>
                  3. <strong className="text-zinc-300">Số khoang rửa</strong>:
                  Số lượng khoang rửa (bay) thực tế phục vụ đồng thời. Càng
                  nhiều khoang thì sức chứa đặt lịch cùng thời điểm càng tăng.
                </p>
                <div className="p-3 bg-cyan-400/5 border border-cyan-400/10 text-cyan-300/80">
                  Cấu hình này sẽ được áp dụng trực tiếp cho ngày mai. Vui lòng
                  thống nhất với nhân viên vận hành trước khi cập nhật.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md border border-amber-500/30 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <span className="material-symbols-outlined text-4xl">warning</span>
              <h3 className="font-mono text-lg font-black uppercase tracking-wider text-zinc-50">
                Cảnh báo xung đột lịch hẹn!
              </h3>
            </div>
            
            <div className="space-y-4 font-mono text-xs text-zinc-300">
              <p className="text-left">
                Ngày mai hiện đang có <strong className="text-amber-400 font-bold">{conflictBookings.length} đơn đặt lịch</strong> nằm ngoài khung giờ hoạt động mới bạn vừa chọn:
              </p>
              
              <ul className="max-h-36 overflow-y-auto border border-zinc-800 bg-black/50 p-3 space-y-1 text-zinc-400 text-left">
                {conflictBookings.map((id) => (
                  <li key={id} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-amber-400" />
                    {id}
                  </li>
                ))}
              </ul>

              <p className="leading-relaxed text-left">
                Nếu bạn tiếp tục lưu cấu hình này, hệ thống sẽ <strong className="text-rose-400 font-black">tự động hủy các đơn đặt lịch trên và hoàn lại 100% tiền cọc</strong> vào ví của khách hàng.
              </p>

              <p className="text-zinc-500 uppercase tracking-widest text-[9px] font-black border-t border-zinc-800 pt-3 text-left">
                Bạn có muốn tiếp tục lưu và ghi đè không?
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setShowWarningModal(false);
                  setConflictBookings([]);
                }}
                className="border border-zinc-850 bg-zinc-900 px-4 py-2 font-bold uppercase tracking-wider text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(null, true)}
                className="border border-amber-500/50 bg-amber-500/10 px-4 py-2 font-black uppercase tracking-wider text-amber-200 hover:bg-amber-500/20 transition disabled:opacity-50"
              >
                {loading ? "Đang ghi đè..." : "Tiếp Tục Lưu & Hủy Đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
