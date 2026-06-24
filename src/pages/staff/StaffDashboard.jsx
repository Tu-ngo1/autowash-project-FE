import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import StaffNavbar from "../../components/StaffNavbar";
import {
  confirmPendingAppointment,
  getPendingAppointments,
} from "../../services/staffDashboardApi";
import { checkInBookingByQr } from "../../services/staffBookingApi";
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

const formatStaffTime = (value) => {
  if (!value) return "";
  const text = String(value);
  if (text.includes("T")) return text.split("T")[1]?.slice(0, 5) || "";
  return text.slice(0, 5);
};

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
  };
};

function PendingCard({ item, onConfirm, disabled }) {
  const tierStyle = TIER_STYLES[item.tier] || TIER_STYLES.Member;

  if (item.scanned) {
    return (
      <div className="staff-panel staff-scanline rounded-3xl p-5 relative flex flex-col justify-between min-h-[168px]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#6ff6df] shadow-[0_0_15px_#6ff6df] animate-[scan_2s_infinite_linear]" />
        <div className="flex justify-between items-start">
          <div>
            <div
              className="text-[12px] text-[#6ff6df] font-bold tracking-widest uppercase mb-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [ Đang quét AI... ]
            </div>
            <div
              className="text-[28px] font-bold text-white tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {item.plate}
            </div>
          </div>
          <span
            className={`border px-3 py-1 text-[11px] font-bold rounded tracking-widest uppercase ${tierStyle}`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {item.tier}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-[#244653] pt-3 text-[13px] text-[#b8d8de]">
          <span>Lịch hẹn: {item.time}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onConfirm(item.id || item._id)}
            className="text-[#6ff6df] font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
          >
            Tiếp nhận{" "}
            <span className="material-symbols-outlined text-[16px]">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-panel rounded-3xl p-5 flex flex-col justify-between min-h-[168px] opacity-80 hover:opacity-100 transition">
      <div className="flex justify-between items-start">
        <div>
          <div
            className="text-[12px] text-[#b8d8de] font-bold tracking-widest uppercase mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Chờ Check-in
          </div>
          <div
            className="text-[24px] font-bold text-[#ecfeff] tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {item.plate}
          </div>
        </div>
        <span
          className={`border px-2 py-0.5 text-[10px] font-bold rounded tracking-widest uppercase ${tierStyle}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {item.tier}
        </span>
      </div>
      <div className="flex justify-between items-center border-t border-[#244653] pt-3 text-[13px] text-[#b8d8de]">
        <span>Lịch hẹn: {item.time}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onConfirm(item.id || item._id)}
          className="text-[#b8d8de] hover:text-white font-medium flex items-center gap-1 disabled:opacity-50"
        >
          Quét tay
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
      <div className="rounded-3xl border border-dashed border-teal-100/30 bg-[#123746]/88 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-[#6ff6df]">
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </div>
          <div>
            <p
              className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#6ff6df]"
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

  const bookingCode = appointment.bookingCode || appointment.id || "";
  const customerName = getAppointmentValue(appointment, [
    "customerName",
    "fullName",
    "name",
    "customer",
    "user",
  ]);
  const customerPhone = getAppointmentValue(appointment, ["phone", "customerPhone", "phoneNumber"]);
  const appointmentTime = getAppointmentValue(appointment, ["time", "appointmentTime", "slot", "bookingTime"]);

  const isUnpaid = String(appointment.paymentStatus || "").toUpperCase() === "UNPAID";
  const paymentMethodText = String(appointment.paymentMethod || "").toUpperCase() === "CASH" ? "Tiền mặt" : appointment.paymentMethod || "Chưa rõ";
  const finalPrice = appointment.finalPrice ?? appointment.totalPrice ?? 0;
  const bayNumber = appointment.bayNumber;

  const services = Array.isArray(appointment.services) && appointment.services.length > 0
    ? appointment.services
    : appointment.service
      ? [appointment.service]
      : [];

  return (
    <div className="rounded-3xl border border-teal-100/30 bg-[#123746]/90 p-5 shadow-[inset_0_1px_0_rgba(236,254,255,0.1)]">
      {/* Header: Biển số & Hạng thành viên */}
      <div className="flex items-center justify-between border-b border-[#244653] pb-4">
        <div>
          {bookingCode && (
            <p
              className="text-[10px] font-bold text-teal-400 uppercase tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {bookingCode}
            </p>
          )}
          <h2
            className="text-3xl font-black tracking-wider text-white mt-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {plate}
          </h2>
        </div>
        <span
          className={`border px-3 py-1 text-[11px] font-bold rounded-2xl tracking-widest uppercase ${tierStyle}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {tier}
        </span>
      </div>

      {/* Cảnh báo thanh toán & Chỉ định khoang */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isUnpaid ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-red-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Yêu cầu thu tiền</p>
            <p className="text-lg font-black mt-1">THU {finalPrice.toLocaleString('vi-VN')}đ</p>
            <p className="text-xs text-[#fca5a5] mt-0.5">PT: {paymentMethodText}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-emerald-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Thanh toán</p>
            <p className="text-lg font-black mt-1">ĐÃ THANH TOÁN</p>
          </div>
        )}

        <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-3.5 text-cyan-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Khoang rửa</p>
          <p className="text-lg font-black mt-1">KHOANG SỐ {bayNumber || "Chưa chọn"}</p>
        </div>
      </div>

      {/* Danh sách Dịch vụ */}
      {services.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-1.5">Dịch vụ ({services.length})</p>
          <div className="flex flex-wrap gap-2">
            {services.map((svc, i) => (
              <span
                key={i}
                className="bg-white/10 border border-white/5 px-2.5 py-1 rounded-xl text-xs font-semibold text-[#ecfeff]"
              >
                {svc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Thông tin khách hàng & Giờ hẹn ở dưới cùng */}
      <div className="mt-4 pt-3 border-t border-[#244653] flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-[#b8d8de] font-semibold">
        <span>KH: {customerName} {customerPhone ? `(${customerPhone})` : ""}</span>
        <span>Hẹn: {appointmentTime}</span>
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

  const fetchPendingAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getPendingAppointments();
      setPendingList(
        unwrapStaffPayload(response, ["items", "bookings", "pending"]).map(
          normalizeStaffBooking,
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
    ...normalizeStaffBooking(payload?.data?.data ?? payload?.data ?? payload ?? {}),
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
      setScanWarning(
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

  const handleConfirm = async (id) => {
    if (!id) return;
    setSubmitLoading(true);
    try {
      await confirmPendingAppointment(id);

      setScannedResult(null);
      fetchPendingAppointments();
    } catch (err) {
      alert(
        getFriendlyErrorMessage(
          err,
          "Gặp lỗi trong quá trình tiếp nhận xe. Vui lòng thử lại.",
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
        <main className="mx-auto w-full max-w-[1600px] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <header className="staff-reveal mb-8 border-b border-cyan-100/15 pb-5">
            <h1
              className="text-[28px] font-bold text-[#ecfeff] tracking-wide"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              MÀN HÌNH TIẾP NHẬN XE
            </h1>
            <p className="text-[#b8d8de] text-[14px] mt-2 max-w-2xl">
              Hệ thống nhận diện biển số tự động và xếp hàng điều phối dịch vụ.
            </p>
          </header>

          {error && (
            <div className="mb-6 p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start">
            <div className="order-2 lg:order-1">
              <h2
                className="text-[18px] font-semibold text-[#b8d8de] mb-4 flex items-center gap-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="w-2 h-2 rounded-full bg-[#6ff6df] animate-ping" />
                Lịch Hẹn Chờ Đến Hôm Nay ({pendingList.length})
              </h2>

              {loading ? (
                <div className="staff-panel rounded-3xl border-dashed p-12 text-center text-[#6ff6df] text-[14px] italic animate-pulse">
                  Đang tải danh sách phương tiện chờ...
                </div>
              ) : pendingList.length === 0 ? (
                <div className="staff-panel rounded-3xl border-dashed p-12 text-center text-[#b8d8de] text-[14px]">
                  Không có xe nào trong danh sách chờ phục vụ hoặc chưa quét
                  phương tiện.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingList.map((item, index) => (
                    <div
                      key={item.id || item._id}
                      className="staff-reveal"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                    <PendingCard
                      item={item}
                      disabled={submitLoading}
                      onConfirm={(id) => {
                        const target = pendingList.find(
                          (x) => (x.id || x._id) === id,
                        );
                        setScannedResult(target);
                      }}
                    />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Khung quét Camera bên phải */}
            <div className="staff-panel staff-reveal order-1 rounded-3xl p-5 lg:sticky lg:top-6 lg:order-2" style={{ animationDelay: "80ms" }}>
              <h3
                className="text-[16px] font-bold text-[#6ff6df] tracking-widest uppercase mb-4"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [ CAMERA SCANNER ]
              </h3>
              {scannedResult ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="staff-scanline border border-[#6ff6df]/30 bg-[#123746]/90 p-5 rounded-3xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#6ff6df] shadow-[0_0_15px_#6ff6df] animate-[scan_2s_infinite_linear]" />
                    <div className="text-[12px] text-[#b8d8de] mb-1">
                      BIỂN SỐ NHẬN DIỆN TRỰC TIẾP
                    </div>
                    <div
                      className="text-[32px] font-bold tracking-widest text-[#6ff6df]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {scannedResult.plate}
                    </div>
                  </div>
                  <AppointmentSnapshot
                    appointment={scannedResult}
                    scannedCode={scannedCode}
                  />
                  <button
                    type="button"
                    disabled={submitLoading}
                    onClick={() =>
                      handleConfirm(scannedResult.id || scannedResult._id)
                    }
                    className="w-full bg-[#6ff6df] text-[#06343a] font-bold text-[18px] py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#9fffee] transition-all disabled:bg-slate-700 disabled:text-slate-400"
                    style={{
                      boxShadow: submitLoading
                        ? "none"
                        : "0 0 20px rgba(94,234,212,0.3)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <span className="material-symbols-outlined">login</span>
                    {submitLoading ? "ĐANG TIẾP NHẬN..." : "Xác nhận Đã Đến"}
                  </button>
                  <p className="text-[13px] font-medium text-[#e5fbff] text-center max-w-lg mx-auto">
                    Lưu ý: Bấm nút này sẽ chuyển xe sang hàng đợi ưu tiên và
                    cập nhật trạng thái theo API hiện có.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="staff-scanline relative h-[300px] overflow-hidden border border-dashed border-teal-100/35 rounded-3xl bg-[#123746]/90 shadow-[inset_0_0_0_1px_rgba(111,246,223,0.08),0_18px_44px_rgba(3,30,43,0.22)] lg:h-[320px]">
                    {cameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-[#6ff6df]/25 bg-slate-950/70 px-4 py-3 text-center text-[12px] font-bold uppercase tracking-[0.16em] text-[#6ff6df] backdrop-blur">
                          {scanStatus || "Đang quét mã..."}
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[#e5fbff] text-center p-4">
                        <span className="material-symbols-outlined text-[40px] mb-2 text-[#7ddbd1] animate-pulse">
                          center_focus_weak
                        </span>
                        <p className="text-[13px] font-semibold leading-relaxed">
                          Camera đang tắt. Bật camera để quét QR/barcode check-in.
                        </p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-[#6ff6df]/70 shadow-[0_0_14px_rgba(94,234,212,0.8)]" />
                    <div className="pointer-events-none absolute inset-6 border border-[#6ff6df]/25 rounded" />
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

                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    className={`w-full font-bold text-[14px] py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
                      cameraActive
                        ? "bg-[#244653] text-[#ecfeff] hover:bg-[#315d6c]"
                        : "bg-[#6ff6df] text-[#06343a] hover:bg-[#9fffee]"
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {cameraActive ? "videocam_off" : "videocam"}
                    </span>
                    {cameraActive ? "TẮT QUÉT MÃ" : "BẬT QUÉT MÃ"}
                  </button>

                  <AppointmentSnapshot
                    appointment={scannedResult}
                    scannedCode={scannedCode}
                  />
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <style>{`
        @keyframes scan {
          0%   { top: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
