import { useEffect, useMemo, useState } from "react";
import api, { apiPath } from "../../services/apiClient";

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

const getServiceIcon = (isMainService, name = "") => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("hút bụi") || nameLower.includes("nội thất")) return "cleaning_services";
  if (nameLower.includes("phủ") || nameLower.includes("nano") || nameLower.includes("bóng")) return "auto_awesome";
  if (nameLower.includes("kính") || nameLower.includes("tẩy")) return "water_drop";
  if (nameLower.includes("khoang máy") || nameLower.includes("động cơ")) return "build";
  return isMainService ? "local_car_wash" : "add_task";
};

export default function AddServiceModal({
  isOpen,
  appointment,
  isLoading = false,
  error = "",
  onConfirm,
  onClose,
}) {
  const [servicesList, setServicesList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isFetchingServices, setIsFetchingServices] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'main' | 'addon'

  // Kích thước xe & biển số
  const plate =
    appointment?.plate ||
    appointment?.licensePlate ||
    appointment?.vehicleLicensePlate ||
    appointment?.vehicle?.licensePlate ||
    "";

  const carSize =
    appointment?.vehicleSize ||
    appointment?.carSize ||
    appointment?.vehicle?.vehicleModel?.vehicleSize ||
    appointment?.vehicle?.size ||
    appointment?.car?.vehicleModel?.vehicleSize ||
    "";

  // Lấy danh sách tên & ID dịch vụ ĐÃ CÓ sẵn trong booking này
  const existingServiceNames = useMemo(() => {
    if (!appointment) return [];
    if (Array.isArray(appointment.services)) {
      return appointment.services.map((s) =>
        typeof s === "string" ? s.toLowerCase().trim() : (s.name || s.serviceName || "").toLowerCase().trim()
      );
    }
    if (Array.isArray(appointment.details)) {
      return appointment.details.map((d) => (d.serviceName || d.name || "").toLowerCase().trim());
    }
    return [];
  }, [appointment]);

  const existingServiceIds = useMemo(() => {
    if (!appointment) return [];
    if (Array.isArray(appointment.details)) {
      return appointment.details.map((d) => String(d.serviceId || d.id || "")).filter(Boolean);
    }
    return [];
  }, [appointment]);

  const isAlreadyInBooking = (service) => {
    const sId = String(service.id || service.serviceId || "");
    const sName = (service.name || service.serviceName || "").toLowerCase().trim();
    return existingServiceIds.includes(sId) || (sName && existingServiceNames.includes(sName));
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setActiveTab("all");
      return;
    }

    const fetchServices = async () => {
      try {
        setIsFetchingServices(true);
        const params = carSize ? { carSize } : {};
        let list = [];
        try {
          const res = await api.get(apiPath("/staff/bookings/walk-in/data"), { params });
          const data = res?.data?.data ?? res?.data ?? res ?? {};
          list = Array.isArray(data) ? data : data?.services || data?.washServices || [];
        } catch {
          const fallbackRes = await api.get(apiPath("/customer/bookings/data"), { params });
          const fallbackData = fallbackRes?.data?.data ?? fallbackRes?.data ?? fallbackRes ?? {};
          list = Array.isArray(fallbackData) ? fallbackData : fallbackData?.services || fallbackData?.washServices || [];
        }
        setServicesList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Lỗi lấy danh sách dịch vụ bổ sung:", err);
      } finally {
        setIsFetchingServices(false);
      }
    };

    fetchServices();
  }, [isOpen, carSize]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const closeIfReady = () => {
    if (!isLoading) onClose?.();
  };

  const toggleSelect = (service) => {
    if (isAlreadyInBooking(service)) return;
    const sId = service.id || service.serviceId;
    setSelectedIds((prev) =>
      prev.includes(sId)
        ? prev.filter((id) => id !== sId)
        : [...prev, sId]
    );
  };

  const getServicePrice = (s) =>
    Number(s.price ?? s.basePrice ?? s.priceAmount ?? s.actualPrice ?? 0);

  const getServiceDuration = (s) =>
    Number(s.durationMinutes ?? s.duration ?? s.actualDurationMinutes ?? 30);

  const getServiceName = (s) =>
    s.serviceName || s.name || s.title || "Dịch vụ rửa xe";

  // Phân loại danh sách dịch vụ chính và phụ
  const mainServices = servicesList.filter((item) => item.isMainService === true);
  const addonServices = servicesList.filter((item) => item.isMainService === false);

  const filteredDisplayList =
    activeTab === "main"
      ? mainServices
      : activeTab === "addon"
      ? addonServices
      : servicesList;

  const selectedServices = servicesList.filter((s) => selectedIds.includes(s.id || s.serviceId));
  const totalAddedPrice = selectedServices.reduce((sum, s) => sum + getServicePrice(s), 0);
  const totalAddedDuration = selectedServices.reduce((sum, s) => sum + getServiceDuration(s), 0);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#020b12]/85 px-3 py-4 backdrop-blur-md sm:p-6"
      onMouseDown={closeIfReady}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-service-title"
        className="staff-reveal flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-3xl border border-[#72f3ff]/30 bg-[#071724] shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header - Styled like CustomerBooking page banner */}
        <div className="relative shrink-0 border-b border-[#1b3d52] bg-gradient-to-br from-[#0c293c] via-[#091e2c] to-[#071724] p-5 sm:p-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={closeIfReady}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#b8d8de] transition hover:border-[#72f3ff]/50 hover:bg-white/10 hover:text-[#72f3ff] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#72f3ff]/45 bg-[#72f3ff]/15 text-[#72f3ff] shadow-[0_0_24px_rgba(114,243,255,0.2)]">
              <span className="material-symbols-outlined text-[26px]">
                local_car_wash
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full bg-[#72f3ff]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#72f3ff] border border-[#72f3ff]/30"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Bổ sung dịch vụ {plate ? `• ${plate}` : ""}
                </span>
                {carSize && (
                  <span
                    className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-200 border border-cyan-400/30"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Size: {carSize}
                  </span>
                )}
              </div>
              <h2
                id="add-service-title"
                className="mt-1 text-xl font-black leading-tight text-[#ecfeff] sm:text-2xl"
              >
                Chọn thêm dịch vụ rửa xe tại quầy
              </h2>
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
                activeTab === "all"
                  ? "bg-[#72f3ff] text-[#061424] shadow-[0_0_15px_rgba(114,243,255,0.3)]"
                  : "bg-white/5 text-[#b8d8de] hover:bg-white/10 hover:text-white"
              }`}
            >
              Tất cả ({servicesList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("main")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
                activeTab === "main"
                  ? "bg-[#72f3ff] text-[#061424] shadow-[0_0_15px_rgba(114,243,255,0.3)]"
                  : "bg-white/5 text-[#b8d8de] hover:bg-white/10 hover:text-white"
              }`}
            >
              Gói chính ({mainServices.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("addon")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
                activeTab === "addon"
                  ? "bg-[#72f3ff] text-[#061424] shadow-[0_0_15px_rgba(114,243,255,0.3)]"
                  : "bg-white/5 text-[#b8d8de] hover:bg-white/10 hover:text-white"
              }`}
            >
              Dịch vụ phụ ({addonServices.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Validation Notice if services exist in booking */}
          {existingServiceNames.length > 0 && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs font-semibold text-cyan-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#72f3ff]">info</span>
              <span>
                Đơn hàng đã có: <strong className="text-white">{existingServiceNames.join(", ")}</strong> (Đã khóa chọn lại)
              </span>
            </div>
          )}

          {isFetchingServices ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm font-semibold text-[#72f3ff]">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#72f3ff]/30 border-t-[#72f3ff] mb-3" />
              Đang tải danh sách dịch vụ rửa xe cho size {carSize || "xe"}...
            </div>
          ) : filteredDisplayList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1b3d52] bg-[#03111a]/50 p-10 text-center text-xs text-[#9fb7c9]">
              Không tìm thấy gói dịch vụ rửa xe phù hợp.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredDisplayList.map((service) => {
                const sId = service.id || service.serviceId;
                const inBooking = isAlreadyInBooking(service);
                const isChecked = selectedIds.includes(sId);
                const priceVal = getServicePrice(service);
                const durationVal = getServiceDuration(service);
                const nameStr = getServiceName(service);
                const description = service.description || service.shortDescription || "";
                const iconName = getServiceIcon(service.isMainService, nameStr);

                return (
                  <div
                    key={sId}
                    onClick={() => toggleSelect(service)}
                    className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                      inBooking
                        ? "border-[#1b3d52] bg-[#040e17]/60 opacity-60 cursor-not-allowed"
                        : isChecked
                        ? "border-[#72f3ff] bg-[#72f3ff]/15 shadow-[0_0_24px_rgba(114,243,255,0.18)] cursor-pointer"
                        : "border-[#1c3e54] bg-[#051421]/80 hover:-translate-y-0.5 hover:border-[#72f3ff]/60 hover:bg-[#0a2032] cursor-pointer"
                    }`}
                  >
                    {/* Top Row: Icon + Checkbox / Status Badge */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        isChecked
                          ? "bg-[#72f3ff] text-[#061424]"
                          : inBooking
                          ? "bg-slate-800 text-slate-400"
                          : "bg-[#0f2e42] text-[#72f3ff]"
                      }`}>
                        <span className="material-symbols-outlined text-[22px]">
                          {inBooking ? "lock" : iconName}
                        </span>
                      </span>

                      {inBooking ? (
                        <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-black uppercase text-slate-300 border border-slate-700">
                          Đã có trong đơn
                        </span>
                      ) : (
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                            isChecked
                              ? "border-[#72f3ff] bg-[#72f3ff] text-[#061424]"
                              : "border-[#3d6579] bg-transparent"
                          }`}
                        >
                          {isChecked && (
                            <span className="material-symbols-outlined text-[16px] font-black">
                              check
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black leading-tight text-[#ecfeff]">
                          {nameStr}
                        </h4>
                      </div>

                      {description && (
                        <p className="mt-1.5 text-xs text-[#8eb0c4] line-clamp-2 leading-relaxed">
                          {description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Duration + Price */}
                    <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-3">
                      <span className="text-xs font-bold text-[#6ff6df]">
                        ⏱️ +{durationVal} phút
                      </span>
                      <span
                        className="text-base font-black text-[#72f3ff]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        +{formatCurrency(priceVal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer & Price Calculation Summary */}
        <div className="shrink-0 border-t border-[#1b3d52] bg-[#05131f] p-4 sm:p-6 space-y-3">
          {selectedIds.length > 0 ? (
            <div className="rounded-2xl border border-[#72f3ff]/40 bg-[#092334] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <div className="flex justify-between text-xs font-bold text-[#b8d8de]">
                <span>Dịch vụ chọn bổ sung ({selectedIds.length}):</span>
                <span className="text-[#ecfeff] font-extrabold">
                  {selectedServices.map(getServiceName).join(", ")}
                </span>
              </div>
              <div className="mt-1.5 flex justify-between text-xs font-bold text-[#b8d8de]">
                <span>Tổng thời gian cộng thêm:</span>
                <span className="text-[#6ff6df]">+{totalAddedDuration} phút</span>
              </div>
              <div className="mt-2.5 flex justify-between border-t border-white/10 pt-2 text-sm font-black">
                <span className="text-[#72f3ff]">Thu thêm tại quầy:</span>
                <span className="text-[#72f3ff] text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  +{formatCurrency(totalAddedPrice)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#1c3e54] bg-[#030e17] p-3 text-center text-xs font-medium text-[#8faabf]">
              💡 Tích chọn các dịch vụ khách muốn làm thêm để tự động tính lại hóa đơn đơn hàng.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid gap-3 sm:grid-cols-[1fr_1.6fr]">
            <button
              type="button"
              disabled={isLoading}
              onClick={closeIfReady}
              className="rounded-2xl border border-[#1b3d52] bg-white/5 px-5 py-3.5 font-bold text-[#dff7fb] transition hover:border-[#72f3ff]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isLoading || selectedIds.length === 0}
              onClick={() => onConfirm?.(selectedIds)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#72f3ff] px-5 py-3.5 font-black text-[#061424] shadow-[0_16px_36px_rgba(114,243,255,0.25)] transition hover:bg-[#9ff4ff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#061424]/30 border-t-[#061424]" />
              )}
              {isLoading ? "Đang cập nhật đơn hàng..." : `Xác nhận bổ sung (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
