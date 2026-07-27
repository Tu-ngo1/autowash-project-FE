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

  // Danh sách tên & ID dịch vụ ĐÃ CÓ sẵn ban đầu trong booking
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

  const [initialTotalPrice, setInitialTotalPrice] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setInitialTotalPrice(0);
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

        const activeList = Array.isArray(list) ? list : [];
        setServicesList(activeList);

        // Pre-select tất cả dịch vụ vốn có của đơn hàng để Staff có thể chỉnh sửa/thay đổi linh hoạt
        const preSelectedObjects = activeList.filter((s) => {
          const sId = String(s.id || s.serviceId || "");
          const sName = (s.name || s.serviceName || "").toLowerCase().trim();
          return (
            existingServiceIds.includes(sId) ||
            (sName && existingServiceNames.includes(sName))
          );
        });

        const preSelected = preSelectedObjects.map((s) => s.id || s.serviceId);
        const initTotal = preSelectedObjects.reduce((sum, s) => sum + Number(s.price ?? s.basePrice ?? s.priceAmount ?? s.actualPrice ?? 0), 0);

        setSelectedIds(preSelected);
        setInitialTotalPrice(initTotal);
      } catch (err) {
        console.error("Lỗi lấy danh sách dịch vụ:", err);
      } finally {
        setIsFetchingServices(false);
      }
    };

    fetchServices();
  }, [isOpen, carSize, existingServiceIds, existingServiceNames]);

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

  // Staff có quyền chỉnh sửa/thay đổi TOÀN BỘ dịch vụ:
  // - Gói chính: Chọn TỐI ĐA 1 gói (Single Choice - Radio)
  // - Gói phụ: Chọn hoặc bỏ chọn tùy ý (Multiple Choice - Checkbox)
  const toggleSelect = (service) => {
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
  const newSubTotal = selectedServices.reduce((sum, s) => sum + getServicePrice(s), 0);
  const newTotalDuration = selectedServices.reduce((sum, s) => sum + getServiceDuration(s), 0);

  const hasMainService = selectedServices.some((s) => s.isMainService === true);
  const isPaid = String(appointment?.paymentStatus || appointment?.payment?.paymentStatus || "").toUpperCase() === "PAID";

  // Tier Discount calculation
  let tierPercent = Number(
    appointment?.tierDiscountPercent ??
    appointment?.tierPercent ??
    appointment?.user?.customerProfile?.tierConfig?.autoDiscountPercent ??
    0
  );

  // Nếu appointment có discount và initialTotalPrice > 0 nhưng chưa truyền tierPercent
  if (tierPercent === 0 && initialTotalPrice > 0 && (appointment?.discount ?? appointment?.discountAmount) > 0) {
    const rawDiscount = Number(appointment?.discount ?? appointment?.discountAmount ?? 0);
    tierPercent = Math.round((rawDiscount / initialTotalPrice) * 100);
  }

  const tierDiscountAmount = Math.round((newSubTotal * tierPercent) / 100);

  // Voucher Discount calculation
  const totalRawDiscount = Number(appointment?.discount ?? appointment?.discountAmount ?? 0);
  const initialTierDiscount = initialTotalPrice > 0 ? Math.round((initialTotalPrice * tierPercent) / 100) : 0;
  const voucherDiscountAmount = Math.max(totalRawDiscount - initialTierDiscount, 0);

  const totalDiscount = tierDiscountAmount + voucherDiscountAmount;
  const newCalculatedFinalPrice = Math.max(newSubTotal - totalDiscount, 0);

  const actualPaid = Number(
    appointment?.actualPaidAmount ??
    (isPaid ? (appointment?.finalPrice ?? appointment?.totalPrice ?? 0) : 0)
  );

  const isSelectionChanged = (() => {
    if (selectedIds.length !== initialSelectedIds.length) return true;
    const sortedCurrent = [...selectedIds].sort();
    const sortedInitial = [...initialSelectedIds].sort();
    return sortedCurrent.some((val, index) => val !== sortedInitial[index]);
  })();

  const priceDelta = newCalculatedFinalPrice - actualPaid;
  const effectivePriceDelta = isSelectionChanged ? priceDelta : 0;

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
        className="staff-reveal flex max-h-[92vh] w-full max-w-[840px] flex-col overflow-hidden rounded-3xl border border-[#72f3ff]/30 bg-[#071724] shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
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
                edit_note
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full bg-[#72f3ff]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#72f3ff] border border-[#72f3ff]/30"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Chỉnh sửa dịch vụ {plate ? `• ${plate}` : ""}
                </span>
                {carSize && (
                  <span
                    className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-200 border border-cyan-400/30"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Size: {carSize}
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                    isPaid
                      ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/30"
                      : "bg-amber-400/20 text-amber-200 border-amber-400/30"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </div>
              <h2
                id="add-service-title"
                className="mt-1 text-xl font-black leading-tight text-[#ecfeff] sm:text-2xl"
              >
                Chỉnh sửa / Thay đổi toàn bộ dịch vụ đơn hàng
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
              Gói chính (Bắt buộc chọn 1 gói) ({mainServices.length})
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
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs font-semibold text-cyan-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#72f3ff]">tune</span>
            <span>
              Staff có quyền tích/bỏ chọn hoặc thay đổi gói dịch vụ (Bắt buộc giữ ít nhất 1 gói chính).
            </span>
          </div>

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
                        className={`transition-colors cursor-pointer ${
                          isChecked
                            ? "bg-[#72f3ff]/15 text-[#ecfeff]"
                            : "hover:bg-[#0a2335] text-[#dff7fb]"
                        }`}
                      >
                        {/* Selector Column */}
                        <td className="py-3.5 px-4 text-center">
                          {isMain ? (
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
                          ⏱️ {durationVal}m
                        </td>

                        {/* Price Column */}
                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap font-black text-[#72f3ff] text-sm"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {formatCurrency(priceVal)}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isChecked ? (
                            <span className="rounded bg-[#72f3ff] px-2 py-0.5 text-[10px] font-black text-[#061424]">
                              Đang chọn
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-[#7a9bb0]">
                              Chưa chọn
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
          {!hasMainService && selectedIds.length > 0 && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-xs font-bold text-amber-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-400">warning</span>
              <span>Bắt buộc chọn 1 gói dịch vụ rửa xe chính cho đơn hàng!</span>
            </div>
          )}

          {selectedIds.length > 0 ? (
            <div className="rounded-2xl border border-[#72f3ff]/40 bg-[#092334] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <div className="flex justify-between text-xs font-bold text-[#b8d8de]">
                <span>Dịch vụ đã chọn ({selectedIds.length}):</span>
                <span className="text-[#ecfeff] font-extrabold">
                  {selectedServices.map(getServiceName).join(", ")}
                </span>
              </div>
              <div className="mt-1.5 flex justify-between text-xs font-bold text-[#b8d8de]">
                <span>Tổng thời gian rửa:</span>
                <span className="text-[#6ff6df]">{newTotalDuration} phút</span>
              </div>
              <div className="mt-1 flex justify-between text-xs font-semibold text-[#b8d8de]">
                <span>Tổng giá niêm yết:</span>
                <span className="text-[#dff7fb]">{formatCurrency(newSubTotal)}</span>
              </div>

              {/* Chi tiết Giảm giá */}
              {tierDiscountAmount > 0 && (
                <div className="mt-1 flex justify-between text-xs font-semibold text-emerald-400">
                  <span>Giảm giá Hạng thành viên ({tierPercent}%):</span>
                  <span>-{formatCurrency(tierDiscountAmount)}</span>
                </div>
              )}
              {voucherDiscountAmount > 0 && (
                <div className="mt-1 flex justify-between text-xs font-semibold text-amber-300">
                  <span>Giảm giá Voucher:</span>
                  <span>-{formatCurrency(voucherDiscountAmount)}</span>
                </div>
              )}

              {/* Hóa đơn chênh lệch & Giá thực tế cuối cùng */}
              <div className="mt-2.5 flex justify-between border-t border-white/10 pt-2 text-sm font-black">
                {isPaid ? (
                  effectivePriceDelta > 0 ? (
                    <>
                      <span className="text-amber-300">Thu thêm tại quầy:</span>
                      <span className="text-amber-300 text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        +{formatCurrency(effectivePriceDelta)}
                      </span>
                    </>
                  ) : effectivePriceDelta < 0 ? (
                    <>
                      <span className="text-emerald-300">Hoàn lại tiền thừa vào Ví khách:</span>
                      <span className="text-emerald-300 text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        -{formatCurrency(Math.abs(effectivePriceDelta))}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#72f3ff]">Giá trị đơn hàng (Không đổi):</span>
                      <span className="text-[#72f3ff] text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatCurrency(newCalculatedFinalPrice)}
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <span className="text-[#72f3ff]">Tổng tiền đơn hàng mới:</span>
                    <span className="text-[#72f3ff] text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatCurrency(newCalculatedFinalPrice)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#1c3e54] bg-[#030e17] p-3 text-center text-xs font-medium text-[#8faabf]">
              💡 Vui lòng chọn danh sách dịch vụ rửa xe cho đơn hàng (Bắt buộc chọn 1 gói chính).
            </div>
          )}

          {/* Banner Thông báo Lỗi */}
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-xs font-bold text-rose-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-rose-400 shrink-0">error</span>
              <span className="leading-relaxed">{error}</span>
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
              disabled={isLoading || selectedIds.length === 0 || !hasMainService}
              onClick={() => onConfirm?.(selectedIds)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#72f3ff] px-5 py-3.5 font-black text-[#061424] shadow-[0_16px_36px_rgba(114,243,255,0.25)] transition hover:bg-[#9ff4ff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#061424]/30 border-t-[#061424]" />
              )}
              {isLoading ? "Đang cập nhật đơn..." : `Xác nhận cập nhật đơn (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
