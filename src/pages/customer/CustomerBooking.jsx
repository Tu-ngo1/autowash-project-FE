import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import BookingSummary from "../../components/booking/BookingSummary";
import { getUser, getUserTier, getUserWalletBalance } from "../../utils/auth";
import { createBooking, getBookingData } from "../../services/customerBookingApi";
import { validateVoucher } from "../../services/customerVoucherApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";

const formatPrice = (price) => price.toLocaleString("vi-VN") + "đ";
const SLOT_DURATION_MINUTES = 60;
const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 18;

const padHour = (hour) => String(hour).padStart(2, "0");

const normalizeHourlySlots = (slots = []) => {
  const normalized = slots
    .map((slot) => {
      const value = typeof slot === "object" ? slot.time || slot.slot || slot.startTime : slot;
      const [hourText] = String(value).split(":");
      const hour = Number(hourText);
      if (!Number.isInteger(hour)) return null;
      if (hour < BUSINESS_START_HOUR || hour >= BUSINESS_END_HOUR) return null;
      const start = `${padHour(hour)}:00`;
      return {
        slot: start,
        endTime: getSlotEndTime(start),
        label: slot?.label || `${start} - ${getSlotEndTime(start)}`,
        available: typeof slot === "object" && slot.available !== undefined
          ? Boolean(slot.available)
          : true,
      };
    })
    .filter(Boolean);

  return normalized.filter(
    (slot, index, list) =>
      list.findIndex((item) => item.slot === slot.slot) === index,
  );
};

const getSlotEndTime = (slot) => {
  const [hourText] = String(slot).split(":");
  const hour = Number(hourText);
  if (!Number.isInteger(hour)) return "";
  return `${padHour(hour + 1)}:00`;
};

const tierDiscount = (tier) => {
  if (tier === "Gold") return 10;
  if (tier === "Silver") return 5;
  if (tier === "Platinum") return 12;
  return 0;
};

const TIER_LIMITS = { Member: 7, Silver: 10, Gold: 12, Platinum: 14 };

const VEHICLE_SIZE_OPTIONS = {
  SMALL: { label: "SMALL", description: "4-5 chỗ", icon: "directions_car" },
  MEDIUM: { label: "MEDIUM", description: "CUV/SUV 5 chỗ", icon: "commute" },
  LARGE: { label: "LARGE", description: "7 chỗ", icon: "airport_shuttle" },
  XLARGE: { label: "XLARGE", description: "Bán tải, Van", icon: "local_shipping" },
};

const normalizeVehicleSize = (vehicle) => {
  const rawSize = String(vehicle?.size || vehicle?.vehicleSize || vehicle?.type || "").toUpperCase();
  if (VEHICLE_SIZE_OPTIONS[rawSize]) return rawSize;
  if (String(vehicle?.type || "").includes("7")) return "LARGE";
  if (String(vehicle?.type || "").toLowerCase().includes("suv")) return "MEDIUM";
  return "SMALL";
};

const getVehicleSizeInfo = (vehicle) =>
  VEHICLE_SIZE_OPTIONS[normalizeVehicleSize(vehicle)] || VEHICLE_SIZE_OPTIONS.SMALL;

