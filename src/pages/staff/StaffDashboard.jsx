import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import StaffNavbar from "../../components/StaffNavbar";
import ArrivalConfirmationModal from "../../components/staff/ArrivalConfirmationModal";
import {
  confirmPendingAppointment,
  getPendingAppointments,
} from "../../services/staffDashboardApi";
import {
  checkInBookingByQr,
  requestCancelBooking,
} from "../../services/staffBookingApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";

const TIER_STYLES = {
  Platinum: "border-[#6ff6df] text-[#6ff6df] bg-[#6ff6df]/10",
  Gold: "border-[#4edea3] text-[#4edea3] bg-[#4edea3]/10",
  Silver: "border-[#4f7883] text-[#b8d8de] bg-[#123746]",
  Member: "border-[#4f7883] text-[#b8d8de] bg-[#123746]",
};

const unwrapStaffPayload = (payload, keys = []) => {
  const data = payload?.data?.data ?? payload?.data ?? payload ?? {};
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

function formatStaffTime(value) {
  if (!value) return "";
  const text = String(value);
  if (text.includes("T")) return text.split("T")[1]?.slice(0, 5) || "";
  return text.slice(0, 5);
}

const getNewestValue = (item = {}) => {
  const raw =
    item.createdAt ||
    item.updatedAt ||
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

const normalizeStaffBooking = (booking = {}) => {
  const services = Array.isArray(booking.services)
    ? booking.services
    : booking.service
      ? [booking.service]
      : [];
  const scheduledStartTime =
    booking.scheduledStartTime || booking.dateTime || booking.startTime || "";

  return {
    ...booking,
    id: booking.id ?? booking.bookingId,
    plate:
      booking.plate ||
      booking.vehicleLicensePlate ||
      booking.licensePlate ||
      booking.vehicle?.licensePlate ||
      "",
    time:
      booking.time ||
      booking.appointmentTime ||
      booking.bookingTime ||
      formatStaffTime(scheduledStartTime),
    service:
      booking.service ||
      booking.serviceName ||
      booking.packageName ||
      services.join(", "),
    services,
    tier: booking.tier || booking.tierLevel || booking.status || "Member",
    cancelRequestStatus: booking.cancelRequestStatus || "",
    cancelRequestReason: booking.cancelRequestReason || "",
  };
};

function PendingCard({ item, onSelect, onRequestCancel, active }) {
  const tierStyle = TIER_STYLES[item.tier] || TIER_STYLES.Member;
  const cancelPending = item.cancelRequestStatus === "PENDING";

  return (
    <div
      className={`group w-full rounded-md border p-3 text-left transition active:scale-[0.99] ${
        active
          ? "border-[#72f3ff] bg-[#102e3f] shadow-[0_0_0_1px_rgba(114,243,255,0.4),0_18px_44px_rgba(34,211,238,0.12)]"
          : "border-[#2b4058] bg-[#10192b] hover:border-[#45637f] hover:bg-[#132038]"
      }`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div
            className={`text-[14px] font-black leading-none tracking-wide ${
              active ? "text-[#72f3ff]" : "text-[#ecfeff]"
            }`}
          >
            {item.plate || "Chưa có biển số"}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#72f3ff]">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>Giờ hẹn: {item.time || "--:--"}</span>
          </div>
          {(item.status === "ARRIVED" || item.qrUsed) && item.arrivedAt && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#4edea3]">
              <span className="material-symbols-outlined text-[14px]">pin_drop</span>
              <span>Check-in: {formatStaffTime(item.arrivedAt)}</span>
            </div>
          )}
          {cancelPending ? (
            <p className="mt-2 inline-flex border border-amber-300/50 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-200">
              Chờ duyệt hủy
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${tierStyle}`}
        >
          {item.tier}
        </span>
      </div>

      <div className="mt-3 border-t border-[#2b4058] pt-2">
        <button
          type="button"
          disabled={cancelPending}
          onClick={() => onSelect(item)}
          className={`flex w-full items-center justify-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-50 ${
            active
              ? "bg-[#72e6ff] text-[#061427]"
              : "bg-white/8 text-[#9fb7c9] hover:bg-white/12"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {active ? "check_circle" : "qr_code_scanner"}
          </span>
          {active ? "Đã nhận mã quét" : "Chưa quét QR"}
        </button>
        <button
          type="button"
          disabled={cancelPending}
          onClick={() => onRequestCancel(item)}
          className="mt-2 flex w-full items-center justify-center gap-2 border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-200 transition hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">cancel</span>
          {cancelPending ? "Đang chờ duyệt" : "Yêu cầu hủy"}
        </button>
      </div>
    </div>
  );
}

function getAppointmentValue(item, keys, fallback = "Chưa có dữ liệu") {
  const value = keys
    .map((key) => item?.[key])
    .find((entry) => entry !== undefined && entry !== null && entry !== "");

  if (typeof value === "object") {
    return value.name || value.fullName || value.title || fallback;
  }

  return value || fallback;
}

function AppointmentSnapshot({ appointment, scannedCode }) {
  if (!appointment) {
    return (
      <div className="rounded-md border border-dashed border-[#35526c] bg-[#121d30] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#35526c] bg-[#0d1525] text-[#72f3ff]">
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </div>
          <div>
            <p
              className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#72f3ff]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Thông tin đặt lịch
            </p>
            {scannedCode ? (
              <p
                className="mt-2 break-all text-sm font-bold text-[#ecfeff]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Mã vừa quét: {scannedCode}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const plate = appointment.plate || "Chưa có biển số";
  const tier = appointment.tier || "Member";
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES.Member;

  return (
    <div className="rounded-md border border-[#31475e] bg-gradient-to-br from-[#1b2639] to-[#24364a] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.25)]">
      <div
        className="flex items-center gap-3 border-b border-white/10 pb-5 text-[#50f5a6]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <span className="material-symbols-outlined text-[22px]">
          check_circle
        </span>
        <p className="text-lg font-black uppercase tracking-wide">
          Kết quả quét: hợp lệ
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border border-[#31475e] bg-[#111a2b] p-4">
          <p
            className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9fb7c9]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Biển số xe
          </p>
          <p
            className="mt-2 text-lg font-black text-[#ecfeff]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {plate}
          </p>
        </div>
        <div className="border border-[#31475e] bg-[#111a2b] p-4">
          <p
            className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9fb7c9]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Hạng thành viên
          </p>
          <span
            className={`mt-2 inline-flex border px-2 py-1 text-[12px] font-black uppercase tracking-wider ${tierStyle}`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {tier}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanControlsRef = useRef(null);
  const qrReaderRef = useRef(null);
  const lastQrRef = useRef("");
  const [pendingList, setPendingList] = useState([]);
  const [scannedResult, setScannedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanWarning, setScanWarning] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [arrivalTarget, setArrivalTarget] = useState(null);
  const [arrivalError, setArrivalError] = useState("");
  const [cancelRequestTarget, setCancelRequestTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRequestError, setCancelRequestError] = useState("");
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);
  const [toast, setToast] = useState("");

  const fetchPendingAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getPendingAppointments();
      setPendingList(
        sortNewestFirst(
          unwrapStaffPayload(response, ["items", "bookings", "pending"]).map(
            normalizeStaffBooking,
          ),
        ),
      );
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          "Không thể tải danh sách lịch hẹn chờ. Vui lòng thử lại sau.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAppointments();
  }, []);

  const releaseScanner = () => {
    if (scanControlsRef.current) {
      scanControlsRef.current.stop();
      scanControlsRef.current = null;
    }
    if (videoRef.current) {
      const stream = videoRef.current.srcObject || streamRef.current;
      if (stream?.getTracks) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
    streamRef.current = null;
    qrReaderRef.current = null;
  };

  const stopCamera = () => {
    releaseScanner();
    lastQrRef.current = "";
    setCameraActive(false);
    setScanStatus("");
  };

  const startCamera = () => {
    setCameraError("");
    setScanWarning("");
    setScannedCode("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Trình duyệt hiện tại không hỗ trợ mở camera.");
      return;
    }

    setCameraActive(true);
    setScanStatus("Đang chờ QR/barcode...");
  };

  const normalizeScannedBooking = (payload) => ({
    ...normalizeStaffBooking(
      payload?.data?.data ?? payload?.data ?? payload ?? {},
    ),
    scanned: true,
  });

  const handleQrDetected = async (qrContent) => {
    if (!qrContent || submitLoading) return;
    if (lastQrRef.current === qrContent) return;

    lastQrRef.current = qrContent;
    setScannedCode(qrContent);
    setScanWarning("");
    releaseScanner();
    setCameraActive(false);
    setSubmitLoading(true);
    setScanStatus("Đã đọc mã, đang check-in...");
    try {
      const response = await checkInBookingByQr(qrContent);
      const booking = normalizeScannedBooking(response);
      setScannedResult(booking);
      setScanStatus("Check-in thành công.");
      fetchPendingAppointments();
    } catch (err) {
      setScanStatus("Đã đọc mã, backend chưa nhận.");
      const backendMessage = err.response?.data?.message;
      setScanWarning(
        backendMessage ||
          getFriendlyErrorMessage(
            err,
            "Đã đọc được mã, nhưng backend chưa check-in được mã này.",
          ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const startQrScanner = async () => {
    if (!videoRef.current) return;
    if (scanControlsRef.current) {
      scanControlsRef.current.stop();
      scanControlsRef.current = null;
    }

    try {
      const reader = new BrowserMultiFormatReader();
      qrReaderRef.current = reader;
      setScanStatus("Đang quét mã...");
      scanControlsRef.current = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        },
        videoRef.current,
        (result) => {
          if (result) {
            handleQrDetected(result.getText());
          }
        },
      );
      streamRef.current = videoRef.current.srcObject;
    } catch {
      setCameraActive(false);
      setScanStatus("");
      setCameraError(
        "Không thể mở chế độ quét mã. Hãy kiểm tra quyền camera của trình duyệt.",
      );
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current) {
      startQrScanner();
    }
  }, [cameraActive]);

  useEffect(() => () => stopCamera(), []);

  const openArrivalModal = (appointment) => {
    if (!appointment) return;
    setArrivalTarget(appointment);
    setArrivalError("");
  };

  const closeArrivalModal = () => {
    if (submitLoading) return;
    setArrivalTarget(null);
    setArrivalError("");
  };

  const handleConfirm = async () => {
    const id = arrivalTarget?.id || arrivalTarget?._id;
    if (!id) return;
    setSubmitLoading(true);
    setArrivalError("");
    try {
      await confirmPendingAppointment(id);

      setArrivalTarget(null);
      setScannedResult(null);
      setToast("Đã xác nhận xe đến và chuyển vào hàng đợi");
      await fetchPendingAppointments();
      window.setTimeout(() => setToast(""), 2800);
    } catch (err) {
      setArrivalError(
        getFriendlyErrorMessage(
          err,
          "Gặp lỗi trong quá trình tiếp nhận xe. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const openCancelRequestModal = (appointment) => {
    if (!appointment || appointment.cancelRequestStatus === "PENDING") return;
    setCancelRequestTarget(appointment);
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
    const id = cancelRequestTarget?.id || cancelRequestTarget?._id;
    const reason = cancelReason.trim();
    if (!id) return;
    if (!reason) {
      setCancelRequestError("Vui lòng nhập lý do yêu cầu hủy lịch.");
      return;
    }

    setCancelRequestLoading(true);
    setCancelRequestError("");
    try {
      await requestCancelBooking(id, reason);
      setToast("Đã gửi yêu cầu hủy lịch cho admin duyệt");
      setCancelRequestTarget(null);
      setCancelReason("");
      await fetchPendingAppointments();
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

  return (
    <div className="staff-motion-root min-h-screen text-white lg:pl-64">
      <StaffNavbar />
      <div className="staff-shell flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1220px] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-5">
          {error && (
            <div className="mb-4 rounded border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              {error}
            </div>
          )}

          {toast && (
            <div className="mb-4 rounded border border-[#6ff6df]/25 bg-[#6ff6df]/10 p-4 text-sm font-bold text-[#6ff6df]">
              {toast}
            </div>
          )}

          <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
            <div className="staff-reveal">
              <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-3">
                <div>
                  <h1
                    className="text-[22px] font-black leading-none text-[#ecfeff]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Lịch Hẹn Hôm Nay
                  </h1>
                  <p
                    className="mt-1 text-[14px] font-black uppercase text-[#72f3ff]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    (Pending)
                  </p>
                </div>
                <div className="border border-[#31475e] bg-[#172337] px-3 py-2 text-center">
                  <p
                    className="text-[10px] font-black uppercase tracking-widest text-[#9fb7c9]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Xe
                  </p>
                  <p
                    className="text-sm font-black text-[#ecfeff]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {pendingList.length}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="rounded-md border border-dashed border-[#31475e] bg-[#10192b] p-8 text-center text-[13px] text-[#72f3ff] animate-pulse">
                  Đang tải danh sách phương tiện chờ...
                </div>
              ) : pendingList.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#31475e] bg-[#10192b] p-8 text-center text-[13px] text-[#9fb7c9]">
                  Không có xe nào đang chờ.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingList.map((item, index) => (
                    <div
                      key={item.id || item._id}
                      className="staff-reveal"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <PendingCard
                        item={item}
                        active={
                          Boolean(scannedResult) &&
                          (scannedResult.id || scannedResult._id) ===
                            (item.id || item._id)
                        }
                        onSelect={(target) => setScannedResult(target)}
                        onRequestCancel={openCancelRequestModal}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="staff-reveal space-y-5"
              style={{ animationDelay: "80ms" }}
            >
              <div className="rounded-md border border-[#31475e] bg-[#192236] p-10 shadow-[0_22px_70px_rgba(0,0,0,0.24)]">
                <div className="mx-auto flex min-h-[430px] max-w-[540px] flex-col items-center justify-center">
                  <div className="staff-qr-frame relative flex h-[240px] w-[240px] items-center justify-center border border-[#72f3ff]/80 bg-[#0b101a] shadow-[0_0_0_1px_rgba(114,243,255,0.12)_inset]">
                    <span className="staff-qr-corner staff-qr-corner-tl pointer-events-none absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-[#72f3ff]" />
                    <span className="staff-qr-corner staff-qr-corner-tr pointer-events-none absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-[#72f3ff]" />
                    <span className="staff-qr-corner staff-qr-corner-bl pointer-events-none absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-[#72f3ff]" />
                    <span className="staff-qr-corner staff-qr-corner-br pointer-events-none absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-[#72f3ff]" />
                    {cameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      </>
                    ) : (
                      <span className="staff-qr-symbol material-symbols-outlined text-[54px] text-[#72f3ff]/35">
                        qr_code_2
                      </span>
                    )}
                    <div className="staff-qr-scan pointer-events-none absolute inset-x-0 h-px bg-[#72f3ff]/90 shadow-[0_0_22px_rgba(114,243,255,0.95)]" />
                    <div className="staff-qr-beam pointer-events-none absolute inset-x-3 h-16 bg-[#72f3ff]/10 blur-md" />
                    <div className="pointer-events-none absolute bottom-0 left-8 right-8 h-8 bg-[#72f3ff]/20 blur-xl" />
                  </div>

                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    className={`mt-8 flex items-center justify-center gap-2 border px-6 py-3 text-[12px] font-black uppercase tracking-widest transition ${
                      cameraActive
                        ? "border-[#3d536b] bg-[#111a2b] text-[#ecfeff] hover:bg-[#172337]"
                        : "border-[#20344d] bg-[#111a2b] text-[#ecfeff] hover:border-[#72f3ff]"
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {cameraActive ? "videocam_off" : "settings_input_antenna"}
                    </span>
                    {cameraActive ? scanStatus || "Tắt quét mã" : "Quét mã QR"}
                  </button>
                </div>
              </div>

              {cameraError && (
                <div className="rounded border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-300">
                  {cameraError}
                </div>
              )}

              {scanWarning && (
                <div className="rounded border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-[13px] font-semibold text-amber-100">
                  {scanWarning}
                </div>
              )}

              <AppointmentSnapshot
                appointment={scannedResult}
                scannedCode={scannedCode}
              />

              {scannedResult && (
                <>
                  <button
                    type="button"
                    disabled={submitLoading}
                    onClick={() => openArrivalModal(scannedResult)}
                    className="flex w-full items-center justify-center gap-3 bg-[#72e6ff] px-6 py-4 text-[16px] font-black text-[#061427] transition hover:bg-[#9ff4ff] disabled:bg-slate-700 disabled:text-slate-400"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span className="material-symbols-outlined">login</span>
                    {submitLoading ? "Đang tiếp nhận..." : "Xác nhận Đã Đến"}
                  </button>
                  <p className="mx-auto max-w-xl text-center text-[12px] font-medium italic text-[#c8d8e8]">
                    Lưu ý: Bấm nút này sẽ tự động chuyển xe sang hàng đợi ưu
                    tiên và xóa dữ liệu khỏi màn hình tiếp nhận hôm nay.
                  </p>
                </>
              )}
            </div>
          </section>
        </main>
      </div>

      <ArrivalConfirmationModal
        isOpen={!!arrivalTarget}
        appointment={arrivalTarget}
        isLoading={submitLoading}
        error={arrivalError}
        onConfirm={handleConfirm}
        onClose={closeArrivalModal}
      />

      {cancelRequestTarget ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCancelRequestModal();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#72f3ff]/25 bg-[#10192b] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.4)]">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[#72f3ff]">
              Yêu cầu hủy lịch
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">
              Gửi yêu cầu cho admin duyệt
            </h3>
            <p className="mt-2 text-sm text-[#9fb7c9]">
              {cancelRequestTarget.plate || "Chưa có biển số"} ·{" "}
              {cancelRequestTarget.service || "Chưa có dịch vụ"}
            </p>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={4}
              placeholder="Nhập lý do hủy lịch..."
              className="mt-5 w-full resize-none rounded-lg border border-[#31475e] bg-[#0b1220] p-4 text-sm font-semibold text-white outline-none placeholder:text-[#64748b] focus:border-[#72f3ff]"
            />
            {cancelRequestError ? (
              <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200">
                {cancelRequestError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelRequestModal}
                disabled={cancelRequestLoading}
                className="rounded-xl border border-[#31475e] px-5 py-3 text-sm font-black text-[#c8d8e8] transition hover:border-[#72f3ff]/60 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitCancelRequest}
                disabled={cancelRequestLoading}
                className="rounded-xl bg-rose-400 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-300 disabled:opacity-60"
              >
                {cancelRequestLoading ? "Đang gửi..." : "Gửi yêu cầu hủy"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes scan {
          0%   { top: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .staff-qr-frame {
          isolation: isolate;
          overflow: hidden;
          animation: staffQrGlow 2.8s ease-in-out infinite;
        }

        .staff-qr-frame::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(114, 243, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(114, 243, 255, 0.08) 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.28;
          transform: translate3d(0, 0, 0);
          animation: staffQrGrid 5s linear infinite;
          z-index: -1;
        }

        .staff-qr-frame::after {
          content: "";
          position: absolute;
          inset: -28%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(114, 243, 255, 0.2) 56deg,
            transparent 112deg,
            transparent 360deg
          );
          opacity: 0.5;
          animation: staffQrSweep 4.8s linear infinite;
          z-index: -1;
        }

        .staff-qr-scan {
          top: 14%;
          animation: staffQrScan 2.2s ease-in-out infinite;
        }

        .staff-qr-beam {
          top: 0;
          animation: staffQrBeam 2.2s ease-in-out infinite;
        }

        .staff-qr-symbol {
          animation: staffQrSymbol 1.7s ease-in-out infinite;
          filter: drop-shadow(0 0 14px rgba(114, 243, 255, 0.35));
        }

        .staff-qr-corner {
          animation: staffQrCorner 1.6s ease-in-out infinite;
          filter: drop-shadow(0 0 12px rgba(114, 243, 255, 0.7));
        }

        .staff-qr-corner-tr {
          animation-delay: 0.15s;
        }

        .staff-qr-corner-br {
          animation-delay: 0.3s;
        }

        .staff-qr-corner-bl {
          animation-delay: 0.45s;
        }

        @keyframes staffQrScan {
          0%,
          100% {
            top: 12%;
            opacity: 0.35;
          }
          50% {
            top: 88%;
            opacity: 1;
          }
        }

        @keyframes staffQrBeam {
          0%,
          100% {
            transform: translateY(6%);
            opacity: 0.08;
          }
          50% {
            transform: translateY(260%);
            opacity: 0.36;
          }
        }

        @keyframes staffQrCorner {
          0%,
          100% {
            opacity: 0.72;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        @keyframes staffQrSymbol {
          0%,
          100% {
            opacity: 0.28;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.68;
            transform: scale(1.06);
          }
        }

        @keyframes staffQrGrid {
          from {
            background-position: 0 0, 0 0;
          }
          to {
            background-position: 24px 24px, 24px 24px;
          }
        }

        @keyframes staffQrSweep {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes staffQrGlow {
          0%,
          100% {
            box-shadow:
              inset 0 0 0 1px rgba(114, 243, 255, 0.14),
              0 0 0 rgba(114, 243, 255, 0);
          }
          50% {
            box-shadow:
              inset 0 0 0 1px rgba(114, 243, 255, 0.34),
              0 0 34px rgba(114, 243, 255, 0.18);
          }
        }
      `}</style>
    </div>
  );
}
