import { useEffect, useState } from "react";
import api, { apiPath } from "../../services/apiClient";

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

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

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      return;
    }

    const fetchServices = async () => {
      try {
        setIsFetchingServices(true);
        const carSize =
          appointment?.vehicleSize ||
          appointment?.carSize ||
          appointment?.vehicle?.vehicleModel?.vehicleSize ||
          appointment?.vehicle?.size ||
          appointment?.car?.vehicleModel?.vehicleSize ||
          "";

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
  }, [isOpen]);

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

  const plate =
    appointment?.plate ||
    appointment?.licensePlate ||
    appointment?.vehicleLicensePlate ||
    appointment?.vehicle?.licensePlate ||
    "";

  const toggleSelect = (serviceId) => {
    setSelectedIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getServicePrice = (s) =>
    Number(s.price ?? s.basePrice ?? s.priceAmount ?? s.actualPrice ?? 0);

  const getServiceDuration = (s) =>
    Number(s.durationMinutes ?? s.duration ?? s.actualDurationMinutes ?? 30);

  const getServiceName = (s) =>
    s.serviceName || s.name || s.title || "Dịch vụ rửa xe";

  const selectedServices = servicesList.filter((s) => selectedIds.includes(s.id));
  const totalAddedPrice = selectedServices.reduce((sum, s) => sum + getServicePrice(s), 0);
  const totalAddedDuration = selectedServices.reduce((sum, s) => sum + getServiceDuration(s), 0);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#03111a]/80 px-4 py-6 backdrop-blur-md"
      onMouseDown={closeIfReady}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-service-title"
        className="staff-reveal w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#72f3ff]/25 bg-[#071620] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-[#244653] bg-gradient-to-br from-[#0f3340] via-[#0b2532] to-[#071620] p-5 sm:p-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={closeIfReady}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#b8d8de] transition hover:border-[#72f3ff]/50 hover:text-[#72f3ff] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="flex items-start gap-3.5 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#72f3ff]/45 bg-[#72f3ff]/12 text-[#72f3ff] shadow-[0_0_20px_rgba(114,243,255,0.16)]">
              <span className="material-symbols-outlined text-[24px]">
                add_task
              </span>
            </div>
            <div>
              <p
                className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#72f3ff]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Bổ sung dịch vụ {plate ? `• ${plate}` : ""}
              </p>
              <h2
                id="add-service-title"
                className="text-xl font-black leading-tight text-[#ecfeff]"
              >
                Chọn thêm dịch vụ rửa xe tại quầy
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#b8d8de]">
              Tích chọn gói/dịch vụ khách muốn bổ sung:
            </p>
            <span className="text-[11px] font-bold text-[#72f3ff]">
              Khả dụng: {servicesList.length} dịch vụ
            </span>
          </div>

          {isFetchingServices ? (
            <div className="flex flex-col items-center justify-center py-10 text-sm font-semibold text-[#72f3ff]">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#72f3ff]/30 border-t-[#72f3ff] mb-2" />
              Đang tải danh sách gói rửa xe...
            </div>
          ) : (
            <div className="max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
              {servicesList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#244653] bg-[#03111a]/40 p-8 text-center text-xs text-[#9fb7c9]">
                  Không tìm thấy dịch vụ rửa xe bổ sung.
                </div>
              ) : (
                servicesList.map((service) => {
                  const isChecked = selectedIds.includes(service.id);
                  const priceVal = getServicePrice(service);
                  const durationVal = getServiceDuration(service);
                  const nameStr = getServiceName(service);
                  const description = service.description || service.shortDescription || "";

                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleSelect(service.id)}
                      className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                        isChecked
                          ? "border-[#72f3ff] bg-[#72f3ff]/12 shadow-[0_0_18px_rgba(114,243,255,0.15)]"
                          : "border-[#244653] bg-[#03111a]/70 hover:border-[#72f3ff]/50 hover:bg-[#091b27]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            isChecked
                              ? "border-[#72f3ff] bg-[#72f3ff] text-[#061427]"
                              : "border-[#4f7883] bg-transparent group-hover:border-[#72f3ff]/70"
                          }`}
                        >
                          {isChecked && (
                            <span className="material-symbols-outlined text-[15px] font-black">
                              check
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-[#ecfeff]">
                              {nameStr}
                            </p>
                            {service.isMainService !== undefined && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                  service.isMainService
                                    ? "border border-[#72f3ff]/40 bg-[#72f3ff]/10 text-[#72f3ff]"
                                    : "border border-purple-300/40 bg-purple-300/10 text-purple-200"
                                }`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {service.isMainService ? "Gói chính" : "Đính kèm"}
                              </span>
                            )}
                          </div>
                          {description && (
                            <p className="mt-0.5 text-[11px] text-[#8faabf] line-clamp-1">
                              {description}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] font-semibold text-[#6ff6df]">
                            ⏱️ +{durationVal} phút
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className="text-sm font-black text-[#72f3ff]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          +{formatCurrency(priceVal)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Price Calculation Summary */}
          {selectedIds.length > 0 && (
            <div className="rounded-xl border border-[#72f3ff]/35 bg-[#0b2434] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
              <div className="flex justify-between text-xs font-bold text-[#b8d8de]">
                <span>Dịch vụ bổ sung:</span>
                <span className="text-[#ecfeff]">{selectedIds.length} dịch vụ đã chọn</span>
              </div>
              <div className="mt-1 flex justify-between text-xs font-bold text-[#b8d8de]">
                <span>Thời gian rửa cộng thêm:</span>
                <span className="text-[#6ff6df]">+{totalAddedDuration} phút</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-sm font-black">
                <span className="text-[#72f3ff]">Thu thêm tại quầy:</span>
                <span className="text-[#72f3ff] text-base" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  +{formatCurrency(totalAddedPrice)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr]">
            <button
              type="button"
              disabled={isLoading}
              onClick={closeIfReady}
              className="rounded-xl border border-[#244653] bg-white/5 px-5 py-3 font-bold text-[#dff7fb] transition hover:border-[#72f3ff]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isLoading || selectedIds.length === 0}
              onClick={() => onConfirm?.(selectedIds)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#72f3ff] px-5 py-3 font-black text-[#061427] shadow-[0_16px_34px_rgba(114,243,255,0.22)] transition hover:bg-[#a5f7ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#061427]/30 border-t-[#061427]" />
              )}
              {isLoading ? "Đang xử lý..." : `Xác nhận bổ sung (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
