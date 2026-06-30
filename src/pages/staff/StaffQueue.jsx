import { useEffect, useState } from "react";
import StaffNavbar from "../../components/StaffNavbar";
import { assignBay, completeBay, startWashBay, getBays, getQueue } from "../../services/staffQueueApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";

const TIER_BADGE = {
  Platinum: "border-[#6ff6df] text-[#6ff6df] bg-[#123746]",
  Gold: "border-[#4edea3] text-[#4edea3] bg-[#123746]",
  Silver: "border-[#4f7883] text-[#b8d8de] bg-[#123746]",
  Late: "border-[#ffb4ab]/50 text-[#ffb4ab] bg-[#93000a]/20",
};

const unwrapStaffPayload = (payload, keys = []) => {
  const data = payload?.data?.data ?? payload?.data ?? payload ?? {};
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

const formatStaffTime = (value) => {
  if (!value) return "";
  const text = String(value);
  if (text.includes("T")) return text.split("T")[1]?.slice(0, 5) || "";
  return text.slice(0, 5);
};

const normalizeQueueBooking = (booking = {}) => ({
  ...booking,
  id: booking.id ?? booking.bookingId,
  plate:
    booking.plate ||
    booking.vehicleLicensePlate ||
    booking.licensePlate ||
    booking.vehicle?.licensePlate ||
    "",
  checkinTime:
    booking.checkinTime ||
    booking.arrivedAt ||
    formatStaffTime(booking.scheduledStartTime || booking.time),
  time:
    booking.time ||
    formatStaffTime(booking.scheduledStartTime || booking.startTime),
  tier: booking.tier || booking.tierLevel || booking.status || "Member",
});

const normalizeBay = (bay = {}) => {
  const booking = bay.booking ? normalizeQueueBooking(bay.booking) : null;
  
  let status = "available";
  if (String(bay.status || "").toUpperCase() === "BUSY" || String(bay.status || "").toUpperCase() === "ACTIVE") {
    status = "active";
  } else if (String(bay.status || "").toUpperCase() === "READY_TO_WASH") {
    status = "ready_to_wash";
  }

  return {
    ...bay,
    id: bay.id ?? bay.bayId,
    name: bay.name || `Bay ${bay.id ?? bay.bayId ?? ""}`.trim(),
    type: bay.type || "Khoang rửa",
    status,
    currentCar: booking
      ? {
          ...booking,
          progress: booking.progress ?? 50,
        }
      : null,
  };
};

function QueueCard({ item, onAssign, isSelected }) {
  const badgeClass =
    TIER_BADGE[item.tier] || "border-[#4f7883] text-[#b8d8de] bg-[#123746]";
  return (
    <div
      className={`staff-panel rounded-3xl p-4 flex items-center justify-between transition-all ${
        isSelected
          ? "border-[#6ff6df] bg-[#6ff6df]/10 shadow-[0_0_24px_rgba(94,234,212,0.14)]"
          : ""
      }`}
    >
      <div>
        <div
          className="text-[18px] font-bold tracking-wider text-[#ecfeff]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {item.plate}
        </div>
        <div className="text-[12px] text-[#b8d8de] mt-1">
          Check-in: {item.checkinTime || item.time}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`border px-2 py-0.5 text-[10px] font-bold rounded uppercase ${badgeClass}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {item.tier}
        </span>
        <button
          type="button"
          onClick={onAssign}
          className={`border text-[11px] font-bold px-3 py-1.5 rounded uppercase transition-colors ${
            isSelected
              ? "bg-[#6ff6df] text-[#06343a] border-[#6ff6df]"
              : "border-[#6ff6df] text-[#6ff6df] hover:bg-[#6ff6df]/10"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {isSelected ? "Đang chọn" : "Điều phối"}
        </button>
      </div>
    </div>
  );
}

function BayCard({ bay, onComplete, onStartWash, onAssignToBay, hasSelectedCar, disabled }) {
  return (
    <div
      className={`staff-panel rounded-3xl p-5 flex flex-col justify-between min-h-[220px] transition-all duration-300 ${
        bay.status === "active"
          ? "staff-scanline border-[#4edea3] bg-[#123746] shadow-[0_0_22px_rgba(78,222,163,0.08)]"
          : bay.status === "ready_to_wash"
            ? "border-[#72f3ff] bg-[#102e3f] shadow-[0_0_22px_rgba(114,243,255,0.08)]"
            : hasSelectedCar
              ? "border-[#6ff6df] bg-[#6ff6df]/8 border-dashed animate-pulse"
              : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3
            className="text-[18px] font-bold text-[#ecfeff]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {bay.name}
          </h3>
          <p className="text-[12px] text-[#b8d8de] mt-0.5">{bay.type}</p>
        </div>
        <span
          className={`text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
            bay.status === "active"
              ? "border-[#4edea3] text-[#4edea3] bg-[#4edea3]/5"
              : bay.status === "ready_to_wash"
                ? "border-[#72f3ff] text-[#72f3ff] bg-[#72f3ff]/5"
                : "border-[#4f7883] text-[#b8d8de]"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {bay.status === "active" ? "ĐANG RỬA" : bay.status === "ready_to_wash" ? "CHỜ RỬA" : "TRỐNG"}
        </span>
      </div>

      {bay.status === "active" ? (
        <div className="my-4 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span
              className="font-bold text-[#4edea3]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {bay.currentCar?.plate}
            </span>
            <span
              className="text-[#b8d8de]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {bay.currentCar?.progress || 0}%
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#1a2436] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4edea3] transition-all duration-500"
              style={{ width: `${bay.currentCar?.progress || 0}%` }}
            ></div>
          </div>
        </div>
      ) : bay.status === "ready_to_wash" ? (
        <div className="my-4 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span
              className="font-bold text-[#72f3ff]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {bay.currentCar?.plate}
            </span>
            <span
              className="text-[#b8d8de] text-xs font-semibold uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Chờ bắt đầu
            </span>
          </div>
          <div className="text-[12px] text-[#9fb7c9] line-clamp-2 mt-1">
            Dịch vụ: {bay.currentCar?.service}
          </div>
        </div>
      ) : (
        <div className="my-6 text-center text-[#b8d8de] text-[13px] border border-dashed border-[#244653] py-3 rounded-2xl bg-[#0b2532]/55">
          {hasSelectedCar
            ? "Khoang trống sẵn sàng tiếp nhận"
            : "Sẵn sàng tiếp nhận xe mới từ hàng đợi"}
        </div>
      )}

      <div className="border-t border-[#244653] pt-3 flex justify-end min-h-[40px] gap-2">
        {bay.status === "active" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onComplete}
            className="bg-[#4edea3] text-[#003822] text-[12px] font-bold px-4 py-2 rounded uppercase hover:bg-[#62f2b8] transition-all disabled:opacity-50"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Hoàn thành
          </button>
        ) : bay.status === "ready_to_wash" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onStartWash}
            className="bg-[#72f3ff] text-[#061427] text-[12px] font-bold px-4 py-2 rounded uppercase hover:bg-[#a5f7ff] transition-all disabled:opacity-50"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Bắt đầu rửa
          </button>
        ) : (
          hasSelectedCar && (
            <button
              type="button"
              disabled={disabled}
              onClick={onAssignToBay}
              className="bg-[#6ff6df] text-[#06343a] text-[12px] font-bold px-4 py-2 rounded-2xl uppercase hover:bg-[#9fffee] transition-all shadow-[0_0_10px_rgba(94,234,212,0.2)]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Vào khoang này
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function StaffQueue() {
  const [queue, setQueue] = useState([]);
  const [bays, setBays] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchQueueAndBays = async () => {
    setLoading(true);
    setError("");
    try {
      const [queueRes, baysRes] = await Promise.all([
        getQueue(),
        getBays(),
      ]);

      setQueue(
        unwrapStaffPayload(queueRes, ["items", "queue", "bookings"]).map(
          normalizeQueueBooking,
        ),
      );
      setBays(
        unwrapStaffPayload(baysRes, ["items", "bays"]).map(normalizeBay),
      );
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          "Không thể đồng bộ dữ liệu khoang rửa và hàng đợi.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueAndBays();
  }, []);

  const handleAssignToBay = async (bayId) => {
    if (!selectedCar || !bayId) return;
    setSubmitLoading(true);
    try {
      await assignBay(bayId, {
        bookingId: selectedCar.id || selectedCar._id,
        queueId: selectedCar.id || selectedCar._id,
        plate: selectedCar.plate,
      });
      setSelectedCar(null);
      fetchQueueAndBays();
    } catch (err) {
      alert(
        getFriendlyErrorMessage(
          err,
          "Gặp lỗi khi điều phối xe vào khoang. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCompleteWash = async (bayId) => {
    if (!bayId) return;
    const ok = window.confirm("Bạn có chắc chắn muốn HOÀN THÀNH quá trình rửa xe và GIẢI PHÓNG khoang rửa này không?");
    if (!ok) return;
    setSubmitLoading(true);
    try {
      await completeBay(bayId);
      fetchQueueAndBays();
    } catch (err) {
      alert(
        getFriendlyErrorMessage(
          err,
          "Không thể cập nhật trạng thái hoàn thành. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStartWash = async (bayId) => {
    if (!bayId) return;
    const ok = window.confirm("Bạn có chắc chắn muốn BẮT ĐẦU rửa xe cho khoang này không?");
    if (!ok) return;
    setSubmitLoading(true);
    try {
      await startWashBay(bayId);
      fetchQueueAndBays();
    } catch (err) {
      alert(
        getFriendlyErrorMessage(
          err,
          "Không thể bắt đầu rửa xe. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="staff-motion-root min-h-screen text-white lg:pl-64">
      <StaffNavbar />
      <div className="staff-shell flex-1 flex flex-col min-w-0">
        <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <header className="staff-reveal border-b border-cyan-100/15 pb-5">
            <h1
              className="text-[28px] font-bold text-[#ecfeff] tracking-wide"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ĐIỀU PHỐI KHOANG DỊCH VỤ
            </h1>
          </header>

          {error && (
            <div className="p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start flex-1">
            {/* LEFT Column - Hàng đợi điều phối */}
            <section className="staff-reveal w-full lg:w-[35%] flex flex-col gap-4" style={{ animationDelay: "80ms" }}>
              <div className="flex justify-between items-center mb-1">
                <h2
                  className="text-[20px] font-semibold text-[#ecfeff]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Hàng Đợi Điều Phối
                </h2>
                <span
                  className="bg-[#244653] border border-[#4f7883] px-2 py-1 rounded-2xl text-[#6ff6df] text-[12px] font-bold tracking-widest"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {queue.length} XE ĐANG CHỜ
                </span>
              </div>

              {loading ? (
                <p className="staff-panel rounded-3xl text-sm text-[#6ff6df] italic border-dashed p-6 text-center animate-pulse">
                  Đang tải dữ liệu hàng đợi...
                </p>
              ) : queue.length === 0 ? (
                <p className="staff-panel rounded-3xl text-sm text-[#b8d8de] border-dashed p-6 text-center">
                  Hàng đợi đang trống.
                </p>
              ) : (
                queue.map((item, index) => (
                  <div
                    key={item.id || item._id}
                    className="staff-reveal"
                    style={{ animationDelay: `${140 + index * 55}ms` }}
                  >
                    <QueueCard
                      item={item}
                      isSelected={
                        selectedCar?.id === item.id ||
                        selectedCar?._id === item._id
                      }
                      onAssign={() =>
                        setSelectedCar(
                          selectedCar?.id === item.id ||
                            selectedCar?._id === item._id
                            ? null
                            : item,
                        )
                      }
                    />
                  </div>
                ))
              )}
            </section>

            {/* RIGHT Column - Danh sách khoang dịch vụ */}
            <section className="staff-reveal w-full lg:w-[65%] flex flex-col gap-4" style={{ animationDelay: "140ms" }}>
              <div className="flex justify-between items-center mb-1">
                <h2
                  className="text-[20px] font-semibold text-[#ecfeff]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Trạng Thái Khoang Rửa
                </h2>
              </div>

              {loading ? (
                <p className="staff-panel rounded-3xl text-sm text-[#6ff6df] italic border-dashed p-6 text-center animate-pulse">
                  Đang kiểm tra trạng thái các khoang...
                </p>
              ) : bays.length === 0 ? (
                <p className="staff-panel rounded-3xl text-sm text-[#b8d8de] border-dashed p-6 text-center">
                  Chưa có khoang rửa nào.
                </p>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
                  {bays.map((bay, index) => (
                    <div
                      key={bay.id || bay._id}
                      className="staff-reveal"
                      style={{ animationDelay: `${180 + index * 70}ms` }}
                    >
                      <BayCard
                        bay={bay}
                        disabled={submitLoading}
                        hasSelectedCar={!!selectedCar}
                        onComplete={() => handleCompleteWash(bay.id || bay._id)}
                        onStartWash={() => handleStartWash(bay.id || bay._id)}
                        onAssignToBay={() => handleAssignToBay(bay.id || bay._id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
