import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import BookingSummary from "../../components/booking/BookingSummary";
import {
  getUser,
  getUserTier,
  getUserWalletBalance,
  updateUser,
} from "../../utils/auth";
import { getProfile } from "../../services/customerUserApi";
import {
  createBooking,
  getBookingData,
} from "../../services/customerBookingApi";
import { getMyCars } from "../../services/customerCarApi";
import {
  getCustomerVouchers,
  validateVoucher,
} from "../../services/customerVoucherApi";
import { getCustomerBookingConfig } from "../../services/customerConfigApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";
import { mergeUniqueBy, unwrapList, unwrapPayload } from "../../utils/dataHelpers";
import { formatCurrency } from "../../utils/formatters";
import {
  getVehicleSizeOption,
  normalizeVehicleSize,
} from "../../utils/vehicleDisplay";

const formatPrice = formatCurrency;

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatPickerDate = (dateKey) => {
  const date = new Date(`${dateKey}T12:00:00`);
  return {
    weekday: new Intl.DateTimeFormat("vi-VN", { weekday: "short" })
      .format(date)
      .replace(".", ""),
    day: String(date.getDate()).padStart(2, "0"),
    month: `Th${String(date.getMonth() + 1).padStart(2, "0")}`,
    fullLabel: new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date),
  };
};

const padHour = (hour) => String(hour).padStart(2, "0");

const getHourFromTime = (value) => {
  const str = String(value || "");
  const timePart = str.includes("T") ? str.split("T")[1] : str;
  const [hourText] = timePart.split(":");
  const hour = Number(hourText);
  return Number.isInteger(hour) ? hour : null;
};

const formatTimeFromDateTimeString = (value) => {
  const str = String(value || "");
  const timePart = str.includes("T") ? str.split("T")[1] : str;
  const parts = timePart.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return "00:00";
};

const normalizeHourlySlots = (slots = [], businessHours = {}, dateParam = "") => {
  const startHour = getHourFromTime(businessHours.startTime);
  const endHour = getHourFromTime(businessHours.endTime);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayKey = `${year}-${month}-${day}`;

  const isToday = !dateParam || dateParam === todayKey;
  // Khung giờ tối thiểu: thời gian hiện tại + 30 phút buffer
  const minAllowedMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : 0;

  const normalized = slots
    .map((slot) => {
      const startTimeVal = slot.startTime || slot.time || slot.slot || slot;
      const endTimeVal = slot.endTime;

      if (!startTimeVal) return null;

      const hour = getHourFromTime(startTimeVal);
      if (hour === null) return null;
      if (startHour !== null && hour < startHour) return null;
      if (endHour !== null && hour >= endHour) return null;

      const start = formatTimeFromDateTimeString(startTimeVal);
      const end = endTimeVal
        ? formatTimeFromDateTimeString(endTimeVal)
        : getSlotEndTime(start);

      const [sHour, sMin] = start.split(":").map(Number);
      const slotTotalMinutes = (sHour || 0) * 60 + (sMin || 0);
      const isPastOrTooSoon = isToday && slotTotalMinutes < minAllowedMinutes;

      const isAvailableInPayload =
        typeof slot === "object" && slot.available !== undefined
          ? Boolean(slot.available)
          : true;

      return {
        slot: start,
        endTime: end,
        label: slot?.label || `${start} - ${end}`,
        available: isPastOrTooSoon ? false : isAvailableInPayload,
      };
    })
    .filter(Boolean);

  return normalized.filter(
    (slot, index, list) =>
      list.findIndex((item) => item.slot === slot.slot) === index,
  );
};

const getSlotEndTime = (slot, durationMinutes = 60) => {
  const hour = getHourFromTime(slot);
  if (hour === null) return "";
  const parts = String(slot).split(":");
  const minute = parts.length >= 2 ? Number(parts[1]) : 0;

  const totalMinutes = hour * 60 + minute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;

  return `${padHour(endHour)}:${padHour(endMinute)}`;
};

const getVehicleSizeInfo = (vehicle) =>
  getVehicleSizeOption(normalizeVehicleSize(vehicle));

const getVehicleDisplayName = (vehicle) => {
  const brand = vehicle?.brand || "";
  const model =
    vehicle?.modelName ||
    vehicle?.model_name ||
    vehicle?.model ||
    vehicle?.name ||
    "";
  const displayName = `${brand} ${model}`.trim();
  return displayName || vehicle?.label || getVehicleSizeInfo(vehicle).label;
};

const getVoucherCode = (voucher) =>
  voucher?.voucherCode ||
  voucher?.code ||
  voucher?.promotion?.voucherCode ||
  "";

const getVoucherName = (voucher) =>
  voucher?.campaignName ||
  voucher?.name ||
  voucher?.promotion?.campaignName ||
  getVoucherCode(voucher) ||
  "Voucher";

const getVoucherDiscountText = (voucher) => {
  const discountPercent =
    voucher?.discountPercent ?? voucher?.promotion?.discountPercent;
  const discountAmount =
    voucher?.discountAmount ??
    voucher?.value ??
    voucher?.promotion?.discountAmount;
  const maxDiscountAmount =
    voucher?.maxDiscountAmount ?? voucher?.promotion?.maxDiscountAmount;
  if (discountPercent) {
    return `Giảm ${discountPercent}%${
      maxDiscountAmount ? ` tối đa ${formatPrice(maxDiscountAmount)}` : ""
    }`;
  }
  if (discountAmount) return `Giảm ${formatPrice(discountAmount)}`;
  return "Ưu đãi khả dụng";
};

