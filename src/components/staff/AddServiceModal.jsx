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
        const res = await api.get(apiPath("/wash-services"));
        const rawList = res?.data?.data ?? res?.data ?? res ?? [];
        setServicesList(Array.isArray(rawList) ? rawList : []);
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

  const selectedServices = servicesList.filter((s) => selectedIds.includes(s.id));
  const totalAddedPrice = selectedServices.reduce(
    (sum, s) => sum + Number(s.price || s.basePrice || s.priceAmount || 0),
    0
  );
  const totalAddedDuration = selectedServices.reduce(
    (sum, s) => sum + Number(s.durationMinutes || s.duration || 0),
    0
  );

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
        className="staff-reveal w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#72f3ff]/25 bg-[#071620] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-[#244653] bg-gradient-to-br from-[#0f3340] via-[#0b2532] to-[#071620] p-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={closeIfReady}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#b8d8de] transition hover:border-[#72f3ff]/50 hover:text-[#72f3ff] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#72f3ff]/45 bg-[#72f3ff]/12 text-[#72f3ff] shadow-[0_0_24px_rgba(114,243,255,0.16)]">
              <span className="material-symbols-outlined text-[28px]">
                add_task
              </span>
            </div>
            <div>
              <p
                className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#72f3ff]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Bổ sung dịch vụ {plate ? `- ${plate}` : ""}
              </p>
              <h2
                id="add-service-title"
                className="text-2xl font-black leading-tight text-[#ecfeff]"
              >
                Chọn thêm dịch vụ rửa xe
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 p-6">
          <p className="text-xs font-semibold text-[#b8d8de]">
            Tích chọn các dịch vụ khách hàng muốn làm thêm tại quầy:
          </p>

          {isFetchingServices ? (
            <div className="flex items-center justify-center py-8 text-sm font-semibold text-[#72f3ff]">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#72f3ff]/30 border-t-[#72f3ff] mr-2" />
              Đang tải danh sách dịch vụ...
            </div>
          ) : (
            <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
              {servicesList.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#9fb7c9]">
                  Không tìm thấy dịch vụ rửa xe bổ sung.
                </div>
              ) : (
                servicesList.map((service) => {
                  const isChecked = selectedIds.includes(service.id);
                  const priceStr = formatCurrency(
                    service.price || service.basePrice || service.priceAmount || 0
                  );
                  const duration = service.durationMinutes || service.duration || 30;

                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleSelect(service.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                        isChecked
                          ? "border-[#72f3ff] bg-[#72f3ff]/10 shadow-[0_0_16px_rgba(114,243,255,0.12)]"
                          : "border-[#244653] bg-[#03111a]/60 hover:border-[#72f3ff]/40 hover:bg-[#0c202d]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                            isChecked
                              ? "border-[#72f3ff] bg-[#72f3ff] text-[#061427]"
                              : "border-[#4f7883] bg-transparent"
                          }`}
                        >
                          {isChecked && (
                            <span className="material-symbols-outlined text-[14px] font-black">
                              check
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#ecfeff]">
                            {service.serviceName || service.name || "Dịch vụ rửa xe"}
                          </p>
                          <p className="text-[11px] font-medium text-[#9fb7c9]">
                            ⏱️ +{duration} phút
                          </p>
                        </div>
                      </div>
                      <span
                        className="font-black text-[#72f3ff]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        +{priceStr}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Price Calculation Summary */}
          {selectedIds.length > 0 && (
            <div className="rounded-xl border border-[#72f3ff]/30 bg-[#0c2230] p-4">
              <div className="flex justify-between text-xs font-bold text-[#b8d8de]">
                <span>Tổng dịch vụ chọn thêm:</span>
                <span className="text-[#ecfeff]">{selectedIds.length} dịch vụ</span>
              </div>
              <div className="mt-1 flex justify-between text-xs font-bold text-[#b8d8de]">
                <span>Thời gian rửa tăng thêm:</span>
                <span className="text-[#ecfeff]">+{totalAddedDuration} phút</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-sm font-black">
                <span className="text-[#72f3ff]">Thu thêm:</span>
                <span className="text-[#72f3ff] text-base" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  +{formatCurrency(totalAddedPrice)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr]">
            <button
              type="button"
              disabled={isLoading}
              onClick={closeIfReady}
              className="rounded-2xl border border-[#244653] bg-white/5 px-5 py-3 font-bold text-[#dff7fb] transition hover:border-[#72f3ff]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isLoading || selectedIds.length === 0}
              onClick={() => onConfirm?.(selectedIds)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#72f3ff] px-5 py-3 font-black text-[#061427] shadow-[0_16px_34px_rgba(114,243,255,0.22)] transition hover:bg-[#a5f7ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#061427]/30 border-t-[#061427]" />
              )}
              {isLoading ? "Đang xử lý..." : "Xác nhận bổ sung dịch vụ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
