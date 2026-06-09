import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import { getUser, updateUser } from "../../utils/auth";
import {
  getCustomerProfile,
  getCustomerProfileBookings,
  getCustomerProfileLoyalty,
} from "../../services/customerProfileApi";

const statusStyles = {
  PENDING: "bg-[#0061a5]/10 text-[#0061a5]",
  COMPLETED: "bg-emerald-500/10 text-emerald-600",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const formatCurrency = (value) =>
  value ? `${value.toLocaleString("vi-VN")}đ` : "-";

const getBookingQrValue = (booking) => {
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

const getAvatarUrl = (user) => {
  if (!user) return null;
  return (
    user.photoURL ||
    user.picture ||
    user.avatar ||
    (user.email
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name || user.email.split("@")[0],
        )}&background=0D4F92&color=ffffff&bold=true`
      : null)
  );
};

const mergeVehicles = (...groups) => {
  const seen = new Set();
  return groups
    .flat()
    .filter(Boolean)
    .filter((vehicle) => {
      const key = String(vehicle.plate || vehicle.id || "").toUpperCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const unwrapPayload = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? {};

const VEHICLE_SIZE_OPTIONS = [
  { value: "SMALL", label: "SMALL", description: "4-5 chỗ", icon: "directions_car" },
  { value: "MEDIUM", label: "MEDIUM", description: "CUV/SUV 5 chỗ", icon: "commute" },
  { value: "LARGE", label: "LARGE", description: "7 chỗ", icon: "airport_shuttle" },
  { value: "XLARGE", label: "XLARGE", description: "Bán tải, Van", icon: "local_shipping" },
];

const getVehicleSizeOption = (value) =>
  VEHICLE_SIZE_OPTIONS.find((option) => option.value === value) ||
  VEHICLE_SIZE_OPTIONS[0];

const normalizeVehicleSize = (vehicle) => {
  const rawSize = String(vehicle?.size || vehicle?.vehicleSize || vehicle?.type || "").toUpperCase();
  if (["SMALL", "MEDIUM", "LARGE", "XLARGE"].includes(rawSize)) return rawSize;
  if (String(vehicle?.type || "").includes("7")) return "LARGE";
  if (String(vehicle?.type || "").toLowerCase().includes("suv")) return "MEDIUM";
  return "SMALL";
};

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getUser() || {};
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [profileReturnTo, setProfileReturnTo] = useState("");
  const [vehicleReturnTo, setVehicleReturnTo] = useState("");
  const [selectedQrBooking, setSelectedQrBooking] = useState(null);
  const [vehicleError, setVehicleError] = useState("");
  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    size: "SMALL",
  });
  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    branch: user.branch || "",
    city: user.city || "",
    membership: user.tier || "",
    points: user.points ?? 0,
    rankPoints: user.rankPoints ?? 0,
    nextTierTarget: user.nextTierTarget ?? 0,
    progress: user.progress ?? 0,
    washes: user.washes ?? 0,
    vehicles: Array.isArray(user.vehicles) ? user.vehicles : [],
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const [profileRes, bookingsRes, loyaltyRes] = await Promise.all([
          getCustomerProfile().catch(() => null),
          getCustomerProfileBookings().catch(() => null),
          getCustomerProfileLoyalty().catch(() => null),
        ]);

        if (!isMounted) return;

        const apiProfile = profileRes?.data?.data ?? profileRes?.data ?? {};
        const localVehicles = Array.isArray(getUser()?.vehicles)
          ? getUser().vehicles
          : [];
        const loyalty = unwrapPayload(loyaltyRes);
        const bookings = Array.isArray(bookingsRes?.data)
          ? bookingsRes.data
          : bookingsRes?.data?.bookings || bookingsRes?.data?.data || [];

        setProfile((prev) => ({
          ...prev,
          ...apiProfile,
          name: apiProfile.name ?? prev.name,
          email: apiProfile.email ?? prev.email,
          phone: apiProfile.phone ?? prev.phone,
          branch: apiProfile.branch ?? prev.branch,
          city: apiProfile.city ?? prev.city,
          membership: loyalty.tier ?? apiProfile.tier ?? prev.membership,
          points: loyalty.redeemablePoints ?? apiProfile.points ?? prev.points,
          rankPoints: loyalty.points ?? apiProfile.rankPoints ?? prev.rankPoints,
          nextTierTarget:
            loyalty.nextTierTarget ??
            apiProfile.nextTierTarget ??
            prev.nextTierTarget,
          progress: loyalty.progress ?? apiProfile.progress ?? prev.progress,
          washes: apiProfile.washes ?? prev.washes,
          vehicles: mergeVehicles(
            Array.isArray(apiProfile.vehicles) ? apiProfile.vehicles : [],
            localVehicles,
            prev.vehicles,
          ),
        }));
        setRecentBookings(bookings.slice(-3).reverse());
        setVouchers(Array.isArray(loyalty.vouchers) ? loyalty.vouchers : []);
      } catch {
        if (isMounted) {
          setRecentBookings([]);
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
    const returnTo = searchParams.get("returnTo") || "";
    const safeReturnTo = returnTo.startsWith("/") ? returnTo : "";
    if (safeReturnTo) {
      setProfileReturnTo(safeReturnTo);
    }

    if (
      searchParams.get("vehicleForm") === "add" ||
      searchParams.get("addVehicle") === "1"
    ) {
      setVehicleReturnTo(safeReturnTo);
      setEditingVehicleId(null);
      setVehicleForm({ plate: "", size: "SMALL" });
      setVehicleError("");
      setShowVehicleForm(true);
    }

    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleVehicleFieldChange = (key, value) => {
    setVehicleForm((prev) => ({ ...prev, [key]: value }));
  };

  const openAddVehicleForm = () => {
    setEditingVehicleId(null);
    setVehicleReturnTo(profileReturnTo);
    setVehicleForm({ plate: "", size: "SMALL" });
    setVehicleError("");
    setShowVehicleForm(true);
  };

  const openEditVehicleForm = (vehicle) => {
    setEditingVehicleId(vehicle.id || vehicle.plate);
    setVehicleReturnTo("");
    setVehicleForm({
      plate: vehicle.plate || "",
      size: normalizeVehicleSize(vehicle),
    });
    setVehicleError("");
    setShowVehicleForm(true);
  };

  const closeVehicleForm = () => {
    setShowVehicleForm(false);
    setEditingVehicleId(null);
    setVehicleReturnTo("");
    setVehicleForm({ plate: "", size: "SMALL" });
    setVehicleError("");
  };

  const handleVehicleFormBack = () => {
    if (vehicleReturnTo) {
      navigate(vehicleReturnTo, { replace: true });
      return;
    }
    closeVehicleForm();
  };

  const handleSaveVehicle = (event) => {
    event.preventDefault();
    setVehicleError("");

    if (!vehicleForm.plate.trim()) {
      setVehicleError("Vui lòng nhập biển số xe.");
      return;
    }

    const sizeOption = getVehicleSizeOption(vehicleForm.size);
    const typeLabel = `${sizeOption.label} - ${sizeOption.description}`;
    const normalizedPlate = vehicleForm.plate.trim().toUpperCase();
    const duplicate = profile.vehicles.some(
      (vehicle) =>
        String(vehicle.plate || "").toUpperCase() === normalizedPlate &&
        (vehicle.id || vehicle.plate) !== editingVehicleId,
    );

    if (duplicate) {
      setVehicleError("Biển số xe này đã tồn tại.");
      return;
    }

    const nextVehicles = editingVehicleId
      ? profile.vehicles.map((vehicle) =>
          (vehicle.id || vehicle.plate) === editingVehicleId
            ? {
                ...vehicle,
                name: typeLabel,
                plate: normalizedPlate,
                type: sizeOption.value,
                size: sizeOption.value,
                label: typeLabel,
              }
            : vehicle,
        )
      : [
          ...profile.vehicles,
          {
            id: `vehicle-${Date.now()}`,
            name: typeLabel,
            plate: normalizedPlate,
            type: sizeOption.value,
            size: sizeOption.value,
            label: typeLabel,
            default: profile.vehicles.length === 0,
            lastWash: null,
          },
        ];

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

  const avatarUrl = getAvatarUrl(user);

  return (
    <div className="customer-motion-root min-h-screen overflow-hidden bg-[#eefbff] font-body-md text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <img
          src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-16"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.98),rgba(235,252,255,0.9)_46%,rgba(178,232,255,0.66))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.07)_1px,transparent_1px)] bg-[size:74px_74px]" />
        <div className="absolute left-[-140px] top-[-120px] h-[520px] w-[520px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="wash-foam-drift absolute bottom-[-120px] right-[-120px] h-72 w-[66vw] rounded-full bg-white/55 blur-3xl" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="Profile" />

      <main className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-32 sm:px-6 lg:px-10">
        <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="relative overflow-hidden rounded-[34px] border border-white/75 bg-white/58 p-7 shadow-[0_32px_90px_rgba(2,74,138,0.12)] backdrop-blur-2xl sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.18),transparent_28%)]" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                  Hồ sơ khách hàng
                </p>
                <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-normal sm:text-6xl">
                  Trung tâm tài khoản của {profile.name || "bạn"}.
                </h1>
                <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                  Quản lý xe, điểm thưởng, voucher và mã QR lịch rửa trong một hồ
                  sơ xanh trắng gọn gàng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/booking")}
                className="rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                Đặt lịch rửa xe
              </button>
            </div>
          </div>

          <aside className="rounded-[34px] border border-white/75 bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(2,20,38,0.2)]">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={
                    avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile.name || "Khách hàng",
                    )}&background=0D4F92&color=ffffff&bold=true`
                  }
                  alt={`${profile.name || "Khách hàng"} avatar`}
                  className="h-20 w-20 rounded-3xl border border-white/20 object-cover shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-slate-950 bg-emerald-400"></div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-2xl font-black">
                  {profile.name || "Khách hàng"}
                </p>
                <p className="truncate text-sm font-semibold text-slate-300">
                  {profile.email || profile.phone || "Chưa cập nhật liên hệ"}
                </p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  Hạng
                </p>
                <p className="mt-2 text-xl font-black">
                  {profile.membership || "Member"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  Lượt rửa
                </p>
                <p className="mt-2 text-xl font-black">{profile.washes || 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  Điểm đổi
                </p>
                <p className="mt-2 text-xl font-black">
                  {(profile.points || 0).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  Điểm hạng
                </p>
                <p className="mt-2 text-xl font-black">
                  {(profile.rankPoints || 0).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="mt-7">
              <div className="flex justify-between text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                <span>Tiến trình nâng hạng</span>
                <span>{profile.progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/12">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{ width: `${profile.progress}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-400">
                {profile.nextTierTarget > profile.rankPoints
                  ? `Còn ${(
                      profile.nextTierTarget - profile.rankPoints
                    ).toLocaleString("vi-VN")} điểm để lên hạng tiếp theo`
                  : "Chưa có dữ liệu mục tiêu nâng hạng"}
              </p>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <section className="rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                    Garage
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Phương tiện của bạn
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Quản lý danh sách xe cá nhân đã đăng ký.
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
                        {getVehicleSizeOption(normalizeVehicleSize(vehicle)).icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-grow">
                      <h3 className="truncate font-black text-slate-950">
                        {vehicle.label || vehicle.name || getVehicleSizeOption(normalizeVehicleSize(vehicle)).label}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        Biển số: {vehicle.plate}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-800">
                          {getVehicleSizeOption(normalizeVehicleSize(vehicle)).description}
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
                      <span className="material-symbols-outlined">edit</span>
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
                    Rewards
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Voucher của bạn
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Đổi điểm để nhận ưu đãi chăm sóc xe
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
                    key={voucher.id || voucher.voucherId || voucher.code || voucher.name}
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
                      <span className="material-symbols-outlined">redeem</span>
                    </button>
                  </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                    Recent wash
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Lịch sử gần đây
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="rounded-2xl border border-cyan-200 bg-white/70 px-4 py-2 text-sm font-black text-cyan-800 transition hover:bg-cyan-50"
                >
                  Tất cả
                </button>
              </div>
              <div className="space-y-3">
                {recentBookings.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-cyan-200 bg-cyan-50/70 p-8 text-center text-sm font-semibold text-slate-500">
                    Chưa có lịch sử rửa xe.
                  </div>
                ) : (
                  recentBookings.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-[24px] border border-white/75 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">
                            {item.service || item.serviceName || "-"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {item.date || "--/--/----"}
                          </p>
                        </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles[item.status] || "bg-[#0061a5]/10 text-[#0061a5]"}`}
                              >
                                {item.status || "Chờ thực hiện"}
                              </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="font-black text-cyan-700">
                          {formatCurrency(item.price)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedQrBooking(item)}
                          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                        >
                          QR
                        </button>
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
                  ["Xem lịch sử", "/history", "receipt_long"],
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

      {showVehicleForm && (
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
                Garage profile
              </p>
              <h1 className="mt-6 text-4xl font-black leading-tight text-slate-950">
                {editingVehicleId ? "Chỉnh sửa phương tiện" : "Thêm phương tiện mới"}
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                Thêm biển số để đặt lịch nhanh hơn và theo dõi lịch sử rửa xe theo từng phương tiện.
              </p>

              <form className="mt-8 flex flex-col gap-8" onSubmit={handleSaveVehicle}>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700"
                    htmlFor="vehicle-plate"
                  >
                    Biển số xe
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700">
                      license
                    </span>
                    <input
                      id="vehicle-plate"
                      value={vehicleForm.plate}
                      onChange={(event) =>
                        handleVehicleFieldChange("plate", event.target.value)
                      }
                      placeholder="Ví dụ: 30A-123.45"
                      type="text"
                      className="h-14 w-full rounded-2xl border border-cyan-100 bg-white/80 pl-12 pr-4 text-base font-black uppercase text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
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
                    Kích thước xe
                  </span>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {VEHICLE_SIZE_OPTIONS.map((option) => {
                      const active = vehicleForm.size === option.value;
                      return (
                        <label key={option.value} className="relative cursor-pointer">
                          <input
                            className="sr-only"
                            name="vehicle_size"
                            type="radio"
                            value={option.value}
                            checked={active}
                            onChange={() =>
                              handleVehicleFieldChange("size", option.value)
                            }
                          />
                          <div
                            className={`flex min-h-40 flex-col items-center justify-center gap-3 rounded-[24px] border p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 ${
                              active
                                ? "border-cyan-300 bg-cyan-50 shadow-[0_18px_40px_rgba(6,182,212,0.12)]"
                                : "border-white/80 bg-white/72"
                            }`}
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
                              <span
                                className="material-symbols-outlined text-3xl"
                                style={{ fontVariationSettings: `'FILL' 1` }}
                              >
                                {option.icon}
                              </span>
                            </div>
                            <span className="text-sm font-black text-slate-950">
                              {option.label}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              {option.description}
                            </span>
                          </div>
                          <div
                            className={`absolute right-3 top-3 transition-opacity ${
                              active ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xl text-cyan-700">
                              check_circle
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
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
                      Wash bay ready
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
                  {editingVehicleId ? "Lưu thay đổi" : "Thêm xe ngay"}
                </button>
              </form>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-black text-white/80">
              <span className="material-symbols-outlined text-sm">
                verified_user
              </span>
              <span>Thông tin xe được bảo mật và chỉ dùng để lên lịch hẹn.</span>
            </div>
          </div>
        </div>
      )}

      {selectedQrBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/75 bg-white/82 shadow-[0_32px_90px_rgba(2,74,138,0.18)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-cyan-100 px-6 py-5">
              <h2 className="text-xl font-black text-slate-950">
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

              <div className="mb-6 rounded-[26px] border border-cyan-100 bg-white p-4 shadow-inner">
                <img
                  alt="Mã QR lịch đặt"
                  className="h-48 w-48 object-contain"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${getBookingQrValue(
                    selectedQrBooking,
                  )}`}
                />
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
    </div>
  );
}
