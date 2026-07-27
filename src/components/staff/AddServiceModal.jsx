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

  // Rule: Gói chính chỉ chọn TỐI ĐA 1 gói (Single Choice), Gói phụ chọn nhiều (Multiple Choice)
  const toggleSelect = (service) => {
    if (isAlreadyInBooking(service)) return;
    const sId = service.id || service.serviceId;

    if (service.isMainService) {
      setSelectedIds((prev) => {
        const isCurrentlySelected = prev.includes(sId);
        const mainServiceIds = servicesList
          .filter((s) => s.isMainService === true)
          .map((s) => s.id || s.serviceId);

        const withoutMainServices = prev.filter((id) => !mainServiceIds.includes(id));
        return isCurrentlySelected ? withoutMainServices : [...withoutMainServices, sId];
      });
    } else {
      setSelectedIds((prev) =>
        prev.includes(sId)
          ? prev.filter((id) => id !== sId)
          : [...prev, sId]
      );
    }
  };

  const getServicePrice = (s) =>
    Number(s.price ?? s.basePrice ?? s.priceAmount ?? s.actualPrice ?? 0);

  const getServiceDuration = (s) =>
    Number(s.durationMinutes ?? s.duration ?? s.actualDurationMinutes ?? 30);

  const getServiceName = (s) =>
    s.serviceName || s.name || s.title || "Dịch vụ rửa xe";

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
        className="staff-reveal flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-3xl border border-[#72f3ff]/30 bg-[#071724] shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header Banner */}
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
              Gói chính (Chỉ chọn 1 gói) ({mainServices.length})
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

        {/* Content Area - TABLE LAYOUT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
              Đang tải bảng dịch vụ rửa xe cho size {carSize || "xe"}...
            </div>
          ) : filteredDisplayList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1b3d52] bg-[#03111a]/50 p-10 text-center text-xs text-[#9fb7c9]">
              Không tìm thấy gói dịch vụ rửa xe phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1c3e54] bg-[#040f1a]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1c3e54] bg-[#092233] text-[#72f3ff] uppercase font-black tracking-wider text-[11px]">
                    <th className="py-3 px-4 text-center w-14">Chọn</th>
                    <th className="py-3 px-4">Tên Dịch Vụ & Mô Tả</th>
                    <th className="py-3 px-4 text-center">Phân Loại</th>
                    <th className="py-3 px-4 text-center">Thời Gian</th>
                    <th className="py-3 px-4 text-right">Đơn Giá</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#163345]">
                  {filteredDisplayList.map((service) => {
                    const sId = service.id || service.serviceId;
                    const inBooking = isAlreadyInBooking(service);
                    const isChecked = selectedIds.includes(sId);
                    const priceVal = getServicePrice(service);
                    const durationVal = getServiceDuration(service);
                    const nameStr = getServiceName(service);
                    const description = service.description || service.shortDescription || "";
                    const iconName = getServiceIcon(service.isMainService, nameStr);
                    const isMain = service.isMainService === true;

                    return (
                      <tr
                        key={sId}
                        onClick={() => toggleSelect(service)}
                        className={`transition-colors ${
                          inBooking
                            ? "bg-[#040e17]/50 text-slate-500 cursor-not-allowed opacity-65"
                            : isChecked
                            ? "bg-[#72f3ff]/15 text-[#ecfeff] cursor-pointer"
                            : "hover:bg-[#0a2335] text-[#dff7fb] cursor-pointer"
                        }`}
                      >
                        {/* Selector Column */}
                        <td className="py-3.5 px-4 text-center">
                          {inBooking ? (
                            <span className="material-symbols-outlined text-[18px] text-slate-500">
                              lock
                            </span>
                          ) : isMain ? (
                            /* Radio input for Main Service */
                            <div className="flex justify-center">
                              <input
                                type="radio"
                                checked={isChecked}
                                onChange={() => {}}
                                className="h-4 w-4 accent-[#72f3ff] cursor-pointer"
                              />
                            </div>
                          ) : (
                            /* Checkbox input for Addon Service */
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="h-4 w-4 accent-[#72f3ff] rounded cursor-pointer"
                              />
                            </div>
                          )}
                        </td>

                        {/* Name & Description Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              isChecked
                                ? "bg-[#72f3ff] text-[#061424]"
                                : inBooking
                                ? "bg-slate-800 text-slate-500"
                                : "bg-[#0d2a3c] text-[#72f3ff]"
                            }`}>
                              <span className="material-symbols-outlined text-[18px]">
                                {iconName}
                              </span>
                            </span>
                            <div>
                              <p className="font-extrabold text-sm text-[#ecfeff]">
                                {nameStr}
                              </p>
                              {description && (
                                <p className="text-[11px] text-[#8faabf] line-clamp-1 mt-0.5">
                                  {description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              isMain
                                ? "bg-[#72f3ff]/15 text-[#72f3ff] border border-[#72f3ff]/30"
                                : "bg-purple-400/15 text-purple-200 border border-purple-400/30"
                            }`}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {isMain ? "Gói chính (Radio)" : "Dịch vụ phụ"}
                          </span>
                        </td>

                        {/* Duration Column */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold text-[#6ff6df]">
                          ⏱️ +{durationVal}m
                        </td>

                        {/* Price Column */}
                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap font-black text-[#72f3ff] text-sm"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          +{formatCurrency(priceVal)}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {inBooking ? (
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                              Đã có trong đơn
                            </span>
                          ) : isChecked ? (
                            <span className="rounded bg-[#72f3ff] px-2 py-0.5 text-[10px] font-black text-[#061424]">
                              Đã chọn
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-[#7a9bb0]">
                              Sẵn sàng
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
              💡 Tích chọn các dịch vụ khách muốn làm thêm (Gói chính chọn tối đa 1, gói phụ chọn nhiều).
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