const mergeVehicles = (...groups) => {
  const seen = new Set();
  return groups
    .flat()
    .filter(Boolean)
    .map((vehicle) => ({
      ...vehicle,
      id: vehicle.id || vehicle._id || vehicle.plate,
      label:
        vehicle.label ||
        vehicle.name ||
        `${getVehicleSizeInfo(vehicle).label} - ${getVehicleSizeInfo(vehicle).description}`,
    }))
    .filter((vehicle) => {
      const key = String(vehicle.plate || vehicle.id || "").toUpperCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export default function CustomerBooking() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [bookingDataError, setBookingDataError] = useState("");

  const [userTier, setUserTier] = useState("Member");
  const [walletBalance, setWalletBalance] = useState(0);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [plate, setPlate] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PAYOS");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherValue, setVoucherValue] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tier = getUserTier() || "Member";
        const balance = Number(getUserWalletBalance()) || 0;
        setUserTier(tier);
        setWalletBalance(balance);

        const response = await getBookingData();
        const payload = response.data || {};
        const fetchedVehicles = Array.isArray(payload.vehicles)
          ? payload.vehicles
          : [];
        const profileVehicles = Array.isArray(getUser()?.vehicles)
          ? getUser().vehicles
          : [];
        const fetchedServices = Array.isArray(payload.services)
          ? payload.services
          : [];
        const fetchedSlots = normalizeHourlySlots(payload.timeSlots);
        const nextVehicles = mergeVehicles(fetchedVehicles, profileVehicles);

        setVehicles(nextVehicles);
        setServices(fetchedServices);
        setTimeSlots(fetchedSlots);

        if (nextVehicles.length > 0) {
          setSelectedVehicle(nextVehicles[0]);
          setPlate(nextVehicles[0].plate || "");
        }
        if (fetchedServices.length > 0) {
          const popular =
            fetchedServices.find((item) => item.popular) || fetchedServices[1];
          setService((popular || fetchedServices[0]).id);
        }
      } catch {
        setBookingDataError(
          "Không thể tải dữ liệu đặt lịch. Vui lòng thử lại sau.",
        );
        const profileVehicles = Array.isArray(getUser()?.vehicles)
          ? getUser().vehicles
          : [];
        const nextVehicles = mergeVehicles(profileVehicles);
        setVehicles(nextVehicles);
        if (nextVehicles.length > 0) {
          setSelectedVehicle(nextVehicles[0]);
          setPlate(nextVehicles[0].plate || "");
        }
        setServices([]);
        setTimeSlots([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const serviceInfo = services.find((item) => item.id === service) || {
    price: 0,
    label: "",
    description: "",
  };
  const discountPercent = tierDiscount(userTier);
  const discountAmount = Math.round(
    (serviceInfo.price * discountPercent) / 100,
  );
  const voucherAmount = voucherApplied ? voucherValue : 0;
  const subtotal = serviceInfo.price;
  const totalPrice = Math.max(subtotal - discountAmount - voucherAmount, 0);

  const today = new Date();
  const minDate = today.toISOString().slice(0, 10);
  const maxDateValue = new Date(today);
  maxDateValue.setDate(maxDateValue.getDate() + (TIER_LIMITS[userTier] ?? 7));
  const maxDate = maxDateValue.toISOString().slice(0, 10);

  const availableSlots = useMemo(() => {
    if (!date || timeSlots.length === 0) return [];
    return timeSlots;
  }, [date, timeSlots]);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setError("");
    setSuccess("");

    if (!plate.trim() || !service || !date || !timeSlot) {
      setError("Vui lòng điền đủ thông tin Biển số, Dịch vụ, Ngày và Khung giờ.");
      return;
    }

    const booking = {
      plate: plate.trim(),
      serviceId: service,
      date,
      time: timeSlot,
      startTime: timeSlot,
      endTime: getSlotEndTime(timeSlot),
      durationMinutes: SLOT_DURATION_MINUTES,
      paymentMethod,
      voucherCode: voucherApplied ? voucherCode : null,
      price: totalPrice,
    };

    setLoading(true);
    try {
      await createBooking(booking);
      setSuccess("Đặt lịch thành công!");
      setError("");
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

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherMessage("Vui lòng nhập mã voucher.");
      setVoucherApplied(false);
      setVoucherValue(0);
      return;
    }

    try {
      const response = await validateVoucher(voucherCode);
      if (response.data.valid) {
        setVoucherApplied(true);
        setVoucherValue(response.data.value || 0);
        setVoucherMessage(
          `Áp dụng thành công - Giảm ${formatPrice(response.data.value || 0)}.`,
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
    <div className="customer-motion-root relative min-h-screen overflow-x-hidden bg-[#eefbff] font-body-md text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh]">
        <img
          src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full min-h-[100dvh] w-full object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 min-h-[100dvh] bg-[linear-gradient(115deg,rgba(255,255,255,0.98),rgba(235,252,255,0.9)_46%,rgba(178,232,255,0.66))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.07)_1px,transparent_1px)] bg-[size:74px_74px]" />
        <div className="absolute right-[-140px] top-[-140px] h-[520px] w-[520px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="wash-foam-drift absolute bottom-[-120px] left-[-120px] h-72 w-[66vw] rounded-full bg-white/55 blur-3xl" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="Booking" />

      <main className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-32 sm:px-6 lg:px-10">
        <header className="relative mb-8 overflow-hidden rounded-[34px] border border-white/75 bg-white/58 shadow-[0_32px_90px_rgba(2,74,138,0.12)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.18),transparent_28%)]" />
          <div className="absolute inset-x-10 top-8 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="wash-scan absolute left-10 right-10 top-8 h-14 rounded-full bg-gradient-to-b from-white/60 via-cyan-200/38 to-transparent blur-xl" />
          <div className="relative grid min-h-[340px] items-end gap-8 p-7 text-slate-950 sm:p-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                Đặt lịch rửa xe
              </p>
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-normal sm:text-6xl">
                Chọn xe, chọn gói, vào khoang rửa.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                Lên lịch phủ bọt tuyết, xịt áp lực, lau chi tiết và sấy khô.
                Hệ thống tự ghi nhận thời gian, dịch vụ và ưu đãi theo hạng.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/75 bg-white/58 p-5 text-left shadow-sm backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                Wash window
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-cyan-50/80 p-4">
                  <p className="text-xs font-bold text-slate-500">Mở cửa</p>
                  <p className="mt-2 text-xl font-black text-slate-950">08:00</p>
                </div>
                <div className="rounded-2xl bg-cyan-50/80 p-4">
                  <p className="text-xs font-bold text-slate-500">Đóng ca</p>
                  <p className="mt-2 text-xl font-black text-slate-950">18:00</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
                Mỗi lượt rửa tiêu chuẩn giữ khoang trong 60 phút để xe được xử lý
                sạch và không bị gấp quy trình.
              </p>
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
            <section className="rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                <span className="material-symbols-outlined">
                  directions_car
                </span>
                Chọn xe của bạn
              </h2>
              <p className="mb-6 text-base font-medium text-slate-500">
                Chọn xe sẽ vào khoang rửa hôm nay.
              </p>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {vehicles.length === 0 ? (
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
                          {vehicle.label || vehicle.name || getVehicleSizeInfo(vehicle).label}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {vehicle.plate}
                        </p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700">
                          {getVehicleSizeInfo(vehicle).description}
                        </p>
                      </button>
                    );
                  })
                )}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/profile?returnTo=${encodeURIComponent(
                        "/booking",
                      )}`,
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

              <div className="mt-6">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                  Biển số xe
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(event) => setPlate(event.target.value)}
                  placeholder="VD: 51A-123.45"
                  className="w-full rounded-2xl border border-cyan-100 bg-white/80 p-4 font-bold outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            </section>

            <section className="rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                <span className="material-symbols-outlined">layers</span>
                Gói dịch vụ
              </h2>

              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-6 text-center text-sm font-semibold text-slate-500">
                    Chưa có gói dịch vụ nào.
                  </div>
                ) : (
                  services.map((item, index) => {
                  const active = service === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-[24px] border p-5 transition-all hover:-translate-y-0.5 hover:bg-cyan-50 ${
                        active
                          ? "border-cyan-300 bg-cyan-50 shadow-[0_18px_40px_rgba(6,182,212,0.12)]"
                          : "border-white/80 bg-white/72"
                      }`}
                    >
                      <input
                        type="radio"
                        name="service"
                        checked={active}
                        onChange={() => setService(item.id)}
                        className="h-5 w-5 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="flex-grow">
                        <div className="mb-1 flex justify-between gap-4">
                          <h3 className="font-black text-slate-950">
                            {item.label || item.name || "Dịch vụ"}
                          </h3>
                          <span className="whitespace-nowrap font-black text-cyan-700">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                          {item.description}
                        </p>
                        {(item.popular || index === 1) && (
                          <span className="mt-2 inline-block rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">
                            PHỔ BIẾN NHẤT
                          </span>
                        )}
                      </div>
                    </label>
                  );
                  })
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                <span className="material-symbols-outlined">schedule</span>
                Ngày & Giờ
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    Chọn ngày
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={minDate}
                    max={maxDate}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-2xl border border-cyan-100 bg-white/80 p-4 font-bold outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    Chọn khung giờ
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.length === 0 ? (
                      <div className="col-span-3 rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-4 text-center text-xs font-semibold text-slate-500">
                        Chưa có khung giờ nào.
                      </div>
                    ) : (
                      (availableSlots.length
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
                        className={`rounded-2xl border p-3 text-xs font-black transition-all ${
                          !item.available
                            ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"
                            : timeSlot === item.slot
                              ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_14px_30px_rgba(6,182,212,0.2)]"
                              : "border-white/80 bg-white/80 hover:-translate-y-0.5 hover:bg-cyan-50"
                        }`}
                      >
                        {item.label}
                      </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-950">
                <span className="material-symbols-outlined">payments</span>
                Thanh toán
              </h2>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                          qr_code_2
                        </span>
                        <span className="font-black text-slate-950">
                          Trả trước qua PayOS (VietQR)
                        </span>
                      </div>
                      <span className="mt-1 block text-xs font-semibold text-slate-500">
                        Hoàn bằng Điểm thưởng nếu hủy lịch
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
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm font-semibold text-slate-600">
                Số dư điểm thưởng/ví hiện tại:{" "}
                <strong>{formatPrice(walletBalance)}</strong>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                  Mã Voucher
                </label>
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
            serviceInfo={serviceInfo}
            subtotal={subtotal}
            success={success}
            timeSlot={timeSlot}
            totalPrice={totalPrice}
            userTier={userTier}
            voucherAmount={voucherAmount}
          />
        </div>
      </main>

      <footer className="mt-14 border-t border-white/70 bg-white/44 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1520px] flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row lg:px-10">
          <div>
            <div className="mb-2 text-2xl font-black text-slate-950">
              autoWash
            </div>
            <p className="text-base font-semibold text-slate-500">
              © 2024 autoWash - Giải pháp chăm sóc xe chuyên nghiệp
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              "Về chúng tôi",
              "Điều khoản dịch vụ",
              "Chính sách bảo mật",
              "Liên hệ",
            ].map((link) => (
              <button
                key={link}
                type="button"
                className="text-base font-bold text-slate-500 transition-colors hover:text-cyan-700"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