const getVoucherStatus = (voucher) =>
  String(voucher?.status || "AVAILABLE").toUpperCase();

const isVoucherSelectable = (voucher) =>
  ["AVAILABLE", "ACTIVE"].includes(getVoucherStatus(voucher));

const isMainServiceItem = (service) =>
  Boolean(service?.isMainService ?? service?.isMain ?? service?.mainService);

const getServiceId = (service) =>
  service?.serviceId || service?.id || service?.servicePriceId;

const getServiceName = (service) =>
  service?.serviceName || service?.name || service?.label || "Dịch vụ";

const normalizeServiceOption = (service = {}) => ({
  ...service,
  id: getServiceId(service),
  serviceId: getServiceId(service),
  servicePriceId: service.servicePriceId || service.priceId,
  name: getServiceName(service),
  label: getServiceName(service),
  price: Number(
    service.price ??
      service.servicePrice ??
      service.amount ??
      service.value ??
      service.currentPrice ??
      0,
  ),
  durationMinutes: Number(service.durationMinutes ?? service.duration ?? 0),
  duration: Number(service.duration ?? service.durationMinutes ?? 0),
  isMain: isMainServiceItem(service),
  isMainService: isMainServiceItem(service),
});

const getTierRule = (tierRules, tier) =>
  tierRules.find(
    (rule) =>
      String(rule.tierLevel || rule.tier || rule.name || "").toUpperCase() ===
      String(tier || "").toUpperCase(),
  ) || {};

const getProfileVehicles = () => {
  return [];
};

const mergeVehicles = (...groups) => {
  return mergeUniqueBy(
    groups.flat().filter(Boolean)
    .map((vehicle) => ({
      ...vehicle,
      id: vehicle.id || vehicle._id || vehicle.plate,
      label: getVehicleDisplayName(vehicle),
    })),
    (vehicle) => String(vehicle.plate || vehicle.id || "").toUpperCase(),
  );
};

