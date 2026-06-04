import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import BookingSummary from "../../components/booking/BookingSummary";
import { getUser, getUserTier, getUserWalletBalance } from "../../utils/auth";
import { createBooking, getBookingData } from "../../services/bookingApi";
import { validateVoucher } from "../../services/promotionApi";

const formatPrice = (price) => price.toLocaleString("vi-VN") + "đ";
const SLOT_DURATION_MINUTES = 60;
const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 18;

const padHour = (hour) => String(hour).padStart(2, "0");

const normalizeHourlySlots = (slots = []) => {
  const normalized = slots
    .map((slot) => {
      const [hourText] = String(slot).split(":");
      const hour = Number(hourText);
      if (!Number.isInteger(hour)) return null;
      if (hour < BUSINESS_START_HOUR || hour >= BUSINESS_END_HOUR) return null;
      return `${padHour(hour)}:00`;
    })
    .filter(Boolean);

  return [...new Set(normalized)];
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

const mergeVehicles = (...groups) => {
  const seen = new Set();
  return groups
    .flat()
    .filter(Boolean)
    .map((vehicle) => ({
      ...vehicle,
      id: vehicle.id || vehicle._id || vehicle.plate,
      label: vehicle.label || vehicle.name || vehicle.type || "Xe",
    }))
    .filter((vehicle) => {
      const key = String(vehicle.plate || vehicle.id || "").toUpperCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export default function BookingPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

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
    const day = new Date(date).getDate();
    return timeSlots.map((slot, index) => ({
      slot,
      endTime: getSlotEndTime(slot),
      label: `${slot} - ${getSlotEndTime(slot)}`,
      available: (day + index) % 3 !== 0,
    }));
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
      const message =
        err?.response?.data?.message ||
        "Đặt lịch thất bại, vui lòng thử lại sau.";
      setError(message);
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
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fb] text-[#3f4753]">
        <div className="animate-pulse text-lg font-semibold">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-[#191c1e]">
      <UserNavbar active="Booking" />

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-12 xl:px-14">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-[40px] font-bold leading-[48px] text-[#0061a5]">
            Đặt lịch dịch vụ
          </h1>
          <p className="text-lg leading-7 text-[#3f4753]">
            Chọn các tùy chọn phù hợp để chiếc xe của bạn luôn sáng bóng.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-8">
            <section className="rounded-xl bg-white p-6 shadow-[0_4px_20px_rgba(13,153,255,0.05)] md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-[#0061a5]">
                <span className="material-symbols-outlined">
                  directions_car
                </span>
                Chọn xe của bạn
              </h2>
              <p className="mb-6 text-base text-[#3f4753]">
                Chọn xe bạn muốn chăm sóc hôm nay.
              </p>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {vehicles.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-dashed border-[#bfc7d5] bg-[#f7f9fb] p-6 text-center text-sm text-[#3f4753]">
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
                        className={`flex min-h-36 flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all hover:bg-[#e0f2fe] ${
                          active
                            ? "border-[#0061a5] bg-[#d2e4ff]/30"
                            : "border-[#bfc7d5] bg-white"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined mb-2 text-4xl ${
                            active ? "text-[#0061a5]" : "text-[#3f4753]"
                          }`}
                        >
                          {vehicle.type === "SUV"
                            ? "electric_car"
                            : "directions_car"}
                        </span>
                        <p className="text-base font-bold">
                          {vehicle.label || vehicle.name || vehicle.type || "Xe"}
                        </p>
                        <p className="text-xs font-semibold text-[#3f4753]">
                          {vehicle.plate}
                        </p>
                      </button>
                    );
                  })
                )}

                <button
                  type="button"
                  onClick={() => navigate("/profile?addVehicle=1")}
                  className="flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#bfc7d5] bg-white p-4 text-center transition-all hover:border-[#0061a5] hover:bg-[#e0f2fe]"
                >
                  <span className="material-symbols-outlined mb-2 text-4xl text-[#707884]">
                    add_circle
                  </span>
                  <p className="text-xs font-bold text-[#3f4753]">
                    Thêm xe mới
                  </p>
                </button>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-xs font-semibold text-[#3f4753]">
                  Biển số xe
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(event) => setPlate(event.target.value)}
                  placeholder="VD: 51A-123.45"
                  className="w-full rounded-lg border border-[#bfc7d5] p-3 outline-none transition focus:border-[#0061a5] focus:ring-2 focus:ring-[#0061a5]/20"
                />
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-[0_4px_20px_rgba(13,153,255,0.05)] md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-[#0061a5]">
                <span className="material-symbols-outlined">layers</span>
                Gói dịch vụ
              </h2>

              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#bfc7d5] bg-[#f7f9fb] p-6 text-center text-sm text-[#3f4753]">
                    Chưa có gói dịch vụ nào.
                  </div>
                ) : (
                  services.map((item, index) => {
                  const active = service === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all hover:bg-[#e0f2fe] ${
                        active
                          ? "border-[#0061a5] bg-[#d2e4ff]/20"
                          : "border-[#bfc7d5] bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="service"
                        checked={active}
                        onChange={() => setService(item.id)}
                        className="h-5 w-5 text-[#0061a5] focus:ring-[#0061a5]"
                      />
                      <div className="flex-grow">
                        <div className="mb-1 flex justify-between gap-4">
                          <h3 className="font-bold text-[#191c1e]">
                            {item.label || item.name || "Dịch vụ"}
                          </h3>
                          <span className="whitespace-nowrap font-bold text-[#0061a5]">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#3f4753]">
                          {item.description}
                        </p>
                        {(item.popular || index === 1) && (
                          <span className="mt-2 inline-block rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-500">
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

            <section className="rounded-xl bg-white p-6 shadow-[0_4px_20px_rgba(13,153,255,0.05)] md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-[#0061a5]">
                <span className="material-symbols-outlined">schedule</span>
                Ngày & Giờ
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#3f4753]">
                    Chọn ngày
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={minDate}
                    max={maxDate}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-lg border border-[#bfc7d5] p-3 outline-none transition focus:border-[#0061a5] focus:ring-2 focus:ring-[#0061a5]/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#3f4753]">
                    Chọn khung giờ
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.length === 0 ? (
                      <div className="col-span-3 rounded-lg border border-dashed border-[#bfc7d5] bg-[#f7f9fb] p-4 text-center text-xs font-semibold text-[#3f4753]">
                        Chưa có khung giờ nào.
                      </div>
                    ) : (
                      (availableSlots.length
                        ? availableSlots
                        : timeSlots.map((slot) => ({
                            slot,
                            endTime: getSlotEndTime(slot),
                            label: `${slot} - ${getSlotEndTime(slot)}`,
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
                        className={`rounded border p-2 text-xs font-semibold transition-colors ${
                          !item.available
                            ? "cursor-not-allowed border-[#e0e3e5] bg-[#f2f4f6] text-[#707884]"
                            : timeSlot === item.slot
                              ? "border-[#0061a5] bg-[#0d99ff] text-white"
                              : "border-[#bfc7d5] bg-white hover:bg-[#e0f2fe]"
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

            <section className="rounded-xl bg-white p-6 shadow-[0_4px_20px_rgba(13,153,255,0.05)] md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-[#0061a5]">
                <span className="material-symbols-outlined">payments</span>
                Thanh toán
              </h2>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label
                  className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-4 ${
                    paymentMethod === "PAYOS"
                      ? "border-[#0061a5] bg-[#d2e4ff]/20"
                      : "border-[#bfc7d5] hover:bg-[#e0f2fe]"
                  }`}
                >
                  <div className="mb-2 flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "PAYOS"}
                      onChange={() => setPaymentMethod("PAYOS")}
                      className="mt-1 text-[#0d99ff] focus:ring-[#0d99ff]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0d99ff]">
                          qr_code_2
                        </span>
                        <span className="font-bold text-[#191c1e]">
                          Trả trước qua PayOS (VietQR)
                        </span>
                      </div>
                      <span className="mt-1 block text-xs font-semibold text-[#3f4753]">
                        Hoàn bằng Điểm thưởng nếu hủy lịch
                      </span>
                    </div>
                  </div>
                </label>

                <label
                  className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-all ${
                    paymentMethod === "CASH"
                      ? "border-[#0061a5] bg-[#d2e4ff]/20"
                      : "border-[#bfc7d5] hover:bg-[#e0f2fe]"
                  }`}
                >
                  <div className="mb-2 flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "CASH"}
                      onChange={() => setPaymentMethod("CASH")}
                      className="mt-1 border-[#bfc7d5] text-[#0d99ff] focus:ring-[#0d99ff]"
                    />
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#3f4753]">
                        payments
                      </span>
                      <span className="font-bold text-[#191c1e]">
                        Tiền mặt tại quầy
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="rounded-lg border border-[#bfc7d5]/50 bg-[#f7f9fb] p-3 text-xs text-[#3f4753]">
                Số dư điểm thưởng/ví hiện tại:{" "}
                <strong>{formatPrice(walletBalance)}</strong>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-xs font-semibold text-[#3f4753]">
                  Mã Voucher
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value)}
                    placeholder="Nhập mã giảm giá..."
                    className="min-w-0 flex-grow rounded-lg border border-[#bfc7d5] p-3 outline-none transition focus:border-[#0061a5] focus:ring-2 focus:ring-[#0061a5]/20"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    className="whitespace-nowrap rounded-lg bg-[#0061a5] px-6 py-3 font-bold text-white transition-colors hover:bg-[#005bbf]"
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
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

      <footer className="mt-20 border-t border-[#bfc7d5]/50 bg-[#e0e3e5]">
        <div className="flex w-full flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row lg:px-10 xl:px-14">
          <div>
            <div className="mb-2 text-2xl font-bold text-[#191c1e]">
              autoWash
            </div>
            <p className="text-base text-[#3f4753]">
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
                className="text-base text-[#3f4753] transition-colors hover:text-[#0061a5]"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
