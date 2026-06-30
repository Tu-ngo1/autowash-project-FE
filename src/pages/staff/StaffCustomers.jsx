import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StaffNavbar from "../../components/StaffNavbar";
import {
  createWalkInBooking,
  getWalkInBookingData,
  searchWalkInCustomer,
} from "../../services/staffWalkInApi";
import { getVehicleModels } from "../../services/vehicleModelApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";

const PAYMENT_METHODS = [
  ["CASH", "Tiền mặt"],
  ["BANK_TRANSFER", "Chuyển khoản"],
];

const unwrapList = (payload, keys = []) => {
  const data = payload?.data?.data ?? payload?.data ?? payload ?? {};
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

const unwrapObject = (payload) =>
  payload?.data?.data ?? payload?.data ?? payload ?? {};

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const compactLicensePlate = (value = "") =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const formatVietnamLicensePlate = (value = "") => {
  const raw = compactLicensePlate(value);
  let province = "";
  let series = "";
  let serial = "";

  for (const char of raw) {
    if (province.length < 2) {
      if (/\d/.test(char)) province += char;
      continue;
    }
    if (series.length < 2 && serial.length === 0) {
      if (/[A-Z]/.test(char)) {
        series += char;
        continue;
      }
      if (series.length > 0 && /\d/.test(char)) {
        serial += char;
        continue;
      }
      continue;
    }
    if (serial.length < 5 && /\d/.test(char)) serial += char;
  }

  if (!province) return "";
  if (province.length < 2) return province;
  if (!series) return province;

  const plateHead = `${province}${series}`;
  if (!serial) return plateHead;

  const formattedSerial =
    serial.length > 3 ? `${serial.slice(0, 3)}.${serial.slice(3)}` : serial;
  return `${plateHead} - ${formattedSerial}`;
};

const isValidVietnamLicensePlate = (value = "") =>
  /^\d{2}[A-Z]{1,2}\s-\s\d{3}\.\d{2}$/.test(formatVietnamLicensePlate(value));

const normalizePlate = formatVietnamLicensePlate;

const normalizeVehicleModels = (payload) =>
  unwrapList(payload, ["vehicleModels", "vehicle_models", "models", "items"])
    .map((model) => ({
      id: model.id ?? model.vehicleModelId ?? model.vehicle_model_id,
      brand: model.brand || "",
      modelName: model.modelName || model.model_name || model.name || "",
      vehicleSize: String(
        model.vehicleSize || model.vehicle_size || model.size || "",
      ).toUpperCase(),
    }))
    .filter(
      (model) =>
        model.id && model.brand && model.modelName && model.vehicleSize,
    );

const getVehicleBrands = (vehicleModels) =>
  Array.from(new Set(vehicleModels.map((model) => model.brand))).sort((a, b) =>
    a.localeCompare(b),
  );

const normalizeRegisteredVehicle = (vehicle = {}, index = 0) => {
  const licensePlate = normalizePlate(
    vehicle.licensePlate ??
      vehicle.plate ??
      vehicle.vehicleLicensePlate ??
      vehicle.license_plate ??
      "",
  );
  const brand = vehicle.brand ?? vehicle.vehicleBrand ?? "";
  const modelName =
    vehicle.modelName ??
    vehicle.model_name ??
    vehicle.vehicleModelName ??
    vehicle.model ??
    "";
  const id =
    vehicle.id ??
    vehicle.carId ??
    vehicle.vehicleId ??
    vehicle.customerCarId ??
    `${licensePlate}-${index}`;

  return {
    key: String(id),
    id,
    licensePlate,
    brand,
    modelName,
    vehicleModelId:
      vehicle.vehicleModelId ??
      vehicle.vehicle_model_id ??
      vehicle.modelId ??
      "",
    vehicleSize: String(
      vehicle.vehicleSize ??
        vehicle.vehicle_size ??
        vehicle.carSize ??
        vehicle.size ??
        "",
    ).toUpperCase(),
  };
};

const getServiceId = (service) =>
  service?.serviceId ?? service?.id ?? service?.servicePriceId;

const getServiceName = (service) =>
  service?.serviceName ?? service?.name ?? service?.title ?? "Dịch vụ";

const getServicePrice = (service) =>
  Number(service?.price ?? service?.servicePrice ?? service?.basePrice ?? 0);

const getServiceDuration = (service) =>
  Number(service?.durationMinutes ?? service?.duration ?? 0);

const isMainService = (service) =>
  Boolean(
    service?.isMainService ??
    service?.mainService ??
    service?.isMain ??
    String(service?.type || "").toUpperCase() === "MAIN",
  );

const getSlotStart = (slot) =>
  slot?.startTime ??
  slot?.scheduledStartTime ??
  slot?.start ??
  slot?.time ??
  slot?.from ??
  "";

const getSlotEnd = (slot) =>
  slot?.endTime ?? slot?.scheduledEndTime ?? slot?.end ?? slot?.to ?? "";

const getSlotLabel = (slot) => {
  const start = getSlotStart(slot);
  const end = getSlotEnd(slot);
  const startText = String(start).includes("T")
    ? String(start).split("T")[1]?.slice(0, 5)
    : String(start).slice(0, 5);
  const endText = String(end).includes("T")
    ? String(end).split("T")[1]?.slice(0, 5)
    : String(end).slice(0, 5);
  return endText ? `${startText} - ${endText}` : startText || "Slot";
};

const isSlotAvailable = (slot) => {
  const status = String(slot?.status || "").toUpperCase();
  if (status) return ["AVAILABLE", "OPEN", "FREE"].includes(status);
  return Boolean(slot?.available ?? slot?.isAvailable ?? true);
};

const toScheduledDateTime = (slot) => {
  const start = getSlotStart(slot);
  if (!start) return "";
  if (String(start).includes("T")) return String(start).slice(0, 19);
  return `${new Date().toISOString().slice(0, 10)}T${String(start).slice(0, 5)}:00`;
};

const normalizeCustomer = (payload = {}) => {
  const data = unwrapObject(payload);
  const customer = data.customer ?? data.user ?? data;
  const vehicles =
    data.registeredVehicles ??
    customer.registeredVehicles ??
    data.vehicles ??
    customer.vehicles ??
    customer.cars ??
    [];
  const registeredVehicles = Array.isArray(vehicles)
    ? vehicles
        .map(normalizeRegisteredVehicle)
        .filter((vehicle) => vehicle.licensePlate)
    : [];
  const firstVehicle = registeredVehicles[0] ?? null;
  return {
    name: customer.fullName ?? customer.name ?? customer.customerName ?? "",
    phone: customer.phone ?? customer.customerPhone ?? "",
    tier:
      customer.tier ?? customer.tierLevel ?? customer.membership ?? "Member",
    vehicleModelId:
      customer.vehicleModelId ??
      customer.vehicle_model_id ??
      firstVehicle?.vehicleModelId ??
      firstVehicle?.vehicle_model_id ??
      firstVehicle?.modelId ??
      "",
    brand: customer.brand ?? firstVehicle?.brand ?? "",
    modelName:
      customer.modelName ??
      customer.model_name ??
      firstVehicle?.modelName ??
      firstVehicle?.model_name ??
      firstVehicle?.model ??
      "",
    licensePlate:
      customer.licensePlate ??
      customer.plate ??
      firstVehicle?.licensePlate ??
      "",
    vehicleSize:
      customer.vehicleSize ??
      customer.carSize ??
      firstVehicle?.vehicleSize ??
      "SMALL",
    registeredVehicles,
  };
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#8df9ef]">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function StaffCustomers() {
  const navigate = useNavigate();
  const [lookup, setLookup] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    licensePlate: "",
    vehicleBrand: "",
    vehicleModelId: "",
    vehicleModelName: "",
    vehicleSize: "SMALL",
    paymentMethod: "CASH",
    customerNote: "Khách vãng lai đặt tại quầy",
    tier: "Member",
  });
  const [vehicleModels, setVehicleModels] = useState([]);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [mainServiceId, setMainServiceId] = useState("");
  const [addonIds, setAddonIds] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [selectedVehicleKey, setSelectedVehicleKey] = useState("new");
  const [vehicleLocked, setVehicleLocked] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const vehicleBrands = useMemo(
    () => getVehicleBrands(vehicleModels),
    [vehicleModels],
  );
  const currentBrandModels = useMemo(
    () => vehicleModels.filter((model) => model.brand === form.vehicleBrand),
    [vehicleModels, form.vehicleBrand],
  );

  const mainServices = useMemo(
    () => services.filter((service) => isMainService(service)),
    [services],
  );
  const addonServices = useMemo(
    () => services.filter((service) => !isMainService(service)),
    [services],
  );
  const selectedServices = useMemo(() => {
    const ids = new Set(
      [mainServiceId, ...addonIds].filter(Boolean).map(String),
    );
    return services.filter((service) => ids.has(String(getServiceId(service))));
  }, [services, mainServiceId, addonIds]);
  const subtotal = selectedServices.reduce(
    (sum, service) => sum + getServicePrice(service),
    0,
  );
  const tierDiscountRate =
    {
      MEMBER: 0,
      SILVER: 5,
      GOLD: 10,
      PLATINUM: 15,
    }[String(form.tier || "MEMBER").toUpperCase()] ?? 0;
  const discountAmount = Math.round((subtotal * tierDiscountRate) / 100);
  const total = Math.max(subtotal - discountAmount, 0);

  const findVehicleModelForVehicle = (vehicle) =>
    vehicleModels.find(
      (model) => String(model.id) === String(vehicle?.vehicleModelId),
    ) ||
    vehicleModels.find(
      (model) =>
        model.brand === vehicle?.brand &&
        model.modelName.toLowerCase() ===
          String(vehicle?.modelName || "").toLowerCase(),
    );

  const applyRegisteredVehicle = (vehicle) => {
    const matchedModel = findVehicleModelForVehicle(vehicle);
    setForm((prev) => ({
      ...prev,
      licensePlate: normalizePlate(vehicle?.licensePlate || ""),
      vehicleBrand: matchedModel?.brand || vehicle?.brand || "",
      vehicleModelId: matchedModel?.id || vehicle?.vehicleModelId || "",
      vehicleModelName: matchedModel?.modelName || vehicle?.modelName || "",
      vehicleSize: matchedModel?.vehicleSize || vehicle?.vehicleSize || "",
    }));
    setVehicleLocked(Boolean(matchedModel || vehicle?.vehicleModelId));
  };

  const resetVehicleForm = () => {
    setForm((prev) => ({
      ...prev,
      licensePlate: "",
      vehicleBrand: "",
      vehicleModelId: "",
      vehicleModelName: "",
      vehicleSize: "",
    }));
    setVehicleLocked(false);
  };

  useEffect(() => {
    let mounted = true;
    const loadVehicleModels = async () => {
      try {
        const payload = await getVehicleModels();
        if (mounted) {
          setVehicleModels(normalizeVehicleModels(payload));
        }
      } catch {
        if (mounted) setVehicleModels([]);
      }
    };
    loadVehicleModels();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!form.vehicleSize) {
        setServices([]);
        setSlots([]);
        setMainServiceId("");
        setAddonIds([]);
        setSelectedSlot(null);
        return;
      }
      setLoadingData(true);
      setError("");
      try {
        const payload = await getWalkInBookingData(form.vehicleSize);
        const data = unwrapObject(payload);
        const nextServices = unwrapList(data, [
          "services",
          "washServices",
          "availableServices",
          "servicePrices",
        ]);
        const nextSlots = unwrapList(data, [
          "slots",
          "availableSlots",
          "timeSlots",
          "availableTimeSlots",
        ]);
        setServices(nextServices);
        setSlots(nextSlots);

        const firstMain = nextServices.find((service) =>
          isMainService(service),
        );
        setMainServiceId((prev) =>
          nextServices.some(
            (service) => String(getServiceId(service)) === String(prev),
          )
            ? prev
            : String(getServiceId(firstMain) || ""),
        );
        setAddonIds((prev) =>
          prev.filter((id) =>
            nextServices.some(
              (service) => String(getServiceId(service)) === String(id),
            ),
          ),
        );

        const firstAvailableSlot = nextSlots.find(isSlotAvailable);
        setSelectedSlot((prev) =>
          prev &&
          nextSlots.some(
            (slot) => toScheduledDateTime(slot) === toScheduledDateTime(prev),
          )
            ? prev
            : firstAvailableSlot || null,
        );
      } catch (err) {
        setServices([]);
        setSlots([]);
        setError(
          getFriendlyErrorMessage(
            err,
            "Không thể tải dịch vụ và khung giờ hôm nay.",
          ),
        );
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [form.vehicleSize]);

  const handleVehicleBrandChange = (brand) => {
    setSelectedVehicleKey("new");
    setVehicleLocked(false);
    setForm((prev) => ({
      ...prev,
      vehicleBrand: brand,
      vehicleModelId: "",
      vehicleModelName: "",
      vehicleSize: "",
    }));
  };

  const handleVehicleModelChange = (modelId) => {
    setSelectedVehicleKey("new");
    setVehicleLocked(false);
    const selectedModel = vehicleModels.find(
      (model) => String(model.id) === String(modelId),
    );
    setForm((prev) => ({
      ...prev,
      vehicleModelId: modelId,
      vehicleBrand: selectedModel?.brand || prev.vehicleBrand,
      vehicleModelName: selectedModel?.modelName || "",
      vehicleSize: selectedModel?.vehicleSize || "",
    }));
  };

  const handleRegisteredVehicleChange = (value) => {
    setSelectedVehicleKey(value);
    if (value === "new") {
      resetVehicleForm();
      return;
    }

    const selectedVehicle = registeredVehicles.find(
      (vehicle) => vehicle.key === value,
    );
    if (selectedVehicle) {
      applyRegisteredVehicle(selectedVehicle);
    }
  };

  const handleLookup = async () => {
    if (!lookup.trim()) {
      setError("Nhập số điện thoại hoặc biển số để tìm kiếm.");
      return;
    }
    setLookupLoading(true);
    setError("");
    setMessage("");
    try {
      const result = normalizeCustomer(
        await searchWalkInCustomer(lookup.trim()),
      );
      const vehicles = result.registeredVehicles || [];
      const lookupPlate = normalizePlate(lookup);
      const selectedVehicle =
        vehicles.find((vehicle) => vehicle.licensePlate === lookupPlate) ||
        vehicles[0] ||
        null;
      const matchedModel = selectedVehicle
        ? findVehicleModelForVehicle(selectedVehicle)
        : findVehicleModelForVehicle(result);

      setRegisteredVehicles(vehicles);
      setSelectedVehicleKey(selectedVehicle?.key || "new");
      setVehicleLocked(
        Boolean(selectedVehicle && (matchedModel || selectedVehicle.vehicleModelId)),
      );
      setForm((prev) => ({
        ...prev,
        customerName: result.name || prev.customerName,
        customerPhone: result.phone || prev.customerPhone,
        licensePlate: normalizePlate(
          selectedVehicle?.licensePlate || result.licensePlate || "",
        ),
        vehicleBrand:
          matchedModel?.brand ||
          selectedVehicle?.brand ||
          result.brand ||
          "",
        vehicleModelId:
          matchedModel?.id ||
          selectedVehicle?.vehicleModelId ||
          result.vehicleModelId ||
          "",
        vehicleModelName:
          matchedModel?.modelName ||
          selectedVehicle?.modelName ||
          result.modelName ||
          "",
        vehicleSize:
          matchedModel?.vehicleSize ||
          selectedVehicle?.vehicleSize ||
          result.vehicleSize ||
          "",
        tier: result.tier || prev.tier,
      }));
      setMessage(
        vehicles.length > 0
          ? "Đã tìm thấy khách hàng. Chọn phương tiện để tiếp nhận."
          : "Đã tìm thấy khách hàng. Khách chưa có xe đã đăng ký.",
      );
    } catch (err) {
      setRegisteredVehicles([]);
      setSelectedVehicleKey("new");
      setVehicleLocked(false);
      setMessage("Không tìm thấy khách cũ. Có thể nhập nhanh khách vãng lai.");
      setError("");
    } finally {
      setLookupLoading(false);
    }
  };

  const toggleAddon = (serviceId) => {
    setAddonIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.customerName.trim()) {
      setError("Vui lòng nhập họ tên khách hàng.");
      return;
    }
    if (!form.licensePlate.trim()) {
      setError("Vui lòng nhập biển số xe.");
      return;
    }
    const normalizedPlate = normalizePlate(form.licensePlate);
    if (!isValidVietnamLicensePlate(normalizedPlate)) {
      setError("Biển số xe phải đúng dạng 59A - 123.45.");
      return;
    }
    if (!form.vehicleModelId || !form.vehicleSize) {
      setError("Vui lòng chọn hãng xe và mẫu xe để xác định kích thước xe.");
      return;
    }
    if (!mainServiceId) {
      setError("Vui lòng chọn một dịch vụ chính.");
      return;
    }
    if (!selectedSlot) {
      setError("Vui lòng chọn một khung giờ còn trống.");
      return;
    }

    setSubmitting(true);
    try {
      await createWalkInBooking({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        licensePlate: normalizedPlate,
        vehicleModelId: Number(form.vehicleModelId) || form.vehicleModelId,
        brand: form.vehicleBrand,
        modelName: form.vehicleModelName,
        vehicleSize: form.vehicleSize,
        scheduledStartTime: toScheduledDateTime(selectedSlot),
        serviceIds: [mainServiceId, ...addonIds].map(Number).filter(Boolean),
        paymentMethod: form.paymentMethod,
        customerNote: form.customerNote,
      });
      setMessage(
        "Đã tạo lịch và tiếp nhận khách. Đang chuyển sang hàng đợi...",
      );
      setTimeout(() => navigate("/staff/queue"), 700);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(
          err,
          "Không thể tạo lịch tiếp nhận. Vui lòng kiểm tra lại dữ liệu.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-motion-root min-h-screen text-white lg:pl-64">
      <StaffNavbar />
      <div className="staff-shell flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1680px] p-4 pb-24 sm:p-6 lg:p-8">
          <header className="staff-reveal mb-7 border-b border-cyan-100/15 pb-5">
            <p
              className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#6ff6df]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              WALK-IN COUNTER
            </p>
            <h1
              className="mt-2 text-[28px] font-bold tracking-wide text-[#ecfeff] sm:text-[34px]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              QUẦY TIẾP NHẬN & ĐẶT LỊCH NHANH
            </h1>
          </header>

          {(error || message) && (
            <div
              className={`staff-reveal mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                error
                  ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
                  : "border-[#6ff6df]/25 bg-[#6ff6df]/10 text-[#9fffee]"
              }`}
            >
              {error || message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-6 xl:grid-cols-[40fr_60fr]"
          >
            <section className="staff-panel staff-reveal rounded-3xl p-5 sm:p-6">
              <div className="mb-6">
                <h2
                  className="text-[17px] font-bold uppercase tracking-[0.16em] text-[#ecfeff]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Thông tin khách & dịch vụ
                </h2>
              </div>

              <div className="mb-6 rounded-2xl border border-cyan-100/15 bg-[#061923]/70 p-4">
                <Field label="Quick lookup">
                  <div className="flex gap-2">
                    <input
                      value={lookup}
                      onChange={(event) => setLookup(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleLookup();
                        }
                      }}
                      placeholder="Số điện thoại hoặc biển số xe"
                      className="min-w-0 flex-1 rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#6ff6df]"
                    />
                    <button
                      type="button"
                      onClick={handleLookup}
                      disabled={lookupLoading}
                      className="rounded-xl border border-[#6ff6df] px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#6ff6df] transition hover:bg-[#6ff6df]/10 disabled:opacity-50"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {lookupLoading ? "..." : "Tìm"}
                    </button>
                  </div>
                </Field>
              </div>

              {registeredVehicles.length > 0 && (
                <div className="mb-6 rounded-2xl border border-[#6ff6df]/25 bg-[#6ff6df]/10 p-4">
                  <Field label="Chọn phương tiện của khách">
                    <select
                      value={selectedVehicleKey}
                      onChange={(event) =>
                        handleRegisteredVehicleChange(event.target.value)
                      }
                      className="w-full rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#6ff6df]"
                    >
                      {registeredVehicles.map((vehicle) => (
                        <option key={vehicle.key} value={vehicle.key}>
                          {vehicle.licensePlate}
                          {vehicle.brand || vehicle.modelName
                            ? ` (${[vehicle.brand, vehicle.modelName]
                                .filter(Boolean)
                                .join(" ")})`
                            : ""}
                        </option>
                      ))}
                      <option value="new">
                        [ Sử dụng xe mới / Xe khác ]
                      </option>
                    </select>
                  </Field>
                  {vehicleLocked && (
                    <p className="mt-3 text-xs font-semibold text-[#b8d8de]">
                      Xe đã đăng ký sẽ tự khóa hãng, mẫu và kích thước để khớp
                      dữ liệu backend.
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Họ tên khách hàng">
                  <input
                    required
                    value={form.customerName}
                    onChange={(event) =>
                      setForm({ ...form, customerName: event.target.value })
                    }
                    className="w-full rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#6ff6df]"
                    placeholder="Nguyễn Văn A"
                  />
                </Field>
                <Field label="Số điện thoại">
                  <input
                    value={form.customerPhone}
                    onChange={(event) =>
                      setForm({ ...form, customerPhone: event.target.value })
                    }
                    className="w-full rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#6ff6df]"
                    placeholder="0987654321"
                  />
                </Field>
                <Field label="Biển số xe">
                  <input
                    required
                    readOnly={vehicleLocked}
                    value={form.licensePlate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        licensePlate: normalizePlate(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white outline-none focus:border-[#6ff6df] read-only:cursor-not-allowed read-only:opacity-70"
                    placeholder="59A - 123.45"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </Field>
                <Field label="Hãng xe">
                  <select
                    required
                    disabled={vehicleLocked}
                    value={form.vehicleBrand}
                    onChange={(event) =>
                      handleVehicleBrandChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#6ff6df] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <option value="">Chọn hãng xe</option>
                    {vehicleBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Mẫu xe">
                  <select
                    required
                    value={form.vehicleModelId}
                    onChange={(event) =>
                      handleVehicleModelChange(event.target.value)
                    }
                    disabled={
                      vehicleLocked ||
                      !form.vehicleBrand ||
                      currentBrandModels.length === 0
                    }
                    className="w-full rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#6ff6df] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <option value="">
                      {form.vehicleBrand ? "Chọn mẫu xe" : "Chọn mẫu xe"}
                    </option>
                    {currentBrandModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.modelName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kích thước xe">
                  <input
                    readOnly
                    value={form.vehicleSize}
                    className="w-full cursor-not-allowed rounded-xl border border-cyan-100/15 bg-[#071620] px-4 py-3 text-sm font-bold uppercase text-[#6ff6df] outline-none"
                    placeholder="Tự fill theo mẫu xe"
                  />
                </Field>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Hạng thành viên">
                  <input
                    value={form.tier}
                    onChange={(event) =>
                      setForm({ ...form, tier: event.target.value })
                    }
                    className="w-full rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-bold uppercase text-[#6ff6df] outline-none focus:border-[#6ff6df]"
                  />
                </Field>
                <Field label="Thanh toán">
                  <select
                    value={form.paymentMethod}
                    onChange={(event) =>
                      setForm({ ...form, paymentMethod: event.target.value })
                    }
                    className="w-full rounded-xl border border-cyan-100/15 bg-[#0b2532] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#6ff6df]"
                  >
                    {PAYMENT_METHODS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-8 space-y-5">
                <div>
                  <h3
                    className="mb-3 text-[13px] font-bold uppercase tracking-[0.18em] text-[#8df9ef]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Gói rửa chính
                  </h3>
                  <div className="grid gap-3">
                    {loadingData ? (
                      <p className="rounded-2xl border border-cyan-100/15 p-4 text-sm text-[#b8d8de]">
                        Đang tải dịch vụ...
                      </p>
                    ) : mainServices.length === 0 ? (
                      <p className="rounded-2xl border border-cyan-100/15 p-4 text-sm text-[#b8d8de]">
                        Chưa có dịch vụ chính cho size xe này.
                      </p>
                    ) : (
                      mainServices.map((service) => {
                        const id = String(getServiceId(service));
                        const selected = id === String(mainServiceId);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setMainServiceId(id)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-[#6ff6df] bg-[#6ff6df]/12 shadow-[0_0_24px_rgba(111,246,223,0.12)]"
                                : "border-cyan-100/15 bg-[#061923]/60 hover:border-[#6ff6df]/60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-[#ecfeff]">
                                  {getServiceName(service)}
                                </p>
                                <p className="mt-1 text-xs text-[#b8d8de]">
                                  {getServiceDuration(service)} phút
                                </p>
                              </div>
                              <p
                                className="font-bold text-[#6ff6df]"
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                {formatPrice(getServicePrice(service))}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <h3
                    className="mb-3 text-[13px] font-bold uppercase tracking-[0.18em] text-[#8df9ef]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Dịch vụ đi kèm
                  </h3>
                  <div className="grid gap-3">
                    {addonServices.length === 0 ? (
                      <p className="rounded-2xl border border-cyan-100/15 p-4 text-sm text-[#b8d8de]">
                        Không có dịch vụ phụ cho size xe này.
                      </p>
                    ) : (
                      addonServices.map((service) => {
                        const id = String(getServiceId(service));
                        const selected = addonIds.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleAddon(id)}
                            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-[#4edea3] bg-[#4edea3]/12"
                                : "border-cyan-100/15 bg-[#061923]/60 hover:border-[#4edea3]/60"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`h-5 w-5 rounded border ${
                                  selected
                                    ? "border-[#4edea3] bg-[#4edea3]"
                                    : "border-cyan-100/30"
                                }`}
                              />
                              <div>
                                <p className="font-bold text-[#ecfeff]">
                                  {getServiceName(service)}
                                </p>
                                <p className="text-xs text-[#b8d8de]">
                                  {getServiceDuration(service)} phút
                                </p>
                              </div>
                            </div>
                            <p className="font-bold text-[#6ff6df]">
                              {formatPrice(getServicePrice(service))}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section
              className="staff-panel staff-reveal rounded-3xl p-5 sm:p-6"
              style={{ animationDelay: "100ms" }}
            >
              <div className="mb-6 flex flex-col gap-2 border-b border-cyan-100/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    className="text-[17px] font-bold uppercase tracking-[0.16em] text-[#ecfeff]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Khung giờ hôm nay
                  </h2>
                  <p className="mt-1 text-sm text-[#b8d8de]">
                    Mặc định chọn slot trống gần nhất.
                  </p>
                </div>
                <span
                  className="rounded-full border border-[#6ff6df]/35 bg-[#6ff6df]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#6ff6df]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {form.vehicleSize}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {loadingData ? (
                  <p className="col-span-full rounded-2xl border border-cyan-100/15 p-5 text-sm text-[#b8d8de]">
                    Đang tải khung giờ...
                  </p>
                ) : slots.length === 0 ? (
                  <p className="col-span-full rounded-2xl border border-cyan-100/15 p-5 text-sm text-[#b8d8de]">
                    Backend chưa trả khung giờ trống hôm nay.
                  </p>
                ) : (
                  slots.map((slot, index) => {
                    const available = isSlotAvailable(slot);
                    const selected =
                      selectedSlot &&
                      toScheduledDateTime(selectedSlot) ===
                        toScheduledDateTime(slot);
                    return (
                      <button
                        key={`${getSlotLabel(slot)}-${index}`}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-[#6ff6df] bg-[#6ff6df]/15 shadow-[0_0_28px_rgba(111,246,223,0.16)]"
                            : available
                              ? "border-[#4edea3]/40 bg-[#4edea3]/10 hover:border-[#6ff6df]"
                              : "cursor-not-allowed border-cyan-100/10 bg-white/[0.035] opacity-45"
                        }`}
                      >
                        <p
                          className="text-[15px] font-bold text-[#ecfeff]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {getSlotLabel(slot)}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#b8d8de]">
                          {available ? "Còn trống" : "Đã bận"}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-7 rounded-3xl border border-cyan-100/15 bg-[#061923]/70 p-5">
                <h3
                  className="mb-4 text-[15px] font-bold uppercase tracking-[0.16em] text-[#8df9ef]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Tóm tắt hóa đơn
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#b8d8de]">Xe/Biển số</span>
                    <span className="font-bold text-[#ecfeff]">
                      {normalizePlate(form.licensePlate) || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#b8d8de]">Hạng</span>
                    <span className="font-bold text-[#6ff6df]">
                      {form.tier}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#b8d8de]">Khung giờ</span>
                    <span className="font-bold text-[#ecfeff]">
                      {selectedSlot ? getSlotLabel(selectedSlot) : "-"}
                    </span>
                  </div>
                  <div className="border-t border-cyan-100/10 pt-3">
                    <p className="mb-2 text-[#b8d8de]">Dịch vụ</p>
                    <div className="space-y-2">
                      {selectedServices.length === 0 ? (
                        <p className="text-[#b8d8de]">Chưa chọn dịch vụ</p>
                      ) : (
                        selectedServices.map((service) => (
                          <div
                            key={getServiceId(service)}
                            className="flex justify-between gap-4"
                          >
                            <span className="text-[#ecfeff]">
                              {getServiceName(service)}
                            </span>
                            <span className="font-bold text-[#6ff6df]">
                              {formatPrice(getServicePrice(service))}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="border-t border-cyan-100/10 pt-3">
                    <div className="flex justify-between gap-4">
                      <span className="text-[#b8d8de]">Tiền gốc</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4">
                      <span className="text-[#b8d8de]">
                        Giảm hạng ({tierDiscountRate}%)
                      </span>
                      <span className="text-[#4edea3]">
                        -{formatPrice(discountAmount)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <span className="text-[#b8d8de]">Tổng thanh toán</span>
                      <span
                        className="text-3xl font-bold text-[#6ff6df]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loadingData}
                className="mt-5 w-full rounded-2xl bg-[#6ff6df] px-5 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#06343a] shadow-[0_0_34px_rgba(111,246,223,0.22)] transition hover:bg-[#9fffee] hover:shadow-[0_0_44px_rgba(111,246,223,0.35)] active:scale-[0.99] disabled:bg-slate-500 disabled:text-slate-300"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {submitting
                  ? "Đang tạo lịch..."
                  : "Tạo lịch đặt & tiếp nhận ngay"}
              </button>
            </section>
          </form>
        </main>
      </div>
    </div>
  );
}
