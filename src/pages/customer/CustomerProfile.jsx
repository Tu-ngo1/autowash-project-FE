import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import { getUser, updateUser } from "../../utils/auth";
import {
  getCustomerProfile,
  getCustomerProfileBookings,
  getCustomerProfileLoyalty,
} from "../../services/customerProfileApi";
import { cancelBooking, getBookingQr } from "../../services/customerBookingApi";
import {
  addMyCar,
  getMyCars,
  normalizeCustomerCar,
  updateMyCar,
} from "../../services/customerCarApi";
import { getVehicleModels } from "../../services/vehicleModelApi";
import {
  depositWallet,
  getWalletTransactions,
} from "../../services/customerWalletApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";

const statusStyles = {
  PENDING: "bg-[#0061a5]/10 text-[#0061a5]",
  CONFIRM: "bg-[#0061a5]/10 text-[#0061a5]",
  ARRIVED: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-cyan-100 text-cyan-700",
  WASHED: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-emerald-500/10 text-emerald-600",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const formatCurrency = (value) =>
  value ? `${value.toLocaleString("vi-VN")}đ` : "-";

const getBookingTotal = (booking = {}) =>
  booking.finalPrice ??
  booking.final_price ??
  booking.totalPrice ??
  booking.total_price ??
  booking.Total_price ??
  booking.price ??
  booking.total ??
  0;

const getBookingTimeValue = (booking) => {
  const raw =
    booking?.createdAt ||
    booking?.updatedAt ||
    booking?.scheduledStartTime ||
    booking?.dateTime ||
    booking?.date ||
    "";
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getNewestValue = (item = {}) => {
  const raw =
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at ||
    item.redeemedAt ||
    item.usedAt ||
    item.createdDate ||
    "";
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? Number(item.id || item.transactionId || 0) : time;
};

const sortNewestFirst = (items = []) =>
  [...items].sort((a, b) => {
    const newestDiff = getNewestValue(b) - getNewestValue(a);
    if (newestDiff !== 0) return newestDiff;
    return (
      Number(b?.id || b?.transactionId || 0) -
      Number(a?.id || a?.transactionId || 0)
    );
  });

const getRecentBookings = (bookings = []) =>
  [...bookings]
    .filter(Boolean)
    .sort((a, b) => {
      const timeDiff = getBookingTimeValue(b) - getBookingTimeValue(a);
      if (timeDiff !== 0) return timeDiff;
      return Number(b?.id || 0) - Number(a?.id || 0);
    })
    .slice(0, 3);

const getPendingQrBookings = (bookings = []) =>
  [...bookings]
    .filter((booking) => {
      const status = String(booking?.status || "").toUpperCase();
      return status === "PENDING" || status === "CONFIRM";
    })
    .sort((a, b) => {
      const timeDiff = getBookingTimeValue(b) - getBookingTimeValue(a);
      if (timeDiff !== 0) return timeDiff;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });

const getBookingQrValue = (booking) => {
  if (booking.qrContent || booking.qrCode || booking.bookingCode) {
    return encodeURIComponent(
      booking.qrContent || booking.qrCode || booking.bookingCode,
    );
  }
  const payload = {
    id: booking.id || "",
    plate: booking.plate || "",
    service: booking.service || booking.serviceName || "",
    date: booking.date || "",
    time: booking.time || "",
    status: booking.status || "PENDING",
  };
  return encodeURIComponent(JSON.stringify(payload));
};

const mergeVehicles = (...groups) => {
  const seen = new Set();
  return sortNewestFirst(
    groups
      .flat()
      .filter(Boolean)
      .map(normalizeCustomerCar)
      .filter((vehicle) => {
        const key = String(
          vehicle.licensePlate || vehicle.plate || vehicle.id || "",
        ).toUpperCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
  );
};

const unwrapPayload = (payload) =>
  payload?.data?.data ?? payload?.data ?? payload ?? {};

const VEHICLE_SIZE_OPTIONS = [
  {
    value: "SMALL",
    label: "SMALL",
    description: "4-5 chỗ",
    icon: "directions_car",
  },
  {
    value: "MEDIUM",
    label: "MEDIUM",
    description: "CUV/SUV 5 chỗ",
    icon: "commute",
  },
  {
    value: "LARGE",
    label: "LARGE",
    description: "7 chỗ",
    icon: "airport_shuttle",
  },
  {
    value: "XLARGE",
    label: "XLARGE",
    description: "Bán tải, Van",
    icon: "local_shipping",
  },
];

const getVehicleSizeOption = (value) =>
  VEHICLE_SIZE_OPTIONS.find((option) => option.value === value) ||
  VEHICLE_SIZE_OPTIONS[0];

const getVehicleBrands = (vehicleModels) =>
  Array.from(new Set(vehicleModels.map((model) => model.brand))).sort((a, b) =>
    a.localeCompare(b),
  );

const getVehicleModelById = (vehicleModels, id) =>
  vehicleModels.find((model) => String(model.id) === String(id));

const getVehicleModelByName = (vehicleModels, brand, modelName) =>
  vehicleModels.find(
    (model) =>
      model.brand === brand &&
      String(model.modelName || "").toLowerCase() ===
        String(modelName || "").toLowerCase(),
  );

const normalizeVehicleSize = (vehicle) => {
  const rawSize = String(
    vehicle?.size ||
      vehicle?.vehicleSize ||
      vehicle?.vehicle_size ||
      vehicle?.type ||
      "",
  ).toUpperCase();
  if (["SMALL", "MEDIUM", "LARGE", "XLARGE"].includes(rawSize)) return rawSize;
  if (String(vehicle?.type || "").includes("7")) return "LARGE";
  if (
    String(vehicle?.type || "")
      .toLowerCase()
      .includes("suv")
  )
    return "MEDIUM";
  return "SMALL";
};

const isActiveVehicleModel = (model) =>
  model?.isActive ?? model?.is_active ?? model?.active ?? true;

const compactLicensePlate = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const formatVietnamLicensePlate = (value = "") => {
  const raw = compactLicensePlate(value);
  const province = raw.slice(0, 2);
  const rest = raw.slice(2);
  const seriesMatch = rest.match(/^[A-Z]{0,2}/);
  const series = seriesMatch?.[0] || "";
  const serial = rest.slice(series.length, series.length + 5);

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
  /^\d{2}[A-Z]{1,2}\d{4,5}$/.test(compactLicensePlate(value));

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getUser() || {};

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "wallet" ? "wallet" : "profile",
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [depositSuccess, setDepositSuccess] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [profileReturnTo, setProfileReturnTo] = useState("");
  const [vehicleReturnTo, setVehicleReturnTo] = useState("");
  const [selectedQrBooking, setSelectedQrBooking] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [qrCodeError, setQrCodeError] = useState("");
  const [vehicleError, setVehicleError] = useState("");
  const [vehicleModels, setVehicleModels] = useState([]);
  const [vehicleModelsLoading, setVehicleModelsLoading] = useState(false);
  const [vehicleModelsError, setVehicleModelsError] = useState("");
  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    brand: "",
    modelId: "",
    modelName: "",
    size: "",
  });
  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    branch: user.branch || "",
    city: user.city || "",
    membership: "",
    points: 0,
    rankPoints: 0,
    nextTierTarget: 0,
    progress: 0,
    washes: 0,
    vehicles: [],
    walletBalance: user.walletBalance || 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingQrBookings, setPendingQrBookings] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [cancelBookingItem, setCancelBookingItem] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (selectedQrBooking && selectedQrBooking.id) {
      setQrCodeLoading(true);
      setQrCodeError("");
      setQrCodeData(null);
      getBookingQr(selectedQrBooking.id)
        .then((res) => {
          if (!isMounted) return;
          setQrCodeData(res.data);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Failed to fetch QR code:", err);
          setQrCodeError(getFriendlyErrorMessage(err) || "Không thể tải mã QR");
        })
        .finally(() => {
          if (!isMounted) return;
          setQrCodeLoading(false);
        });
    } else {
      setQrCodeData(null);
      setQrCodeError("");
    }
    return () => {
      isMounted = false;
    };
  }, [selectedQrBooking]);

  const vehicleBrands = getVehicleBrands(vehicleModels);
  const currentBrandModels = vehicleModels.filter(
    (model) => model.brand === vehicleForm.brand,
  );

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const [profileRes, bookingsRes, loyaltyRes, carsRes] =
          await Promise.all([
            getCustomerProfile().catch(() => null),
            getCustomerProfileBookings().catch(() => null),
            getCustomerProfileLoyalty().catch(() => null),
            getMyCars().catch(() => []),
          ]);

        if (!isMounted) return;

        const rawProfile = profileRes?.data?.data ?? profileRes?.data ?? {};
        const apiProfile = rawProfile;
        const rawLoyalty = unwrapPayload(loyaltyRes);
        const loyalty = rawLoyalty;
        const bookings = Array.isArray(bookingsRes?.data)
          ? bookingsRes.data
          : bookingsRes?.data?.bookings || bookingsRes?.data?.data || [];

        setProfile((prev) => ({
          ...prev,
          ...apiProfile,
          name: apiProfile.name ?? apiProfile.fullName ?? prev.name,
          email: apiProfile.email ?? prev.email,
          phone: apiProfile.phone ?? prev.phone,
          branch: apiProfile.branch ?? prev.branch,
          city: apiProfile.city ?? prev.city,
          membership: loyalty.tier ?? apiProfile.tier ?? prev.membership,
          points:
            loyalty.redeemablePoints ??
            apiProfile.rewardPoints ??
            apiProfile.points ??
            prev.points,
          rankPoints:
            loyalty.points ??
            apiProfile.tierPoints ??
            apiProfile.rankPoints ??
            prev.rankPoints,
          nextTierTarget:
            loyalty.nextTierTarget ??
            apiProfile.nextTierTarget ??
            prev.nextTierTarget,
          progress: loyalty.progress ?? apiProfile.progress ?? prev.progress,
          washes:
            apiProfile.washes ??
            bookings.filter(
              (b) => String(b?.status || "").toUpperCase() === "COMPLETED",
            ).length,
          vehicles: mergeVehicles(
            Array.isArray(carsRes) ? carsRes : [],
            Array.isArray(apiProfile.vehicles) ? apiProfile.vehicles : [],
          ),
          walletBalance:
            apiProfile.walletBalance ??
            apiProfile.balance ??
            rawProfile.walletBalance ??
            rawProfile.balance ??
            0,
        }));

        updateUser({
          walletBalance:
            apiProfile.walletBalance ??
            apiProfile.balance ??
            rawProfile.walletBalance ??
            rawProfile.balance ??
            0,
        });

        setRecentBookings(getRecentBookings(bookings));
        setPendingQrBookings(getPendingQrBookings(bookings));
        setVouchers(
          sortNewestFirst(
            Array.isArray(loyalty.vouchers) ? loyalty.vouchers : [],
          ),
        );
      } catch {
        if (isMounted) {
          setRecentBookings([]);
          setPendingQrBookings([]);
          setVouchers([]);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadVehicleModels = async () => {
      setVehicleModelsLoading(true);
      setVehicleModelsError("");
      try {
        const payload = await getVehicleModels();
        const rawList = Array.isArray(payload)
          ? payload
          : payload?.vehicleModels ||
            payload?.vehicle_models ||
            payload?.models ||
            payload?.items ||
            [];
        const list = rawList;
        const activeModels = list
          .filter(isActiveVehicleModel)
          .map((model) => ({
            id: model.id,
            brand: model.brand,
            modelName: model.modelName || model.model_name || model.name,
            vehicleSize: String(
              model.vehicleSize || model.vehicle_size || "",
            ).toUpperCase(),
            model_name: model.model_name || model.modelName || model.name,
            vehicle_size: String(
              model.vehicle_size || model.vehicleSize || "",
            ).toUpperCase(),
          }))
          .filter(
            (model) =>
              model.id && model.brand && model.modelName && model.vehicleSize,
          );

        if (!isMounted) return;
        setVehicleModels(activeModels);
      } catch {
        if (isMounted) {
          setVehicleModels([]);
          setVehicleModelsError("Chưa tải được danh sách hãng và mẫu xe.");
        }
      } finally {
        if (isMounted) setVehicleModelsLoading(false);
      }
    };

    loadVehicleModels();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const returnTo = searchParams.get("returnTo") || "";
    const safeReturnTo = returnTo.startsWith("/") ? returnTo : "";
    if (safeReturnTo) {
      setProfileReturnTo(safeReturnTo);
    }

    const tab = searchParams.get("tab");
    if (tab === "wallet") {
      setActiveTab("wallet");
    } else {
      setActiveTab("profile");
    }

    const paymentStatus = searchParams.get("status");
    const code = searchParams.get("code");
    const cancel = searchParams.get("cancel");
    if (paymentStatus === "PAID" || code === "00") {
      setDepositSuccess("Nạp tiền thành công! Số dư mới đã được cập nhật.");
      setSearchParams({ tab: "wallet" }, { replace: true });
    } else if (paymentStatus === "CANCELLED" || cancel === "true") {
      setDepositError("Giao dịch nạp tiền đã bị hủy.");
      setSearchParams({ tab: "wallet" }, { replace: true });
    }

    if (
      searchParams.get("vehicleForm") === "add" ||
      searchParams.get("addVehicle") === "1"
    ) {
      setVehicleReturnTo(safeReturnTo);
      setEditingVehicleId(null);
      setVehicleForm({
        plate: "",
        brand: "",
        modelId: "",
        modelName: "",
        size: "",
      });
      setVehicleError("");
      setShowVehicleForm(true);
    }

    if (searchParams.toString() && !paymentStatus && !code && !cancel) {
      const tabVal = searchParams.get("tab");
      if (tabVal) {
        setSearchParams({ tab: tabVal }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const txs = await getWalletTransactions();
      setTransactions(sortNewestFirst(txs || []));
    } catch {
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "wallet") {
      fetchTransactions();
    }
  }, [activeTab]);

  const handleDepositSubmit = async (event) => {
    event.preventDefault();
    setDepositError("");
    setDepositSuccess("");

    const amountVal = Number(depositAmount);
    if (!depositAmount || isNaN(amountVal) || amountVal < 10000) {
      setDepositError("Số tiền nạp tối thiểu là 10.000đ.");
      return;
    }

    setDepositLoading(true);
    try {
      const response = await depositWallet(amountVal);
      const paymentUrl =
        response?.checkoutUrl || response?.paymentUrl || response?.url;
      if (paymentUrl) {
        setDepositSuccess("Đang chuyển hướng đến trang thanh toán PayOS...");
        window.location.href = paymentUrl;
      } else {
        setDepositError(
          "Không tạo được liên kết thanh toán. Vui lòng thử lại.",
        );
      }
    } catch (err) {
      setDepositError(
        getFriendlyErrorMessage(
          err,
          "Không thể kết nối đến cổng thanh toán. Vui lòng thử lại sau.",
        ),
      );
    } finally {
      setDepositLoading(false);
    }
  };

  const handleVehicleFieldChange = (key, value) => {
    setVehicleForm((prev) => {
      if (key === "brand") {
        return {
          ...prev,
          brand: value,
          modelId: "",
          modelName: "",
          size: "",
        };
      }
      if (key === "modelId") {
        const selectedModel = getVehicleModelById(vehicleModels, value);
        return {
          ...prev,
          modelId: value,
          brand: selectedModel?.brand || prev.brand,
          modelName: selectedModel?.modelName || "",
          size: selectedModel?.vehicleSize || prev.size,
        };
      }
      if (key === "plate") {
        return { ...prev, plate: formatVietnamLicensePlate(value) };
      }
      return { ...prev, [key]: value };
    });
  };

  const openAddVehicleForm = () => {
    setEditingVehicleId(null);
    setVehicleReturnTo(profileReturnTo);
    setVehicleForm({
      plate: "",
      brand: "",
      modelId: "",
      modelName: "",
      size: "",
    });
    setVehicleError("");
    setShowVehicleForm(true);
  };

  const openEditVehicleForm = (vehicle) => {
    setEditingVehicleId(vehicle.id || vehicle.plate);
    setVehicleReturnTo("");
    const vehicleModel =
      getVehicleModelById(
        vehicleModels,
        vehicle.modelId || vehicle.vehicleModelId,
      ) ||
      getVehicleModelByName(
        vehicleModels,
        vehicle.brand,
        vehicle.modelName || vehicle.model,
      );
    setVehicleForm({
      plate: formatVietnamLicensePlate(
        vehicle.plate || vehicle.licensePlate || "",
      ),
      brand: vehicleModel?.brand || vehicle.brand || "",
      modelId:
        vehicleModel?.id || vehicle.modelId || vehicle.vehicleModelId || "",
      modelName:
        vehicleModel?.modelName || vehicle.modelName || vehicle.model || "",
      size: vehicleModel?.vehicleSize || normalizeVehicleSize(vehicle),
    });
    setVehicleError("");
    setShowVehicleForm(true);
  };

  const closeVehicleForm = () => {
    setShowVehicleForm(false);
    setEditingVehicleId(null);
    setVehicleReturnTo("");
    setVehicleForm({
      plate: "",
      brand: "",
      modelId: "",
      modelName: "",
      size: "",
    });
    setVehicleError("");
  };

  const handleVehicleFormBack = () => {
    if (vehicleReturnTo) {
      navigate(vehicleReturnTo, { replace: true });
      return;
    }
    closeVehicleForm();
  };

  const handleSaveVehicle = async (event) => {
    event.preventDefault();
    setVehicleError("");

    if (!vehicleForm.plate.trim()) {
      setVehicleError("Vui lòng nhập biển số xe.");
      return;
    }

    const selectedModel = getVehicleModelById(
      vehicleModels,
      vehicleForm.modelId,
    );
    if (!selectedModel) {
      setVehicleError("Vui lòng chọn dòng xe.");
      return;
    }

    const sizeOption = getVehicleSizeOption(
      vehicleForm.size || selectedModel.vehicleSize,
    );
    const typeLabel = `${sizeOption.label} - ${sizeOption.description}`;
    const normalizedPlate = formatVietnamLicensePlate(vehicleForm.plate);
    if (!isValidVietnamLicensePlate(normalizedPlate)) {
      setVehicleError("Biển số xe phải đúng dạng 59A - 123.45.");
      return;
    }

    const normalizedPlateKey = compactLicensePlate(normalizedPlate);
    const duplicate = profile.vehicles.some(
      (vehicle) =>
        compactLicensePlate(vehicle.plate || vehicle.licensePlate) ===
          normalizedPlateKey &&
        (vehicle.id || vehicle.plate) !== editingVehicleId,
    );

    if (duplicate) {
      setVehicleError("Biển số xe này đã tồn tại.");
      return;
    }

    const vehiclePayload = {
      licensePlate: normalizedPlate,
      vehicleSize: sizeOption.value,
      vehicleModelId: selectedModel.id,
    };
    const displayVehicle = {
      name: typeLabel,
      plate: normalizedPlate,
      licensePlate: normalizedPlate,
      brand: selectedModel.brand,
      modelId: selectedModel.id,
      modelName: selectedModel.modelName,
      model_name: selectedModel.modelName,
      vehicleModelId: selectedModel.id,
      type: sizeOption.value,
      size: sizeOption.value,
      vehicleSize: sizeOption.value,
      vehicle_size: sizeOption.value,
      label: `${selectedModel.brand} ${selectedModel.modelName}`,
    };

    let savedVehicle;
    try {
      savedVehicle = editingVehicleId
        ? await updateMyCar(editingVehicleId, vehiclePayload)
        : await addMyCar(vehiclePayload);
    } catch {
      setVehicleError("Chưa lưu được xe lên hệ thống. Vui lòng thử lại.");
      return;
    }

    const nextVehicle = normalizeCustomerCar({
      ...displayVehicle,
      ...savedVehicle,
      brand: savedVehicle.brand || displayVehicle.brand,
      modelName: savedVehicle.modelName || displayVehicle.modelName,
      model_name: savedVehicle.model_name || displayVehicle.model_name,
      label: savedVehicle.label || displayVehicle.label,
      default: savedVehicle.default ?? profile.vehicles.length === 0,
      lastWash: savedVehicle.lastWash ?? null,
    });

    const nextVehicles = editingVehicleId
      ? profile.vehicles.map((vehicle) =>
          (vehicle.id || vehicle.plate) === editingVehicleId
            ? { ...vehicle, ...nextVehicle }
            : vehicle,
        )
      : [...profile.vehicles, nextVehicle];

    updateUser({ vehicles: nextVehicles });
    setProfile((prev) => ({
      ...prev,
      vehicles: nextVehicles,
    }));
    const shouldReturnToBooking = vehicleReturnTo && !editingVehicleId;
    closeVehicleForm();
    if (shouldReturnToBooking) {
      navigate(vehicleReturnTo, { replace: true });
    }
  };
  return (
    <div className="customer-motion-root min-h-screen overflow-hidden bg-[#f4fafc] font-body-md text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(244,253,255,0.96),rgba(244,250,252,0.84)_46%,rgba(70,190,230,0.48))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,116,158,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,116,158,0.1)_1px,transparent_1px)] bg-[size:74px_74px]" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="Profile" />

        <main className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-32 sm:px-6 lg:px-10">
          <section className="relative mb-8 overflow-hidden rounded-[34px] border border-white/75 bg-white/58 p-7 shadow-[0_32px_90px_rgba(2,74,138,0.12)] backdrop-blur-2xl sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.18),transparent_28%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-end">
              <div>
                <div className="flex flex-col gap-7">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                      Hồ sơ khách hàng
                    </p>
                    <h1 className="mt-7 max-w-4xl text-balance text-4xl font-black leading-[1.02] tracking-normal text-slate-950 sm:text-5xl xl:text-6xl">
                      {profile.name || "Hồ sơ của bạn"}
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                      Thông tin, xe và ưu đãi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/booking")}
                    className="w-fit shrink-0 rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
                  >
                    Đặt lịch rửa xe
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/75 bg-white/62 p-5 shadow-sm backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                    Hạng
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-950">
                    {profile.membership || "Member"}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/75 bg-white/62 p-5 shadow-sm backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                    Lượt rửa
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-950">
                    {profile.washes || 0}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/75 bg-white/62 p-5 shadow-sm backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                    Điểm đổi
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-950">
                    {(profile.points || 0).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/75 bg-white/62 p-5 shadow-sm backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                    Điểm hạng
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-950">
                    {(profile.rankPoints || 0).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              {/* Tab Bar */}
              <div className="flex gap-2 rounded-2xl bg-[#003c5f]/8 p-1.5 w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("profile");
                    setSearchParams((prev) => {
                      prev.delete("tab");
                      return prev;
                    });
                  }}
                  className={`flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black transition-all ${
                    activeTab === "profile"
                      ? "bg-white text-[#005c91] shadow-sm"
                      : "text-[#314c5f] hover:bg-white/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    person
                  </span>
                  Thông tin xe & Ưu đãi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("wallet");
                    setSearchParams((prev) => {
                      prev.set("tab", "wallet");
                      return prev;
                    });
                  }}
                  className={`flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black transition-all ${
                    activeTab === "wallet"
                      ? "bg-white text-[#005c91] shadow-sm"
                      : "text-[#314c5f] hover:bg-white/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    account_balance_wallet
                  </span>
                  Ví của tôi
                </button>
              </div>

              {activeTab === "wallet" ? (
                <div className="space-y-6">
                  {/* Card hiển thị số dư ví */}
                  <section className="relative overflow-hidden rounded-[34px] border border-cyan-200/50 bg-[#003c5f]/95 p-6 text-white shadow-xl sm:p-8">
                    <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
                    <div className="relative">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                        Ví điện tử autoWash
                      </p>
                      <h3 className="mt-3 text-sm font-semibold text-cyan-100/80">
                        Số dư hiện tại
                      </h3>
                      <p
                        className="mt-2 text-4xl font-black tracking-wider sm:text-5xl"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {(profile.walletBalance || 0).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </section>

                  {/* Form nạp tiền */}
                  <section className="rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
                    <div className="mb-6">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                        Nạp tiền
                      </p>
                      <h2 className="mt-2 text-3xl font-black text-slate-950">
                        Nạp tiền vào ví
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Nạp tiền nhanh qua PayOS (VietQR). Hỗ trợ tất cả ngân
                        hàng.
                      </p>
                    </div>

                    <form onSubmit={handleDepositSubmit} className="space-y-5">
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700"
                          htmlFor="deposit-amount"
                        >
                          Số tiền muốn nạp (đ)
                        </label>
                        <input
                          id="deposit-amount"
                          type="number"
                          min="10000"
                          step="1000"
                          placeholder="Nhập số tiền nạp (tối thiểu 10,000đ)..."
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="h-13 w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 text-base font-black text-slate-950 outline-none transition placeholder:text-slate-400/70 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        />
                      </div>

                      {/* Nút nạp nhanh */}
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 mb-2.5">
                          Số tiền gợi ý
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[50000, 100000, 200000, 500000].map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => setDepositAmount(String(amount))}
                              className={`h-11 rounded-xl border font-black text-xs transition-all ${
                                Number(depositAmount) === amount
                                  ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-md"
                                  : "border-cyan-100 bg-white/60 text-[#005c91] hover:-translate-y-0.5 hover:bg-cyan-50"
                              }`}
                            >
                              {amount.toLocaleString("vi-VN")}đ
                            </button>
                          ))}
                        </div>
                      </div>

                      {depositError && (
                        <p className="text-sm font-semibold text-rose-600">
                          {depositError}
                        </p>
                      )}
                      {depositSuccess && (
                        <p className="text-sm font-semibold text-emerald-600">
                          {depositSuccess}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={depositLoading}
                        className="min-h-[58px] w-full rounded-[22px] bg-cyan-400 px-6 py-4 text-lg font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {depositLoading ? "Đang xử lý..." : "Nạp tiền ngay"}
                      </button>
                    </form>
                  </section>

                  {/* Lịch sử giao dịch */}
                  <section className="rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
                    <div className="mb-6">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                        Lịch sử
                      </p>
                      <h2 className="mt-2 text-3xl font-black text-slate-950">
                        Lịch sử giao dịch
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Lịch sử nạp, nhận hoàn và thanh toán của ví.
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-[24px] border border-cyan-100 bg-white/50">
                      {transactionsLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">
                          Đang tải lịch sử giao dịch...
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">
                          Chưa có giao dịch nào được thực hiện.
                        </div>
                      ) : (
                        <table className="w-full border-collapse text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-cyan-100 bg-cyan-50/50 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">
                              <th className="px-4 py-3">Mã GD</th>
                              <th className="px-4 py-3">Loại</th>
                              <th className="px-4 py-3">Số tiền</th>
                              <th className="px-4 py-3">Nội dung</th>
                              <th className="px-4 py-3">Thời gian</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-cyan-100/50">
                            {transactions.map((tx) => {
                              const txType =
                                tx.transactionType || tx.type || "";
                              const isAdd =
                                txType === "DEPOSIT" || txType === "REFUND";
                              const sign = isAdd ? "+" : "-";
                              const colorClass = isAdd
                                ? "text-emerald-600 font-bold"
                                : "text-rose-600 font-bold";
                              const typeLabel =
                                txType === "DEPOSIT"
                                  ? "Nạp tiền"
                                  : txType === "REFUND"
                                    ? "Hoàn tiền"
                                    : "Thanh toán";

                              return (
                                <tr key={tx.id} className="hover:bg-cyan-50/30">
                                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                    {tx.id}
                                  </td>
                                  <td className="px-4 py-3 font-black text-slate-700">
                                    {typeLabel}
                                  </td>
                                  <td
                                    className={`px-4 py-3 ${colorClass}`}
                                    style={{
                                      fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                  >
                                    {sign}
                                    {Math.abs(tx.amount).toLocaleString(
                                      "vi-VN",
                                    )}
                                    đ
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-600">
                                    {tx.description}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-500">
                                    {new Date(tx.createdAt).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <>
                  <section className="rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                          Xe
                        </p>
                        <h2 className="mt-2 text-3xl font-black text-slate-950">
                          Phương tiện
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Quản lý xe của bạn.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openAddVehicleForm}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          add_circle
                        </span>
                        Thêm xe mới
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {profile.vehicles.length === 0 ? (
                        <div className="col-span-full rounded-[24px] border border-dashed border-cyan-200 bg-cyan-50/70 p-8 text-center text-sm font-semibold text-slate-500">
                          Chưa có phương tiện nào.
                        </div>
                      ) : (
                        profile.vehicles.map((vehicle) => (
                          <div
                            key={vehicle.id || vehicle.plate}
                            className="group relative flex items-center gap-4 overflow-hidden rounded-[24px] border border-white/75 bg-white/70 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_20px_60px_rgba(2,74,138,0.12)]"
                          >
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-cyan-50">
                              <span className="material-symbols-outlined text-[32px] text-cyan-700">
                                {
                                  getVehicleSizeOption(
                                    normalizeVehicleSize(vehicle),
                                  ).icon
                                }
                              </span>
                            </div>
                            <div className="min-w-0 flex-grow">
                              <h3 className="truncate font-black text-slate-950">
                                {vehicle.label ||
                                  vehicle.name ||
                                  getVehicleSizeOption(
                                    normalizeVehicleSize(vehicle),
                                  ).label}
                              </h3>
                              <p className="text-xs font-semibold text-slate-500">
                                Biển số: {vehicle.plate}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-800">
                                  {
                                    getVehicleSizeOption(
                                      normalizeVehicleSize(vehicle),
                                    ).description
                                  }
                                </span>
                                {vehicle.default && (
                                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openEditVehicleForm(vehicle)}
                              className="rounded-2xl bg-slate-950/5 p-3 text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-700"
                              aria-label="Sửa xe"
                            >
                              <span className="material-symbols-outlined">
                                edit
                              </span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                          Ưu đãi
                        </p>
                        <h2 className="mt-2 text-3xl font-black text-slate-950">
                          Voucher của bạn
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Đổi điểm lấy voucher.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/rewards")}
                        className="rounded-2xl border border-cyan-200 bg-white/70 px-5 py-3 text-sm font-black text-cyan-800 transition hover:bg-cyan-50"
                      >
                        Xem tất cả
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vouchers.length === 0 ? (
                        <div className="col-span-full rounded-[24px] border border-dashed border-cyan-200 bg-cyan-50/70 p-8 text-center text-sm font-semibold text-slate-500">
                          Chưa có voucher nào.
                        </div>
                      ) : (
                        vouchers.map((voucher) => (
                          <div
                            key={
                              voucher.id ||
                              voucher.voucherId ||
                              voucher.code ||
                              voucher.name
                            }
                            className="group flex items-center gap-4 rounded-[24px] border border-white/75 bg-white/70 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_20px_60px_rgba(2,74,138,0.12)]"
                          >
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl bg-cyan-50">
                              <span className="material-symbols-outlined text-[32px] text-cyan-700">
                                {voucher.icon || "redeem"}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-black text-slate-950">
                                {voucher.name || voucher.title || "Voucher"}
                              </h3>
                              <p className="mt-2 text-xs font-semibold text-slate-500">
                                {voucher.description || voucher.desc || ""}
                              </p>
                              <p className="mt-2 text-xs font-black text-cyan-700">
                                {(
                                  voucher.pointCost ??
                                  voucher.pointsCost ??
                                  voucher.points ??
                                  0
                                ).toLocaleString("vi-VN")}{" "}
                                điểm
                              </p>
                            </div>
                            <button className="rounded-2xl bg-slate-950 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="material-symbols-outlined">
                                redeem
                              </span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>

            <aside className="space-y-6">
              <section className="rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
                <div className="mb-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                      Check-in
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">
                      Mã QR
                    </h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {cancelSuccessMsg && (
                    <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-xs font-black text-cyan-800 ring-1 ring-cyan-100">
                      {cancelSuccessMsg}
                    </div>
                  )}
                  {cancelError && (
                    <div className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                      {cancelError}
                    </div>
                  )}
                  {pendingQrBookings.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-cyan-200 bg-cyan-50/70 p-8 text-center text-sm font-semibold text-slate-500">
                      Chưa có lịch đặt nào đang chờ QR.
                    </div>
                  ) : (
                    pendingQrBookings.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="rounded-[24px] border border-cyan-100 bg-white/78 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_18px_46px_rgba(8,145,178,0.14)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-950">
                              {item.plate ||
                                item.licensePlate ||
                                "Chưa có biển số"}
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                              {item.service || item.serviceName || "-"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                              statusStyles[String(item.status).toUpperCase()] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
                              {item.time || "--:--"}
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-950">
                              {item.date || "--/--/----"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedQrBooking(item)}
                              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                qr_code_2
                              </span>
                              QR
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCancelError("");
                                setCancelSuccessMsg("");
                                setCancelBookingItem(item);
                              }}
                              className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-black text-white transition hover:bg-rose-600"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                  Quick actions
                </p>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Đặt lịch mới", "/booking", "local_car_wash"],
                    ["Đổi voucher", "/rewards", "redeem"],
                  ].map(([label, path, icon]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => navigate(path)}
                      className="flex items-center justify-between rounded-2xl border border-white/75 bg-white/70 px-4 py-4 text-left font-black text-slate-950 transition hover:-translate-y-0.5 hover:border-cyan-200"
                    >
                      <span>{label}</span>
                      <span className="material-symbols-outlined text-cyan-700">
                        {icon}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </main>
      </div>

      {showVehicleForm && !editingVehicleId && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/55 px-4 py-5 backdrop-blur-xl sm:py-8">
          <div className="pointer-events-none fixed inset-0 min-h-[100dvh]">
            <img
              src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=2000&auto=format&fit=crop"
              alt=""
              className="absolute inset-0 h-full min-h-[100dvh] w-full object-cover opacity-[0.18]"
            />
            <div className="absolute inset-0 min-h-[100dvh] bg-[linear-gradient(115deg,rgba(255,255,255,0.94),rgba(221,248,255,0.86)_48%,rgba(103,232,249,0.26))]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.07)_1px,transparent_1px)] bg-[size:74px_74px]" />
          </div>
          <div className="relative mx-auto flex min-h-full w-full max-w-[620px] flex-col gap-5">
            <button
              type="button"
              onClick={handleVehicleFormBack}
              className="group sticky top-3 z-10 inline-flex w-fit items-center gap-2 rounded-2xl border border-white/75 bg-white/72 px-4 py-3 text-xs font-black text-cyan-800 shadow-sm backdrop-blur-2xl transition hover:bg-cyan-50"
            >
              <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">
                arrow_back
              </span>
              {vehicleReturnTo ? "Quay lại đặt lịch" : "Quay lại Profile"}
            </button>

            <div className="overflow-hidden rounded-[34px] border border-white/75 bg-white/72 p-7 shadow-[0_32px_90px_rgba(2,74,138,0.18)] backdrop-blur-2xl sm:p-8">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Xe
              </p>
              <h1 className="mt-6 text-4xl font-black leading-[1.02] text-slate-950">
                Thêm xe
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                Thêm xe để đặt lịch nhanh hơn.
              </p>

              <form
                className="mt-8 flex flex-col gap-8"
                onSubmit={handleSaveVehicle}
              >
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700"
                    htmlFor="vehicle-add-plate"
                  >
                    Biển số xe
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700">
                      license
                    </span>
                    <input
                      id="vehicle-add-plate"
                      value={vehicleForm.plate}
                      onChange={(event) =>
                        handleVehicleFieldChange("plate", event.target.value)
                      }
                      type="text"
                      placeholder="59A - 123.45"
                      className="h-14 w-full rounded-2xl border border-cyan-100 bg-white/80 pl-12 pr-4 text-base font-black uppercase text-slate-950 outline-none transition placeholder:text-slate-400/70 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>
                  {vehicleError && (
                    <p className="text-sm font-semibold text-rose-600">
                      {vehicleError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    Dòng xe
                  </span>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Hãng xe
                      </span>
                      <select
                        value={vehicleForm.brand}
                        onChange={(event) =>
                          handleVehicleFieldChange("brand", event.target.value)
                        }
                        disabled={
                          vehicleModelsLoading || vehicleBrands.length === 0
                        }
                        className="h-14 w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 text-base font-black text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">
                          {vehicleModelsLoading
                            ? "Đang tải..."
                            : "Chọn hãng xe"}
                        </option>
                        {vehicleBrands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Mẫu xe
                      </span>
                      <select
                        value={vehicleForm.modelId}
                        onChange={(event) =>
                          handleVehicleFieldChange(
                            "modelId",
                            event.target.value,
                          )
                        }
                        disabled={
                          !vehicleForm.brand || currentBrandModels.length === 0
                        }
                        className="h-14 w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 text-base font-black text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="">Chọn mẫu xe</option>
                        {currentBrandModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.modelName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {vehicleModelsError && (
                    <p className="text-sm font-semibold text-rose-600">
                      {vehicleModelsError}
                    </p>
                  )}
                </div>

                <div className="relative mt-1 h-40 w-full overflow-hidden rounded-[26px] border border-white/75 bg-[radial-gradient(circle_at_18%_16%,rgba(103,232,249,0.38),transparent_34%),linear-gradient(135deg,rgba(236,254,255,0.94),rgba(186,230,253,0.74)_48%,rgba(14,165,233,0.24))] shadow-md">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.08)_1px,transparent_1px)] bg-[size:38px_38px]" />
                  <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/60 blur-2xl" />
                  <div className="absolute bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200 shadow-[0_18px_40px_rgba(2,74,138,0.18)]">
                    <span className="material-symbols-outlined text-[30px]">
                      local_car_wash
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-24 right-5 text-slate-950">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                      Sẵn sàng
                    </p>
                    <p className="mt-2 text-xl font-black">
                      Xe đã sẵn sàng để đặt lịch
                    </p>
                  </div>
                </div>

                <button
                  className="h-14 w-full rounded-2xl bg-cyan-400 font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300 active:scale-[0.98]"
                  type="submit"
                >
                  Thêm xe ngay
                </button>
              </form>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-black text-white/80">
              <span className="material-symbols-outlined text-sm">
                verified_user
              </span>
              <span>
                Thông tin xe được bảo mật và chỉ dùng để lên lịch hẹn.
              </span>
            </div>
          </div>
        </div>
      )}

      {showVehicleForm && editingVehicleId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xl">
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-white/75 bg-white/90 shadow-[0_32px_90px_rgba(2,74,138,0.18)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-cyan-100 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                  Xe
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {editingVehicleId
                    ? "Chỉnh sửa phương tiện"
                    : "Thêm phương tiện"}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleVehicleFormBack}
                className="rounded-2xl bg-slate-950/5 p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-700"
                aria-label="Đóng chỉnh sửa phương tiện"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
              <form
                className="flex flex-col gap-5"
                onSubmit={handleSaveVehicle}
              >
                <label className="flex flex-col gap-2" htmlFor="vehicle-plate">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    Biển số xe
                  </span>
                  <input
                    id="vehicle-plate"
                    value={vehicleForm.plate}
                    onChange={(event) =>
                      handleVehicleFieldChange("plate", event.target.value)
                    }
                    type="text"
                    placeholder="59A - 123.45"
                    className="h-13 w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 text-base font-black uppercase text-slate-950 outline-none transition placeholder:text-slate-400/70 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>
                {vehicleError && (
                  <p className="text-sm font-semibold text-rose-600">
                    {vehicleError}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                      Hãng xe
                    </span>
                    <select
                      value={vehicleForm.brand}
                      onChange={(event) =>
                        handleVehicleFieldChange("brand", event.target.value)
                      }
                      disabled={
                        vehicleModelsLoading || vehicleBrands.length === 0
                      }
                      className="h-13 w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 text-sm font-black text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                      <option value="">
                        {vehicleModelsLoading ? "Đang tải..." : "Chọn hãng xe"}
                      </option>
                      {vehicleBrands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                      Tên xe
                    </span>
                    <select
                      value={vehicleForm.modelId}
                      onChange={(event) =>
                        handleVehicleFieldChange("modelId", event.target.value)
                      }
                      disabled={
                        !vehicleForm.brand || currentBrandModels.length === 0
                      }
                      className="h-13 w-full rounded-2xl border border-cyan-100 bg-white/80 px-4 text-sm font-black text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                      <option value="">Chọn tên xe</option>
                      {currentBrandModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.modelName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {vehicleModelsError && (
                  <p className="text-sm font-semibold text-rose-600">
                    {vehicleModelsError}
                  </p>
                )}

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                    Loại xe
                  </span>
                  <input
                    value={vehicleForm.size}
                    readOnly
                    placeholder="Tự động theo hãng và tên xe"
                    className="h-13 w-full cursor-not-allowed rounded-2xl border border-cyan-100 bg-slate-100/80 px-4 text-sm font-black uppercase text-slate-600 outline-none"
                  />
                </label>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleVehicleFormBack}
                    className="h-12 rounded-2xl border border-cyan-100 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-cyan-50"
                  >
                    Hủy
                  </button>
                  <button
                    className="h-12 rounded-2xl bg-cyan-400 px-6 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300 active:scale-[0.98]"
                    type="submit"
                  >
                    {editingVehicleId ? "Lưu thay đổi" : "Thêm xe"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedQrBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/75 bg-white/82 shadow-[0_32px_90px_rgba(2,74,138,0.18)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/15 bg-slate-950 px-6 py-5">
              <h2 className="text-xl font-black text-white">
                Mã QR lịch đặt
              </h2>
              <button
                type="button"
                onClick={() => setSelectedQrBooking(null)}
                className="rounded-2xl bg-slate-950/5 p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-700"
                aria-label="Đóng mã QR"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center p-6">
              <div className="mb-6 w-full space-y-3">
                <div className="flex justify-between rounded-2xl bg-cyan-50/70 px-4 py-3 text-sm">
                  <span className="font-bold text-slate-500">Biển số xe</span>
                  <span className="font-black text-slate-950">
                    {selectedQrBooking.plate || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 rounded-2xl bg-cyan-50/70 px-4 py-3 text-sm">
                  <span className="font-bold text-slate-500">Dịch vụ</span>
                  <span className="text-right font-black text-slate-950">
                    {selectedQrBooking.service ||
                      selectedQrBooking.serviceName ||
                      "-"}
                  </span>
                </div>
                <div className="flex justify-between rounded-2xl bg-cyan-50/70 px-4 py-3 text-sm">
                  <span className="font-bold text-slate-500">Thời gian</span>
                  <span className="font-black text-slate-950">
                    {selectedQrBooking.time || "--:--"},{" "}
                    {selectedQrBooking.date || "--/--/----"}
                  </span>
                </div>
              </div>

              <div className="mb-6 rounded-[26px] border border-cyan-100 bg-white p-4 shadow-inner flex items-center justify-center min-h-[220px] min-w-[220px]">
                {qrCodeLoading ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="animate-spin text-cyan-500 material-symbols-outlined text-4xl mb-2">
                      sync
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-sans">
                      Đang tải mã QR...
                    </span>
                  </div>
                ) : qrCodeError ? (
                  <div className="flex flex-col items-center justify-center p-2 text-center text-rose-500 text-xs font-sans">
                    <span className="material-symbols-outlined text-3xl mb-1">
                      error
                    </span>
                    {qrCodeError}
                  </div>
                ) : qrCodeData?.qrImageBase64 ? (
                  <img
                    alt="Mã QR lịch đặt"
                    className="h-48 w-48 object-contain"
                    src={qrCodeData.qrImageBase64}
                  />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center text-slate-400 text-xs font-bold font-sans">
                    Không có dữ liệu QR
                  </div>
                )}
              </div>

              <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-600">
                Dùng mã này để quét và tra cứu lịch đặt
              </div>

              <button
                type="button"
                onClick={() => setSelectedQrBooking(null)}
                className="mt-8 w-full rounded-2xl bg-cyan-400 py-4 font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {cancelBookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/75 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-4xl">
                warning
              </span>
              <h3 className="text-2xl font-black text-slate-950 text-left">
                Xác nhận hủy lịch
              </h3>
            </div>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-600 text-left">
              {(() => {
                const isPaid = String(cancelBookingItem.paymentStatus || "").toUpperCase() === "PAID";
                if (!isPaid) {
                  return "Bạn có chắc chắn muốn hủy đơn đặt lịch này không?";
                }
                const scheduledTime = new Date(
                  cancelBookingItem.scheduledStartTime,
                );
                const now = new Date();
                const diffInMs = scheduledTime.getTime() - now.getTime();
                const diffInMinutes = diffInMs / (1000 * 60);
                if (diffInMinutes < 60) {
                  return "Bạn đang hủy lịch sát giờ hẹn (dưới 60 phút). Bạn sẽ không được hoàn trả lại tiền cọc. Bạn có chắc chắn muốn hủy không?";
                }
                return "Bạn có chắc chắn muốn hủy lịch hẹn này không? Tiền thanh toán/đặt cọc (100%) sẽ được hoàn lại vào ví của bạn.";
              })()}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelBookingItem(null)}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={async () => {
                  setCancelLoading(true);
                  setCancelError("");
                  setCancelSuccessMsg("");
                  try {
                    const isPaid = String(cancelBookingItem.paymentStatus || "").toUpperCase() === "PAID";
                    const scheduledTime = new Date(
                      cancelBookingItem.scheduledStartTime,
                    );
                    const now = new Date();
                    const diffInMs = scheduledTime.getTime() - now.getTime();
                    const diffInMinutes = diffInMs / (1000 * 60);

                    await cancelBooking(cancelBookingItem.id);

                    const [profileRes, bookingsRes] = await Promise.all([
                      getCustomerProfile().catch(() => null),
                      getCustomerProfileBookings().catch(() => null),
                    ]);

                    if (profileRes) {
                      const data =
                        profileRes.data?.data ?? profileRes.data ?? {};
                      setProfile((prev) => ({
                        ...prev,
                        ...data,
                        walletBalance: data.walletBalance || 0,
                      }));
                    }

                    if (bookingsRes) {
                      const bookings = Array.isArray(bookingsRes.data)
                        ? bookingsRes.data
                        : bookingsRes.data?.bookings ||
                          bookingsRes.data?.data ||
                          [];
                      setRecentBookings(getRecentBookings(bookings));
                      setPendingQrBookings(getPendingQrBookings(bookings));
                    }

                    if (!isPaid) {
                      setCancelSuccessMsg("Hủy đơn đặt lịch thành công.");
                    } else if (diffInMinutes >= 60) {
                      setCancelSuccessMsg(
                        "Hủy lịch thành công. Tiền đặt cọc (100%) đã được hoàn lại vào ví của bạn.",
                      );
                    } else {
                      setCancelSuccessMsg(
                        "Hủy lịch thành công. Bạn không được hoàn lại tiền đặt cọc do hủy dưới 60 phút.",
                      );
                    }
                  } catch (err) {
                    setCancelError(
                      getFriendlyErrorMessage(
                        err,
                        "Không thể hủy lịch. Vui lòng thử lại sau.",
                      ),
                    );
                  } finally {
                    setCancelLoading(false);
                    setCancelBookingItem(null);
                  }
                }}
                className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {cancelLoading ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
