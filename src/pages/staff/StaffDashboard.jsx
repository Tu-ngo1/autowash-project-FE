import { useEffect, useRef, useState } from "react";
import StaffNavbar from "../../components/StaffNavbar";
import {
  confirmPendingAppointment,
  getPendingAppointments,
} from "../../services/staffApi";

const TIER_STYLES = {
  Platinum: "border-[#8aebff] text-[#8aebff] bg-[#8aebff]/10",
  Gold: "border-[#4edea3] text-[#4edea3] bg-[#4edea3]/10",
  Silver: "border-[#3c494c] text-[#bbc9cd] bg-[#2e3447]",
  Member: "border-[#3c494c] text-[#bbc9cd] bg-[#2e3447]",
};

function PendingCard({ item, onConfirm, disabled }) {
  const tierStyle = TIER_STYLES[item.tier] || TIER_STYLES.Member;

  if (item.scanned) {
    return (
      <div className="border border-[#8aebff] bg-[#0c1324] p-5 rounded relative flex flex-col justify-between h-[160px]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#8aebff] shadow-[0_0_15px_#8aebff] animate-[scan_2s_infinite_linear]" />
        <div className="flex justify-between items-start">
          <div>
            <div
              className="text-[12px] text-[#8aebff] font-bold tracking-widest uppercase mb-1"
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
        <div className="flex justify-between items-center border-t border-[#1e293b] pt-3 text-[13px] text-[#bbc9cd]">
          <span>Lịch hẹn: {item.time}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onConfirm(item.id || item._id)}
            className="text-[#8aebff] font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
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
    <div className="border border-[#23293c] bg-[#0c1324] p-5 rounded flex flex-col justify-between h-[160px] opacity-70 hover:opacity-100 transition-opacity">
      <div className="flex justify-between items-start">
        <div>
          <div
            className="text-[12px] text-[#bbc9cd] font-bold tracking-widest uppercase mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Chờ Check-in
          </div>
          <div
            className="text-[24px] font-bold text-[#dce1fb] tracking-wider"
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
      <div className="flex justify-between items-center border-t border-[#1e293b] pt-3 text-[13px] text-[#bbc9cd]">
        <span>Lịch hẹn: {item.time}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onConfirm(item.id || item._id)}
          className="text-[#bbc9cd] hover:text-white font-medium flex items-center gap-1 disabled:opacity-50"
        >
          Quét tay
        </button>
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [pendingList, setPendingList] = useState([]);
  const [scannedResult, setScannedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const fetchPendingAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getPendingAppointments();
      if (Array.isArray(response.data)) {
        setPendingList(response.data);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setPendingList(response.data.data);
      } else {
        setPendingList([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải danh sách lịch hẹn chờ.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAppointments();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Trình duyệt hiện tại không hỗ trợ mở camera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        "Không thể mở camera. Hãy kiểm tra quyền camera của trình duyệt.",
      );
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
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
        err?.response?.data?.message || "Gặp lỗi trong quá trình tiếp nhận xe.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1f] text-white lg:pl-64">
      <StaffNavbar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="mx-auto w-full max-w-[1600px] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <header className="mb-8 border-b border-[#23293c] pb-5">
            <h1
              className="text-[28px] font-bold text-[#dce1fb] tracking-wide"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              MÀN HÌNH TIẾP NHẬN XE
            </h1>
            <p className="text-[#bbc9cd] text-[14px] mt-1">
              Hệ thống nhận diện biển số tự động và xếp hàng điều phối dịch vụ.
            </p>
          </header>

          {error && (
            <div className="mb-6 p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <h2
                className="text-[18px] font-semibold text-[#bbc9cd] mb-4 flex items-center gap-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="w-2 h-2 rounded-full bg-[#8aebff] animate-ping" />
                Lịch Hẹn Chờ Đến Hôm Nay ({pendingList.length})
              </h2>

              {loading ? (
                <div className="border border-dashed border-[#3c494c] p-12 text-center rounded text-[#8aebff] text-[14px] italic animate-pulse">
                  Đang tải danh sách phương tiện chờ...
                </div>
              ) : pendingList.length === 0 ? (
                <div className="border border-dashed border-[#3c494c] p-12 text-center rounded text-[#bbc9cd] text-[14px]">
                  Không có xe nào trong danh sách chờ phục vụ hoặc chưa quét
                  phương tiện.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingList.map((item) => (
                    <PendingCard
                      key={item.id || item._id}
                      item={item}
                      disabled={submitLoading}
                      onConfirm={(id) => {
                        const target = pendingList.find(
                          (x) => (x.id || x._id) === id,
                        );
                        setScannedResult(target);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Khung quét Camera bên phải */}
            <div className="bg-[#0c1324] border border-[#23293c] p-6 rounded sticky top-24">
              <h3
                className="text-[16px] font-bold text-[#8aebff] tracking-widest uppercase mb-4"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [ CAMERA SCANNER ]
              </h3>
              {scannedResult ? (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border border-[#3c494c] bg-[#070d1f] p-6 rounded-lg text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#8aebff] shadow-[0_0_15px_#8aebff] animate-[scan_2s_infinite_linear]" />
                    <div className="text-[12px] text-[#bbc9cd] mb-1">
                      BIỂN SỐ NHẬN DIỆN TRỰC TIẾP
                    </div>
                    <div
                      className="text-[32px] font-bold tracking-widest text-[#8aebff]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {scannedResult.plate}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitLoading}
                    onClick={() =>
                      handleConfirm(scannedResult.id || scannedResult._id)
                    }
                    className="w-full bg-[#8aebff] text-[#00363e] font-bold text-[20px] py-4 rounded flex items-center justify-center gap-3 hover:bg-[#a2eeff] transition-all disabled:bg-slate-700 disabled:text-slate-400"
                    style={{
                      boxShadow: submitLoading
                        ? "none"
                        : "0 0 20px rgba(138,235,255,0.3)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <span className="material-symbols-outlined">login</span>
                    {submitLoading ? "ĐANG TIẾP NHẬN..." : "Xác nhận Đã Đến"}
                  </button>
                  <p className="text-[13px] text-[#bbc9cd] italic text-center max-w-lg mx-auto">
                    Lưu ý: Bấm nút này sẽ chuyển xe sang hàng đợi ưu tiên và
                    cập nhật trạng thái theo API hiện có.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative h-64 overflow-hidden border border-dashed border-[#23293c] rounded bg-[#070d1f]">
                    {cameraActive ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[#bbc9cd] text-center p-4">
                        <span className="material-symbols-outlined text-[40px] mb-2 text-[#3c494c] animate-pulse">
                          center_focus_weak
                        </span>
                        <p className="text-[13px]">
                          Camera đang tắt. Bật camera để kiểm tra khung hình.
                        </p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-[#8aebff]/70 shadow-[0_0_14px_rgba(138,235,255,0.8)]" />
                    <div className="pointer-events-none absolute inset-6 border border-[#8aebff]/25 rounded" />
                  </div>

                  {cameraError && (
                    <div className="rounded border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-300">
                      {cameraError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    className={`w-full font-bold text-[14px] py-3 rounded flex items-center justify-center gap-2 transition-all ${
                      cameraActive
                        ? "bg-[#23293c] text-[#dce1fb] hover:bg-[#2f3852]"
                        : "bg-[#8aebff] text-[#00363e] hover:bg-[#a2eeff]"
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {cameraActive ? "videocam_off" : "videocam"}
                    </span>
                    {cameraActive ? "TẮT CAMERA" : "BẬT CAMERA LAPTOP"}
                  </button>

                  <p className="text-[12px] text-[#bbc9cd] text-center leading-relaxed">
                    Camera chỉ dùng để xem trực tiếp trên trình duyệt. Dữ liệu
                    tiếp nhận vẫn lấy theo API hiện có.
                  </p>
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