export default function CustomerBooking() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => formatDateKey(today), [today]);
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookingConfig, setBookingConfig] = useState({});
  const [customerVouchers, setCustomerVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingDataError, setBookingDataError] = useState("");
  const bookingDataKeyRef = useRef("");
  const lastCarSizeRef = useRef("");

  const [userTier, setUserTier] = useState("Member");
  const [walletBalance, setWalletBalance] = useState(0);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [plate, setPlate] = useState("");
  const [service, setService] = useState("");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [date, setDate] = useState(() => formatDateKey(new Date()));
  const [timeSlot, setTimeSlot] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PAYOS");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherValue, setVoucherValue] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBookingData = async (
    carSize,
    dateParam = "",
    totalDurationParam = 0,
    initialConfig = null,
  ) => {
    const bookingDataKey = `${carSize || "ALL"}_${dateParam || ""}_${totalDurationParam || 0}`;
    if (bookingDataKeyRef.current === bookingDataKey) return;
    bookingDataKeyRef.current = bookingDataKey;

    const carSizeChanged = lastCarSizeRef.current !== (carSize || "ALL");
    if (carSizeChanged || services.length === 0) {
      setLoadingServices(true);
    } else {
      setLoadingSlots(true);
    }

    if (carSizeChanged) {
      lastCarSizeRef.current = carSize || "ALL";
      setSelectedAddons([]);
    }

    try {
      const response = await getBookingData(
        carSize,
        dateParam,
        totalDurationParam,
      );
      const payload = response.data?.data ?? response.data ?? {};
      const config =
        initialConfig ||
        unwrapPayload(await getCustomerBookingConfig().catch(() => ({})));

      const businessHours =
        payload.businessHours ||
        payload.businessWindow ||
        config.businessHours ||
        {};
      const fetchedServices = unwrapList(payload, [
        "washServices",
        "washservices",
        "availableServices",
        "services",
        "items",
        "data",
      ])
        .map(normalizeServiceOption)
        .filter((item) => item.active !== false && String(item.status || "").toUpperCase() !== "INACTIVE");
      const fetchedSlots = normalizeHourlySlots(
        payload.timeSlots ||
          payload.availableSlots ||
          payload.slots ||
          payload.availableTimeSlots ||
          [],
        businessHours,
        dateParam,
      );

      setBookingConfig({
        businessHours,
        slotDurationMinutes:
          payload.slotDurationMinutes || config.slotDurationMinutes || 60,
        tierRules:
          payload.tierRules ||
          payload.tierConfigs ||
          config.tierRules ||
          config.tierConfigs ||
          [],
      });
      setServices(fetchedServices);
      setTimeSlots(fetchedSlots);

      setTimeSlot((prevSlot) => {
        if (!prevSlot) return "";
        const matched = fetchedSlots.find((s) => s.slot === prevSlot);
        return matched && matched.available ? prevSlot : "";
      });

      if (carSizeChanged) {
        if (fetchedServices.length > 0) {
          const nextMainServices = fetchedServices.filter(
            (item) => item.isMainService === true,
          );
          const defaultMainService =
            nextMainServices.length > 0
              ? nextMainServices[0]
              : fetchedServices[0];
          if (defaultMainService) {
            setService(defaultMainService.id);
          }
        } else {
          setService("");
        }
      }
      setBookingDataError("");
    } catch {
      bookingDataKeyRef.current = "";
      setBookingDataError("Không thể tải danh sách dịch vụ cho loại xe này.");
      setServices([]);
      setTimeSlots([]);
    } finally {
      setLoadingServices(false);
      setLoadingSlots(false);
      setLoadingData(false);
    }
  };

  const carSize = selectedVehicle
    ? normalizeVehicleSize(selectedVehicle)
    : null;

  const mainServices = useMemo(() => {
    const filtered = services.filter((item) => item.isMainService === true);
    return filtered.length > 0 ? filtered : services;
  }, [services]);

  const addonServices = useMemo(() => {
    return services.filter((item) => item.isMainService === false);
  }, [services]);

  const serviceInfo = useMemo(
    () =>
      mainServices.find((item) => String(item.id) === String(service)) || {
        price: 0,
        name: "",
        description: "",
      },
    [mainServices, service],
  );

  const addonCost = selectedAddons.reduce((sum, addonId) => {
    const addon = addonServices.find(
      (item) => String(item.id) === String(addonId),
    );
    return sum + (addon?.price || 0);
  }, 0);

  const totalDuration = useMemo(() => {
    const mainServiceDuration = Number(
      serviceInfo.durationMinutes ?? serviceInfo.duration ?? 0,
    );
    const addonsDuration = selectedAddons.reduce((sum, addonId) => {
      const addon = addonServices.find(
        (item) => String(item.id) === String(addonId),
      );
      return sum + Number(addon?.durationMinutes ?? addon?.duration ?? 0);
    }, 0);
    return mainServiceDuration + addonsDuration;
  }, [serviceInfo, selectedAddons, addonServices]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const tier = getUserTier() || "Member";
        const balance = Number(getUserWalletBalance()) || 0;
        const currentUser = getUser();
        setUserTier(tier);
        setWalletBalance(balance);

        const [carsPayload, voucherPayload, configPayload, profileRes] =
          await Promise.all([
            getMyCars().catch(() => []),
            getCustomerVouchers(currentUser?.id || currentUser?.userId).catch(
              () => [],
            ),
            getCustomerBookingConfig().catch(() => ({})),
            getProfile().catch(() => null),
          ]);

        let voucherSourcePayload = voucherPayload;
        if (profileRes) {
          const profileData = profileRes.data?.data ?? profileRes.data ?? {};
          const freshBalance =
            Number(
              profileData.walletBalance ?? profileData.balance ?? balance,
            ) || 0;
          setWalletBalance(freshBalance);
          updateUser({
            id: profileData.id || currentUser?.id,
            userId: profileData.id || currentUser?.userId,
            walletBalance: freshBalance,
            name: profileData.fullName || profileData.name,
          });
          if (!currentUser?.id && !currentUser?.userId && profileData.id) {
            voucherSourcePayload = await getCustomerVouchers(
              profileData.id,
            ).catch(() => voucherPayload);
          }
        }

        const config = unwrapPayload(configPayload);
        const fetchedVehicles = Array.isArray(carsPayload) ? carsPayload : [];
        const nextVehicles = mergeVehicles(
          fetchedVehicles,
          getProfileVehicles(),
        );

        setVehicles(nextVehicles);
        const voucherList = unwrapList(voucherSourcePayload, [
          "vouchers",
          "items",
          "data",
        ]);
        setCustomerVouchers(
          voucherList.filter((voucher) => getVoucherCode(voucher)),
        );

        if (nextVehicles.length > 0) {
          setSelectedVehicle(nextVehicles[0]);
          setPlate(nextVehicles[0].plate || "");
        } else {
          // If no vehicles, trigger fetching with default car size (null)
          fetchBookingData(null, date, totalDuration, config);
        }
      } catch {
        setBookingDataError(
          "Không thể tải thông tin xe và voucher. Vui lòng thử lại sau.",
        );
        setLoadingData(false);
      }
    };

    fetchInitialData();
    // Initial booking bootstrap intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchBookingData(carSize, date, totalDuration);
    // fetchBookingData is a local loader; these values are the intended refresh triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carSize, date, totalDuration]);

  const tierRule = getTierRule(bookingConfig.tierRules || [], userTier);
  const discountPercent = Number(
    tierRule.discountPercent ?? tierRule.discountRate ?? 0,
  );
  const discountAmount = Math.round(
    ((serviceInfo.price + addonCost) * discountPercent) / 100,
  );
  const voucherAmount = voucherApplied ? voucherValue : 0;
  const subtotal = serviceInfo.price + addonCost;
  const totalPrice = Math.max(subtotal - discountAmount - voucherAmount, 0);

  useEffect(() => {
    if (paymentMethod === "WALLET" && walletBalance < totalPrice) {
      setPaymentMethod("PAYOS");
    }
  }, [totalPrice, walletBalance, paymentMethod]);

  const selectedAddonLabels = selectedAddons
    .map(
      (addonId) =>
        addonServices.find((item) => String(item.id) === String(addonId))?.name,
    )
    .filter(Boolean);

  const mainServiceLabel = serviceInfo.name || "Chưa chọn";
  const displayServiceLabel =
    selectedAddonLabels.length > 0
      ? `${mainServiceLabel} (+ ${selectedAddonLabels.join(", ")})`
      : mainServiceLabel;

  const handleToggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId],
    );
  };

  const maxDateValue = new Date(today);
  const advanceBookingDays = Number(
    tierRule.advanceBookingDays ??
      tierRule.maxBookingDays ??
      tierRule.bookingWindowDays,
  );
  const maxDate =
    Number.isFinite(advanceBookingDays) && advanceBookingDays > 0
      ? (() => {
          maxDateValue.setDate(maxDateValue.getDate() + advanceBookingDays - 1);
          return formatDateKey(maxDateValue);
        })()
      : undefined;
  const datePickerDays = useMemo(() => {
    const lastDate = maxDate
      ? new Date(`${maxDate}T12:00:00`)
      : new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 14,
          12,
        );
    const days = [];
    const cursor = new Date(`${minDate}T12:00:00`);

    while (cursor <= lastDate && days.length < 31) {
      const value = formatDateKey(cursor);
      days.push({ value, ...formatPickerDate(value) });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [maxDate, minDate, today]);
  const slotDurationMinutes = Number(bookingConfig.slotDurationMinutes) || 60;
  const businessStartTime = bookingConfig.businessHours?.startTime || "-";
  const businessEndTime = bookingConfig.businessHours?.endTime || "-";

  const availableSlots = useMemo(() => {
    if (!date || timeSlots.length === 0) return [];
    return timeSlots;
  }, [date, timeSlots]);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !selectedVehicle?.id ||
      !plate.trim() ||
      !service ||
      !date ||
      !timeSlot
    ) {
      setError("Vui lòng chọn xe, dịch vụ, ngày và khung giờ.");
      return;
    }

    const booking = {
      vehicleId: selectedVehicle.id,
      scheduledStartTime: `${date}T${timeSlot}:00`,
      serviceIds: [service, ...selectedAddons],
      customerNote: "",
      plate: plate.trim(),
      serviceId: service,
      date,
      time: timeSlot,
      startTime: timeSlot,
      endTime: getSlotEndTime(timeSlot, slotDurationMinutes),
      durationMinutes: slotDurationMinutes,
      paymentMethod,
      voucherCode: voucherApplied ? voucherCode : null,
      price: totalPrice,
    };

    setLoading(true);
    try {
      const res = await createBooking(booking);
      const raw = res?.data?.data ?? res?.data ?? {};
      const checkoutUrl = raw.checkoutUrl || raw.paymentUrl || raw.url;

      if (paymentMethod === "PAYOS" && checkoutUrl) {
        setSuccess(
          "Đặt lịch thành công! Đang chuyển hướng đến trang thanh toán PayOS...",
        );
        window.location.href = checkoutUrl;
        return;
      }

      setSuccess("Đặt lịch thành công! Đang chuyển hướng đến trang lịch sử...");
      setError("");
      setTimeout(() => {
        navigate("/history");
      }, 1500);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          "Đặt lịch chưa thực hiện được. Vui lòng thử lại sau.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const applyVoucherCode = async (code) => {
    const nextCode = String(code || "").trim();
    if (!nextCode) {
      setVoucherMessage("Vui lòng nhập mã voucher.");
      setVoucherApplied(false);
      setVoucherValue(0);
      return;
    }

    try {
      const response = await validateVoucher(nextCode);
      const voucherData = response?.data?.data ?? response?.data ?? {};
      if (voucherData.valid) {
        const discountPercent = Number(voucherData.discountPercent) || 0;
        const discountAmount =
          Number(voucherData.discountAmount ?? voucherData.value) || 0;
        const maxDiscountAmount = Number(voucherData.maxDiscountAmount) || 0;
        const nextVoucherValue = discountPercent
          ? Math.min(
              Math.round((subtotal * discountPercent) / 100),
              maxDiscountAmount || Number.MAX_SAFE_INTEGER,
            )
          : discountAmount;
        setVoucherApplied(true);
        setVoucherValue(nextVoucherValue);
        setVoucherMessage(
          `Áp dụng thành công - Giảm ${formatPrice(nextVoucherValue)}.`,
        );
      } else {
        setVoucherApplied(false);
        setVoucherValue(0);
        setVoucherMessage("Mã voucher không hợp lệ hoặc đã hết hạn.");
      }
    } catch {
      setVoucherApplied(false);
      setVoucherValue(0);
      setVoucherMessage("Mã voucher không hợp lệ.");
    }
  };

  const handleApplyVoucher = () => applyVoucherCode(voucherCode);

  const handleRefreshVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const currentUser = getUser();
      const payload = await getCustomerVouchers(
        currentUser?.id || currentUser?.userId,
      );
      const voucherList = unwrapList(payload, ["vouchers", "items", "data"]);
      setCustomerVouchers(
        voucherList.filter((voucher) => getVoucherCode(voucher)),
      );
    } catch {
      setCustomerVouchers([]);
      setVoucherMessage("Chưa tải được danh sách voucher.");
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleSelectVoucher = async (voucher) => {
    if (!isVoucherSelectable(voucher)) return;
    const code = getVoucherCode(voucher);
    setVoucherCode(code);
    setVoucherApplied(false);
    setVoucherValue(0);
    setVoucherMessage("Đang kiểm tra voucher...");
    await applyVoucherCode(code);
  };

  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setPlate(vehicle.plate || "");
    setError("");
  };

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eefbff] text-slate-600">
        <div className="rounded-[28px] border border-white/70 bg-white/70 px-8 py-6 text-lg font-black shadow-[0_24px_70px_rgba(2,74,138,0.12)] backdrop-blur-xl">
          Đang chuẩn bị khoang rửa...
        </div>
      </div>
    );
  }

  return (
    <div className="customer-motion-root relative min-h-screen bg-[#f4fafc] font-body-md text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh]">
        <img
          src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full min-h-[100dvh] w-full object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 min-h-[100dvh] bg-[linear-gradient(115deg,rgba(244,253,255,0.96),rgba(244,250,252,0.84)_46%,rgba(70,190,230,0.48))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,116,158,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,116,158,0.1)_1px,transparent_1px)] bg-[size:74px_74px]" />
        <div className="absolute right-[-140px] top-[-140px] h-[520px] w-[520px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="wash-foam-drift absolute bottom-[-120px] left-[-120px] h-72 w-[66vw] rounded-full bg-white/55 blur-3xl" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="Booking" />

        <main className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-32 sm:px-6 lg:px-10">
          <header className="relative mb-8 overflow-hidden rounded-[34px] border border-white/75 bg-white/58 p-7 shadow-[0_32px_90px_rgba(2,74,138,0.12)] backdrop-blur-2xl sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.18),transparent_28%)]" />
            <div className="relative grid gap-8 text-slate-950 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                  Đặt lịch rửa xe
                </p>
                <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-slate-950 sm:text-5xl xl:text-6xl">
                  Đặt lịch rửa xe
                </h1>

                <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                  Chọn xe, dịch vụ và giờ rửa.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/75 bg-white/58 p-5 text-left shadow-sm backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                  Giờ rửa
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-cyan-50/80 p-4">
                    <p className="text-xs font-bold text-slate-500">Mở cửa</p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {businessStartTime}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-cyan-50/80 p-4">
                    <p className="text-xs font-bold text-slate-500">Đóng ca</p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {businessEndTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-8">
              {bookingDataError && (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm font-bold text-amber-800 shadow-sm backdrop-blur">
                  {bookingDataError}
                </div>
              )}
              <section className="rounded-[30px] border border-white/75 bg-white/72 p-4 shadow-sm backdrop-blur-2xl md:p-5">
                <div className="grid gap-3 md:grid-cols-5">
                  {(() => {
                    const steps = [
                      {
                        number: "01",
                        label: "Chọn xe",
                        icon: "directions_car",
                        sectionId: "section-car",
                        isCompleted: !!selectedVehicle,
                      },
                      {
                        number: "02",
                        label: "Dịch vụ chính",
                        icon: "local_car_wash",
                        sectionId: "section-main-service",
                        isCompleted: !!selectedVehicle && !!service,
                      },
                      {
                        number: "03",
                        label: "Dịch vụ phụ",
                        icon: "add_circle",
                        sectionId: "section-addon-service",
                        isCompleted: !!selectedVehicle && !!service,
                      },
                      {
                        number: "04",
                        label: "Ngày giờ",
                        icon: "schedule",
                        sectionId: "section-datetime",
                        isCompleted:
                          !!selectedVehicle &&
                          !!service &&
                          !!date &&
                          !!timeSlot,
                      },
                      {
                        number: "05",
                        label: "Thanh toán",
                        icon: "payments",
                        sectionId: "section-payment",
                        isCompleted:
                          !!selectedVehicle &&
                          !!service &&
                          !!date &&
                          !!timeSlot &&
                          !!paymentMethod,
                      },
                    ];
                    const firstIncomplete = steps.findIndex(
                      (s) => !s.isCompleted,
                    );
                    const activeIndex =
                      firstIncomplete === -1 ? 4 : firstIncomplete;

                    return steps.map((item, index) => {
                      const isActive = index === activeIndex;
                      const isCompleted = item.isCompleted;

                      let cardStyle =
                        "bg-white/40 border-white/60 opacity-60 hover:opacity-100 hover:bg-white/80 text-slate-500 hover:shadow-sm";
                      let bubbleStyle = "bg-slate-200/80 text-slate-500";

                      if (isCompleted) {
                        cardStyle =
                          "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 text-emerald-800";
                        bubbleStyle = "bg-emerald-600 text-white";
                      } else if (isActive) {
                        cardStyle =
                          "bg-cyan-500/10 border-cyan-400 ring-1 ring-cyan-400 shadow-[0_10px_30px_rgba(6,182,212,0.12)] hover:bg-cyan-500/15 text-cyan-800";
                        bubbleStyle =
                          "bg-cyan-600 text-white animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.5)]";
                      }

                      return (
                        <button
                          type="button"
                          key={item.number}
                          onClick={() => scrollToSection(item.sectionId)}
                          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 active:scale-[0.97] ${cardStyle}`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${bubbleStyle}`}
                          >
                            {isCompleted ? (
                              <span className="material-symbols-outlined text-[16px] font-black">
                                check
                              </span>
                            ) : (
                              item.number
                            )}
                          </span>
                          <div className="min-w-0">
                            <span className="material-symbols-outlined block text-[20px]">
                              {item.icon}
                            </span>
                            <p className="truncate text-xs font-black">
                              {item.label}
                            </p>
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </section>
              <section
                id="section-car"
                className="scroll-mt-32 rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8"
              >
                <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                  <span className="material-symbols-outlined">
                    directions_car
                  </span>
                  Chọn xe của bạn
                </h2>
                <p className="mb-6 text-base font-medium text-slate-500">
                  Chọn xe cần rửa.
                </p>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {loadingData ? (
                    <div className="col-span-full rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-6 text-center text-sm font-semibold text-slate-500">
                      Đang tải xe...
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-6 text-center text-sm font-semibold text-slate-500">
                      Chưa có xe nào.
                    </div>
                  ) : (
                    vehicles.map((vehicle) => {
                      const active = selectedVehicle?.id === vehicle.id;
                      return (
                        <button
                          key={vehicle.id || vehicle.plate}
                          type="button"
                          onClick={() => selectVehicle(vehicle)}
                          className={`flex min-h-36 flex-col items-center justify-center rounded-[24px] border p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-cyan-50 ${
                            active
                              ? "border-cyan-300 bg-cyan-50 shadow-[0_18px_40px_rgba(6,182,212,0.12)]"
                              : "border-white/80 bg-white/72"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined mb-2 text-4xl ${
                              active ? "text-cyan-700" : "text-slate-500"
                            }`}
                          >
                            {getVehicleSizeInfo(vehicle).icon}
                          </span>
                          <p className="text-base font-black">
                            {getVehicleDisplayName(vehicle)}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {vehicle.plate}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700">
                            {getVehicleSizeInfo(vehicle).label}
                          </p>
                        </button>
                      );
                    })
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/profile?returnTo=${encodeURIComponent("/booking")}`,
                      )
                    }
                    className="flex min-h-36 flex-col items-center justify-center rounded-[24px] border border-dashed border-cyan-200 bg-white/60 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50"
                  >
                    <span className="material-symbols-outlined mb-2 text-4xl text-cyan-700">
                      add_circle
                    </span>
                    <p className="text-xs font-black text-slate-500">
                      Thêm xe mới
                    </p>
                  </button>
                </div>
              </section>

              <section
                id="section-main-service"
                className="scroll-mt-32 rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8"
              >
                <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                  <span className="material-symbols-outlined">layers</span>
                  Chọn Dịch Vụ Rửa Xe
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-cyan-700">
                      Dịch vụ chính (Chọn 1)
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {loadingServices ? (
                        <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-6 text-center text-sm font-semibold text-slate-500">
                          Đang tải dịch vụ...
                        </div>
                      ) : mainServices.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-6 text-center text-sm font-semibold text-slate-500">
                          Chưa có gói dịch vụ chính nào.
                        </div>
                      ) : (
                        mainServices.map((item) => {
                          const active = service === item.id;
                          return (
                            <label
                              key={item.id}
                              className={`relative flex min-h-[190px] cursor-pointer flex-col rounded-[26px] border p-5 transition-all hover:-translate-y-0.5 hover:bg-cyan-50 ${
                                active
                                  ? "border-cyan-400 bg-cyan-50 shadow-[0_22px_55px_rgba(0,164,214,0.18)]"
                                  : "border-white/80 bg-white/72"
                              }`}
                            >
                              <input
                                type="radio"
                                name="service"
                                checked={active}
                                onChange={() => setService(item.id)}
                                className="sr-only"
                              />
                              <div className="mb-5 flex items-start justify-between gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#003c5f] text-cyan-100">
                                  <span className="material-symbols-outlined">
                                    local_car_wash
                                  </span>
                                </span>
                                <div className="flex items-center gap-2">
                                  {item.rating ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                      <span className="text-amber-500">★</span>
                                      {item.rating}
                                      {item.ratingCount ? <span className="text-[10px] text-amber-700">({item.ratingCount})</span> : null}
                                    </span>
                                  ) : null}
                                  <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
                                      active
                                        ? "bg-cyan-400 text-slate-950"
                                        : "bg-white text-cyan-800 ring-1 ring-cyan-100"
                                    }`}
                                  >
                                    {active ? "Đã chọn" : "Gói chính"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-1 flex-col">
                                <h4 className="text-xl font-black leading-tight text-slate-950">
                                  {item.name || "Dịch vụ"}
                                </h4>
                                <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                                  {item.description || "Gói rửa xe tiêu chuẩn"}
                                </p>
                                <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                                  <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                                    {item.durationMinutes ||
                                      item.duration ||
                                      60}{" "}
                                    phút
                                  </span>
                                  <span className="whitespace-nowrap text-2xl font-black text-cyan-700">
                                    {formatPrice(item.price)}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {addonServices.length > 0 && (
                <section
                  id="section-addon-service"
                  className="scroll-mt-32 rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8"
                >
                  <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                    <span className="material-symbols-outlined">
                      add_circle
                    </span>
                    Dịch vụ phụ (Chọn nhiều)
                  </h2>
                  <p className="mb-6 text-base font-medium text-slate-500">
                    Chọn các dịch vụ đi kèm bổ sung nếu cần thiết.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {addonServices.map((item) => {
                      const active = selectedAddons.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center gap-4 rounded-[22px] border p-4 transition-all hover:-translate-y-0.5 hover:bg-cyan-50 ${
                            active
                              ? "border-cyan-300 bg-cyan-50 shadow-[0_18px_40px_rgba(6,182,212,0.12)]"
                              : "border-white/80 bg-white/72"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => handleToggleAddon(item.id)}
                            className="h-5 w-5 rounded border-cyan-200 text-cyan-600 focus:ring-cyan-500"
                          />
                          <div className="flex-grow">
                            <div className="mb-1 flex justify-between gap-4">
                              <h4 className="font-black text-slate-950">
                                {item.name || "Dịch vụ phụ"}
                              </h4>
                              <div className="flex items-center gap-2">
                                {item.rating ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                    <span className="text-amber-500">★</span>
                                    {item.rating}
                                  </span>
                                ) : null}
                                <span className="whitespace-nowrap font-black text-cyan-700">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            </div>
                            <p className="line-clamp-2 text-xs font-semibold text-slate-500">
                              {item.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>
              )}

              <section
                id="section-datetime"
                className="scroll-mt-32 rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8"
              >
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                      <span className="material-symbols-outlined text-base">
                        calendar_month
                      </span>
                      Chọn ngày
                    </p>
                    <h2 className="text-2xl font-black text-slate-950">
                      Ngày & giờ rửa
                    </h2>
                  </div>
                  <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700">
                    {date ? formatPickerDate(date).fullLabel : "Chưa chọn ngày"}
                  </span>
                </div>

                <div
                  className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7"
                  aria-label="Danh sách ngày có thể đặt lịch"
                >
                  {datePickerDays.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        if (date === item.value) return;
                        setDate(item.value);
                        setTimeSlot("");
                      }}
                      aria-pressed={date === item.value}
                      className={`min-h-[88px] rounded-2xl border px-3 py-3 text-left transition duration-200 active:scale-[0.98] ${
                        date === item.value
                          ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_14px_30px_rgba(6,182,212,0.2)]"
                          : "border-white/80 bg-white/75 text-slate-600 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50"
                      }`}
                    >
                      <span className="block text-xs font-black uppercase tracking-[0.12em] opacity-75">
                        {item.weekday}
                      </span>
                      <span className="mt-1 block text-2xl font-black">
                        {item.day}
                      </span>
                      <span className="mt-1 block text-xs font-bold opacity-75">
                        {item.month}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-7">
                  <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    <span className="material-symbols-outlined text-base">
                      schedule
                    </span>
                    Chọn khung giờ
                  </p>
                  {(loadingServices || loadingSlots) ? (
                    <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-5 text-center text-sm font-semibold text-slate-500">
                      Đang tải khung giờ...
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-5 text-center text-sm font-semibold text-slate-500">
                      Chưa có khung giờ nào cho ngày này.
                    </div>
                  ) : (
                    <div
                      className="grid max-h-[248px] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4"
                      aria-label="Danh sách khung giờ"
                    >
                      {(availableSlots.length
                        ? availableSlots
                        : timeSlots.map((item) => ({
                            slot: item.slot,
                            endTime: item.endTime,
                            label: item.label,
                            available: true,
                          }))
                      ).map((item) => (
                        <button
                          key={item.slot}
                          type="button"
                          disabled={!item.available}
                          onClick={() => {
                            if (!date) setDate(minDate);
                            setTimeSlot(item.slot);
                          }}
                          className={`min-h-[54px] rounded-xl border px-3 py-3 text-sm font-black transition duration-200 active:scale-[0.98] ${
                            !item.available
                              ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400 opacity-60"
                              : timeSlot === item.slot
                                ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_14px_30px_rgba(6,182,212,0.2)]"
                                : "border-white/80 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {date && timeSlot && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/75 px-4 py-3 text-sm font-bold text-slate-700">
                    <span className="material-symbols-outlined text-cyan-700">
                      event_available
                    </span>
                    <span>
                      Bạn đã chọn:{" "}
                      <strong className="text-slate-950">{timeSlot}</strong> ·{" "}
                      {formatPickerDate(date).fullLabel}
                    </span>
                  </div>
                )}
              </section>

              <section
                id="section-payment"
                className="scroll-mt-32 rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8"
              >
                <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                  <span className="material-symbols-outlined">payments</span>
                  Thanh toán
                </h2>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label
                    className={`relative flex cursor-pointer flex-col rounded-[24px] border p-5 transition-all ${
                      paymentMethod === "PAYOS"
                        ? "border-cyan-300 bg-cyan-50 shadow-[0_18px_40px_rgba(6,182,212,0.12)]"
                        : "border-white/80 bg-white/72 hover:-translate-y-0.5 hover:bg-cyan-50"
                    }`}
                  >
                    <div className="mb-2 flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "PAYOS"}
                        onChange={() => setPaymentMethod("PAYOS")}
                        className="mt-1 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-cyan-700">
                            credit_card
                          </span>
                          <span className="font-black text-slate-950">
                            Cổng thanh toán PayOS
                          </span>
                        </div>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          Thanh toán trực tuyến qua cổng PayOS
                        </span>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`relative flex cursor-pointer flex-col rounded-[24px] border p-5 transition-all ${
                      paymentMethod === "CASH"
                        ? "border-cyan-300 bg-cyan-50 shadow-[0_18px_40px_rgba(6,182,212,0.12)]"
                        : "border-white/80 bg-white/72 hover:-translate-y-0.5 hover:bg-cyan-50"
                    }`}
                  >
                    <div className="mb-2 flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "CASH"}
                        onChange={() => setPaymentMethod("CASH")}
                        className="mt-1 border-cyan-100 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-700">
                          payments
                        </span>
                        <span className="font-black text-slate-950">
                          Tiền mặt tại quầy
                        </span>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`relative flex flex-col rounded-[24px] border p-5 transition-all ${
                      walletBalance < totalPrice
                        ? "border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed"
                        : paymentMethod === "WALLET"
                          ? "border-cyan-300 bg-cyan-50 shadow-[0_18px_40px_rgba(6,182,212,0.12)] cursor-pointer"
                          : "border-white/80 bg-white/72 hover:-translate-y-0.5 hover:bg-cyan-50 cursor-pointer"
                    }`}
                  >
                    <div className="mb-2 flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment"
                        disabled={walletBalance < totalPrice}
                        checked={paymentMethod === "WALLET"}
                        onChange={() => setPaymentMethod("WALLET")}
                        className="mt-1 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-cyan-700">
                            account_balance_wallet
                          </span>
                          <span className="font-black text-slate-950">
                            Ví Website
                          </span>
                        </div>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          Số dư ví: {formatPrice(walletBalance)}
                        </span>
                        {walletBalance < totalPrice && (
                          <span className="mt-2 block text-xs font-bold text-rose-600">
                            Số dư ví không đủ để thanh toán.{" "}
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate("/profile?tab=wallet");
                              }}
                              className="underline cursor-pointer text-cyan-700 hover:text-cyan-900"
                            >
                              [Nạp thêm tiền vào ví]
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm font-semibold text-slate-600">
                  Số dư điểm thưởng/ví hiện tại:{" "}
                  <strong>{formatPrice(walletBalance)}</strong>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                      Mã Voucher
                    </label>
                    <button
                      type="button"
                      onClick={handleRefreshVouchers}
                      className="text-xs font-black text-cyan-700 transition hover:text-cyan-900"
                    >
                      {loadingVouchers ? "Đang tải..." : "Tải lại"}
                    </button>
                  </div>
                  <div className="mb-3">
                    {customerVouchers.length > 0 && (
                      <div className="max-h-64 overflow-y-auto rounded-2xl border border-cyan-100 bg-white/70 p-2">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="text-slate-500">
                              <th className="px-3 py-2 font-black uppercase tracking-[0.12em]">
                                Mã
                              </th>
                              <th className="px-3 py-2 font-black uppercase tracking-[0.12em]">
                                Ưu đãi
                              </th>
                              <th className="px-3 py-2 font-black uppercase tracking-[0.12em]">
                                Hạn
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerVouchers.map((voucher) => {
                              const code = getVoucherCode(voucher);
                              const active = voucherCode === code;
                              const selectable = isVoucherSelectable(voucher);
                              return (
                                <tr
                                  key={voucher.id || code}
                                  onClick={() => handleSelectVoucher(voucher)}
                                  className={`cursor-pointer border-t border-cyan-50 transition ${
                                    active
                                      ? "bg-cyan-100/80 text-cyan-900"
                                      : selectable
                                        ? "hover:bg-cyan-50"
                                        : "cursor-not-allowed text-slate-400 opacity-70"
                                  }`}
                                >
                                  <td className="px-3 py-3 font-black">
                                    {code}
                                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                      {getVoucherStatus(voucher)}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 font-semibold">
                                    <div className="font-black text-slate-800">
                                      {getVoucherName(voucher)}
                                    </div>
                                    <div className="mt-1 text-slate-500">
                                      {getVoucherDiscountText(voucher)}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 font-semibold text-slate-500">
                                    {voucher.expiredAt
                                      ? new Date(
                                          voucher.expiredAt,
                                        ).toLocaleDateString("vi-VN")
                                      : "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(event) => setVoucherCode(event.target.value)}
                      placeholder="Nhập mã giảm giá..."
                      className="min-w-0 flex-grow rounded-2xl border border-cyan-100 bg-white/80 p-4 font-bold outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="whitespace-nowrap rounded-2xl bg-slate-950 px-6 py-4 font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {voucherMessage && (
                    <p
                      className={`mt-2 text-xs font-semibold ${
                        voucherApplied ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {voucherMessage}
                    </p>
                  )}
                </div>
              </section>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {success}
                </div>
              )}
            </form>

            <BookingSummary
              date={date}
              discountAmount={discountAmount}
              discountPercent={discountPercent}
              formatPrice={formatPrice}
              getSlotEndTime={getSlotEndTime}
              handleSubmit={handleSubmit}
              loading={loading}
              selectedVehicle={selectedVehicle}
              serviceInfo={{
                ...serviceInfo,
                label: displayServiceLabel,
              }}
              subtotal={subtotal}
              success={success}
              timeSlot={timeSlot}
              totalPrice={totalPrice}
              userTier={userTier}
              voucherAmount={voucherAmount}
              totalDuration={totalDuration}
            />
          </div>
        </main>

      </div>
    </div>
  );
}
