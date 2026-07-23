import { useEffect, useState } from "react";
import StaffNavbar from "../../components/StaffNavbar";
import CompleteWashConfirmationModal from "../../components/staff/CompleteWashConfirmationModal";
import StartWashConfirmationModal from "../../components/staff/StartWashConfirmationModal";
import { assignBay, completeBay, startWashBay, getBays, getQueue } from "../../services/staffQueueApi";
import { requestCancelBooking } from "../../services/staffBookingApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";
import { formatLicensePlate } from "../../utils/licensePlate";

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

const getNewestValue = (item = {}) => {
  const raw =
    item.createdAt ||
    item.updatedAt ||
    item.arrivedAt ||
    item.scheduledStartTime ||
    item.dateTime ||
    item.startTime ||
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

const parseStaffDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getServiceDurationMinutes = (service) =>
  Number(
    service?.durationMinutes ??
      service?.duration ??
      service?.actualDurationMinutes ??
      service?.serviceDurationMinutes ??
      0,
  );

const getBookingDurationMinutes = (booking = {}) => {
  if (!booking) return 30;
  const directDuration = Number(
    booking.durationMinutes ??
      booking.actualDurationMinutes ??
      booking.totalDurationMinutes ??
      0,
  );
  if (directDuration > 0) return directDuration;

  const services = Array.isArray(booking.services) ? booking.services : [];
  const serviceDuration = services.reduce(
    (total, service) => total + getServiceDurationMinutes(service),
    0,
  );
  return serviceDuration > 0 ? serviceDuration : 30;
};

const getBookingStartDate = (booking = {}) => {
  if (!booking) return null;
  return parseStaffDate(
    booking.washStartedAt ||
      booking.arrivedAt ||
      booking.startedAt ||
      booking.startTime ||
      booking.scheduledStartTime ||
      booking.createdAt,
  );
};

const getBookingEndDate = (booking = {}) => {
  if (!booking) return null;
  const explicitEnd = parseStaffDate(
    booking.expectedEndTime ||
      booking.estimatedEndTime ||
      booking.endTime ||
      booking.scheduledEndTime,
  );
  if (explicitEnd) return explicitEnd;

  const startDate = getBookingStartDate(booking);
  if (!startDate) return null;
  return new Date(startDate.getTime() + getBookingDurationMinutes(booking) * 60_000);
};

const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const normalizeQueueBooking = (booking = {}) => ({
  ...booking,
  id: booking.id ?? booking.bookingId,
  plate: formatLicensePlate(
    booking.plate ||
      booking.vehicleLicensePlate ||
      booking.licensePlate ||
      booking.vehicle?.licensePlate ||
      "",
  ),
  checkinTime:
    booking.checkinTime ||
    booking.arrivedAt ||
    formatStaffTime(booking.scheduledStartTime || booking.time),
  time:
    booking.time ||
    formatStaffTime(booking.scheduledStartTime || booking.startTime),
  tier: booking.tier || booking.tierLevel || booking.status || "Member",
  services: Array.isArray(booking.services)
    ? booking.services
    : booking.service
      ? [booking.service]
      : [],
  durationMinutes: getBookingDurationMinutes(booking),
  washStartedAt:
    booking.washStartedAt ||
    booking.arrivedAt ||
    booking.startedAt ||
    booking.scheduledStartTime ||
    booking.createdAt,
  expectedEndTime:
    booking.expectedEndTime ||
    booking.estimatedEndTime ||
    booking.endTime ||
    booking.scheduledEndTime,
  cancelRequestStatus:
    booking.cancelRequestStatus ||
    booking.cancelStatus ||
    booking.cancellationRequestStatus ||
    "",
  cancelRequestReason:
    booking.cancelRequestReason ||
    booking.cancelReason ||
    booking.cancellationReason ||
    "",
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

const getQueueItemKey = (item) => {
  if (!item) return "";
  return String(item.id ?? item._id ?? item.bookingId ?? item.queueId ?? item.plate ?? "");
};

function QueueCard({ item, onSelect, isSelected, onRequestCancel }) {
  const badgeClass =
    TIER_BADGE[item.tier] || "border-[#4f7883] text-[#b8d8de] bg-[#123746]";
  const cancelPending =
    String(item.cancelRequestStatus || "").toUpperCase() === "PENDING";
  return (
    <div
      className={`staff-panel w-full rounded-2xl p-4 text-left transition-all ${
        cancelPending
          ? "border-amber-300/50 bg-amber-300/5"
          : isSelected
            ? "border-[#6ff6df] bg-[#6ff6df]/10 shadow-[0_0_24px_rgba(94,234,212,0.14)]"
            : "hover:border-[#6ff6df]/70 hover:bg-[#6ff6df]/5"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span
            className={`mb-2 inline-flex border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${badgeClass}`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {item.tier}
          </span>
          <div
            className="text-[18px] font-bold tracking-wider text-[#ecfeff]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {item.plate}
          </div>
          <div className="mt-1 text-[12px] text-[#b8d8de]">
            Check-in: {item.checkinTime || item.time || "--:--"}
          </div>
        </div>
        <span
          className="material-symbols-outlined text-[20px] text-[#6ff6df]"
        >
          local_car_wash
        </span>
      </div>
      {cancelPending && (
        <div
          className="mb-2 rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-amber-200"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Chờ duyệt hủy
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={cancelPending}
          onClick={onSelect}
          className={`w-full rounded-xl py-2 text-center text-[11px] font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
            isSelected
              ? "bg-[#6ff6df] text-[#06343a]"
              : "border border-[#244653] text-[#b8d8de]"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {isSelected ? "Đang chọn" : "Chọn điều phối"}
        </button>
        <button
          type="button"
          disabled={cancelPending}
          onClick={onRequestCancel}
          className="w-full rounded-xl border border-rose-300/40 bg-rose-300/10 py-2 text-center text-[11px] font-bold uppercase tracking-widest text-rose-200 transition-colors hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-45"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Yêu cầu hủy
        </button>
      </div>
    </div>
  );
}

function BayCard({ bay, selectedCar, onComplete, onStartWash, onAssignToBay, hasSelectedCar, disabled, now }) {
  const serviceNames = (bay.currentCar?.services || [])
    .map((service) =>
      typeof service === "string"
        ? service
        : service?.serviceName || service?.name || service?.label,
    )
    .filter(Boolean);
  const progress = Math.max(0, Math.min(100, Number(bay.currentCar?.progress ?? 55)));
  const startDate = getBookingStartDate(bay.currentCar);
  const endDate = getBookingEndDate(bay.currentCar);
  const totalDuration = startDate && endDate ? endDate.getTime() - startDate.getTime() : 0;
  const remaining = endDate ? endDate.getTime() - now : 0;
  const countdownProgress =
    totalDuration > 0
      ? Math.max(0, Math.min(100, (remaining / totalDuration) * 100))
      : progress;
  const timerLabel = endDate ? formatCountdown(remaining) : "--:--";
  return (
    <div
      className={`staff-panel rounded-2xl p-4 flex min-h-[280px] flex-col justify-between transition-all duration-300 ${
        bay.status === "active"
          ? "staff-scanline border-amber-400/70 bg-[#172033] shadow-[0_0_28px_rgba(251,191,36,0.12)]"
          : hasSelectedCar
            ? "border-[#6ff6df] bg-[#6ff6df]/8 border-dashed"
            : "border-dashed border-[#244653] bg-[#0c1725]/55"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3
            className="text-[15px] font-bold uppercase tracking-widest text-[#ecfeff]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {bay.name}
          </h3>
          <p className="text-[12px] text-[#b8d8de] mt-0.5">{bay.type}</p>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
            bay.status === "active"
              ? "border-amber-300/50 text-amber-200 bg-amber-300/10"
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
        <div className="my-5 flex flex-1 flex-col justify-between gap-5">
          <div>
            <div
              className="text-[22px] font-black tracking-widest text-[#ecfeff]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {bay.currentCar?.plate || "-"}
            </div>
            <p className="mt-1 text-xs font-semibold text-[#b8d8de]">
              {bay.currentCar?.model || bay.currentCar?.vehicleModel || ""}
            </p>
          </div>
          <div className="rounded-xl border border-[#244653] bg-[#071620]/80 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-[10px] font-black uppercase tracking-widest text-[#8df9ef]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Dịch vụ đã chọn
              </span>
              <span className="text-[10px] font-bold text-[#b8d8de]">
                {serviceNames.length} mục
              </span>
            </div>
            <div className="space-y-1.5">
              {(serviceNames.length ? serviceNames : ["Đang cập nhật dịch vụ"]).slice(0, 3).map((name) => (
                <div key={name} className="flex items-center gap-2 text-[12px] font-semibold text-[#ecfeff]">
                  <span className="material-symbols-outlined text-[15px] text-[#6ff6df]">
                    check_circle
                  </span>
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div
              className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#f59e0b ${countdownProgress * 3.6}deg, #1a2436 0deg)`,
              }}
            >
              <div className="absolute inset-[8px] rounded-full bg-[#172033] shadow-[inset_0_0_18px_rgba(0,0,0,0.45)]"></div>
              <div className="relative text-center">
                <div
                  className="text-[22px] font-black tracking-widest text-amber-300"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {timerLabel}
                </div>
                <div
                  className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-[#b8d8de]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Còn lại
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : bay.status === "ready_to_wash" ? (
        <div className="my-5 flex flex-1 flex-col justify-between gap-5">
          <div>
            <div
              className="text-[22px] font-black tracking-widest text-[#72f3ff]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {bay.currentCar?.plate || "-"}
            </div>
            <p className="mt-1 text-xs font-semibold text-[#b8d8de]">
              {bay.currentCar?.model || bay.currentCar?.vehicleModel || ""}
            </p>
          </div>
          <div className="rounded-xl border border-[#244653] bg-[#071620]/80 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-[10px] font-black uppercase tracking-widest text-[#72f3ff]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Dịch vụ chờ rửa
              </span>
              <span className="text-[10px] font-bold text-[#b8d8de]">
                {serviceNames.length} mục
              </span>
            </div>
            <div className="space-y-1.5">
              {(serviceNames.length ? serviceNames : ["Đang cập nhật dịch vụ"]).slice(0, 3).map((name) => (
                <div key={name} className="flex items-center gap-2 text-[12px] font-semibold text-[#ecfeff]">
                  <span className="material-symbols-outlined text-[15px] text-[#72f3ff]">
                    check_circle
                  </span>
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center py-2 text-center text-[#72f3ff] text-xs font-bold font-sans">
            <span className="material-symbols-outlined animate-pulse mr-1">
              pause_circle
            </span>
            Sẵn sàng bắt đầu
          </div>
        </div>
      ) : (
        <div className="my-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#244653] bg-[#0b2532]/35 p-5 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-[#4f7883]">
            <span className="material-symbols-outlined text-[34px]">
              local_shipping
            </span>
          </div>
          <p className="font-bold text-[#ecfeff]">Khoang trống</p>
          <p className="mt-2 max-w-[220px] text-[12px] leading-5 text-[#b8d8de]">
            {hasSelectedCar
              ? `Sẵn sàng nhận ${selectedCar?.plate || "xe đã chọn"}`
              : "Sẵn sàng nhận xe tiếp theo từ hàng đợi."}
          </p>
        </div>
      )}

      <div className="border-t border-[#244653] pt-3 flex justify-end min-h-[40px] gap-2">
        {bay.status === "active" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onComplete}
            className="w-full rounded-xl bg-[#4edea3] px-4 py-2 text-[11px] font-bold uppercase text-[#003822] transition-all hover:bg-[#62f2b8] disabled:opacity-50"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Hoàn tất rửa & giao xe
          </button>
        ) : bay.status === "ready_to_wash" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onStartWash}
            className="w-full rounded-xl bg-[#72f3ff] px-4 py-2 text-[11px] font-bold uppercase text-[#061427] transition-all hover:bg-[#a5f7ff] disabled:opacity-50"
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
              className="w-full bg-[#6ff6df] text-[#06343a] text-[11px] font-bold px-4 py-2 rounded-xl uppercase hover:bg-[#9fffee] transition-all shadow-[0_0_10px_rgba(94,234,212,0.2)] disabled:opacity-50"
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
  const [now, setNow] = useState(() => Date.now());
  const [startWashBayTarget, setStartWashBayTarget] = useState(null);
  const [startWashLoading, setStartWashLoading] = useState(false);
  const [startWashError, setStartWashError] = useState("");
  const [completeWashBayTarget, setCompleteWashBayTarget] = useState(null);
  const [completeWashLoading, setCompleteWashLoading] = useState(false);
  const [completeWashError, setCompleteWashError] = useState("");
  const [cancelRequestTarget, setCancelRequestTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);
  const [cancelRequestError, setCancelRequestError] = useState("");
  const [toast, setToast] = useState("");

  const fetchQueueAndBays = async () => {
    setLoading(true);
    setError("");
    try {
      const [queueRes, baysRes] = await Promise.all([
        getQueue(),
        getBays(),
      ]);

      setQueue(
        sortNewestFirst(
          unwrapStaffPayload(queueRes, ["items", "queue", "bookings"]).map(
            normalizeQueueBooking,
          ),
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

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timerId);
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
      setError(
        getFriendlyErrorMessage(
          err,
          "Gặp lỗi khi điều phối xe vào khoang. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSelectCar = (item) => {
    if (String(item?.cancelRequestStatus || "").toUpperCase() === "PENDING") return;
    const currentKey = getQueueItemKey(selectedCar);
    const nextKey = getQueueItemKey(item);
    setSelectedCar(currentKey && currentKey === nextKey ? null : item);
  };

  const openCompleteWashModal = (bay) => {
    if (!bay?.id && !bay?._id) return;
    setCompleteWashBayTarget(bay);
    setCompleteWashError("");
  };

  const openCancelRequestModal = (item) => {
    setCancelRequestTarget(item);
    setCancelReason("");
    setCancelRequestError("");
  };

  const closeCancelRequestModal = () => {
    if (cancelRequestLoading) return;
    setCancelRequestTarget(null);
    setCancelReason("");
    setCancelRequestError("");
  };

  const submitCancelRequest = async () => {
    const bookingId = cancelRequestTarget?.id || cancelRequestTarget?.bookingId;
    if (!bookingId || !cancelReason.trim() || cancelRequestLoading) return;
    setCancelRequestLoading(true);
    setCancelRequestError("");
    try {
      await requestCancelBooking(bookingId, cancelReason.trim());
      setToast("Đã gửi yêu cầu hủy lịch cho Admin");
      setCancelRequestTarget(null);
      setCancelReason("");
      await fetchQueueAndBays();
      window.setTimeout(() => setToast(""), 2800);
    } catch (err) {
      setCancelRequestError(
        getFriendlyErrorMessage(
          err,
          "Không thể gửi yêu cầu hủy lịch. Vui lòng thử lại.",
        ),
      );
    } finally {
      setCancelRequestLoading(false);
    }
  };

  const closeCompleteWashModal = () => {
    if (completeWashLoading) return;
    setCompleteWashBayTarget(null);
    setCompleteWashError("");
  };

  const confirmCompleteWash = async () => {
    const bayId = completeWashBayTarget?.id || completeWashBayTarget?._id;
    if (!bayId || completeWashLoading) return;
    setCompleteWashLoading(true);
    setCompleteWashError("");
    try {
      await completeBay(bayId);
      setCompleteWashBayTarget(null);
      setToast("Đã hoàn thành rửa xe và giải phóng khoang");
      await fetchQueueAndBays();
      window.setTimeout(() => setToast(""), 2800);
    } catch (err) {
      setCompleteWashError(
        getFriendlyErrorMessage(
          err,
          "Không thể cập nhật trạng thái hoàn thành. Vui lòng thử lại.",
        ),
      );
    } finally {
      setCompleteWashLoading(false);
    }
  };

  const openStartWashModal = (bay) => {
    if (!bay?.id && !bay?._id) return;
    setStartWashBayTarget(bay);
    setStartWashError("");
  };

  const closeStartWashModal = () => {
    if (startWashLoading) return;
    setStartWashBayTarget(null);
    setStartWashError("");
  };

  const confirmStartWash = async () => {
    const bayId = startWashBayTarget?.id || startWashBayTarget?._id;
    if (!bayId || startWashLoading) return;
    setStartWashLoading(true);
    setStartWashError("");
    try {
      await startWashBay(bayId);
      setStartWashBayTarget(null);
      setToast("Đã bắt đầu rửa xe thành công");
      await fetchQueueAndBays();
      window.setTimeout(() => setToast(""), 2800);
    } catch (err) {
      setStartWashError(
        getFriendlyErrorMessage(
          err,
          "Không thể bắt đầu rửa xe. Vui lòng thử lại.",
        ),
      );
    } finally {
      setStartWashLoading(false);
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

          {toast && (
            <div className="fixed right-4 top-4 z-[95] rounded-2xl border border-[#6ff6df]/30 bg-[#071620] px-5 py-3 text-sm font-bold text-[#ecfeff] shadow-[0_18px_48px_rgba(0,0,0,0.35)] sm:right-6 sm:top-6">
              <span className="mr-2 text-[#6ff6df]">✓</span>
              {toast}
            </div>
          )}

          <div className="grid flex-1 items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            {/* LEFT Column - Hàng đợi điều phối */}
            <section className="staff-reveal flex w-full flex-col gap-4" style={{ animationDelay: "80ms" }}>
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
                      isSelected={getQueueItemKey(selectedCar) === getQueueItemKey(item)}
                      onSelect={() => handleSelectCar(item)}
                      onRequestCancel={() => openCancelRequestModal(item)}
                    />
                  </div>
                ))
              )}
            </section>

            {/* RIGHT Column - Danh sách khoang dịch vụ */}
            <section className="staff-reveal flex w-full min-w-0 flex-col gap-4" style={{ animationDelay: "140ms" }}>
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
                <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                  {bays.map((bay, index) => (
                    <div
                      key={bay.id || bay._id}
                      className="staff-reveal"
                      style={{ animationDelay: `${180 + index * 70}ms` }}
                    >
                      <BayCard
                        bay={bay}
                        disabled={submitLoading || startWashLoading || completeWashLoading}
                        now={now}
                        selectedCar={selectedCar}
                        hasSelectedCar={!!selectedCar}
                        onComplete={() => openCompleteWashModal(bay)}
                        onStartWash={() => openStartWashModal(bay)}
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

      <StartWashConfirmationModal
        isOpen={!!startWashBayTarget}
        bay={startWashBayTarget}
        vehicle={startWashBayTarget?.currentCar}
        services={startWashBayTarget?.currentCar?.services || []}
        isLoading={startWashLoading}
        error={startWashError}
        onConfirm={confirmStartWash}
        onClose={closeStartWashModal}
      />
      <CompleteWashConfirmationModal
        isOpen={!!completeWashBayTarget}
        bay={completeWashBayTarget}
        vehicle={completeWashBayTarget?.currentCar}
        services={completeWashBayTarget?.currentCar?.services || []}
        isLoading={completeWashLoading}
        error={completeWashError}
        onConfirm={confirmCompleteWash}
        onClose={closeCompleteWashModal}
      />
      {cancelRequestTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeCancelRequestModal}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[#6ff6df]/25 bg-[#071620] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-4xl text-amber-300">
                report
              </span>
              <div>
                <h3
                  className="text-xl font-black uppercase tracking-wide text-[#ecfeff]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Yêu cầu hủy lịch hẹn
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#b8d8de]">
                  Hành động này cần được Admin phê duyệt. Vui lòng nhập lý do hủy chi tiết.
                </p>
                <p
                  className="mt-3 text-xs font-black uppercase tracking-widest text-[#6ff6df]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {cancelRequestTarget.plate || "-"} • {cancelRequestTarget.time || "--:--"}
                </p>
              </div>
            </div>
            <label className="mt-5 block text-[11px] font-black uppercase tracking-widest text-[#8df9ef]">
              Lý do hủy
            </label>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-[#244653] bg-[#07111b] p-4 text-sm font-semibold text-[#ecfeff] outline-none transition focus:border-[#6ff6df]"
              placeholder="Nhập lý do hủy (ví dụ: Khoang chuyên sâu gặp sự cố kĩ thuật...)"
            />
            {cancelRequestError && (
              <div className="mt-3 rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm font-semibold text-rose-200">
                {cancelRequestError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={cancelRequestLoading}
                onClick={closeCancelRequestModal}
                className="rounded-2xl border border-[#244653] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#b8d8de] transition hover:border-[#6ff6df] disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={cancelRequestLoading || !cancelReason.trim()}
                onClick={submitCancelRequest}
                className="rounded-2xl bg-[#6ff6df] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#06343a] transition hover:bg-[#9fffee] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelRequestLoading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
