import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import { getUser, updateUser } from "../../utils/auth";
import { getMyBookings } from "../../services/bookingApi";
import { getProfile } from "../../services/userApi";
import { getMyLoyalty } from "../../services/loyaltyApi";

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

export default function ProfilePage() {
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
    type: "ice",
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
          getProfile().catch(() => null),
          getMyBookings().catch(() => null),
          getMyLoyalty().catch(() => null),
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
      setVehicleForm({ plate: "", type: "ice" });
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
    setVehicleForm({ plate: "", type: "ice" });
    setVehicleError("");
    setShowVehicleForm(true);
  };

  const openEditVehicleForm = (vehicle) => {
    setEditingVehicleId(vehicle.id || vehicle.plate);
    setVehicleReturnTo("");
    setVehicleForm({
      plate: vehicle.plate || "",
      type:
        vehicle.type === "Electric" || vehicle.type === "Xe điện"
          ? "electric"
          : "ice",
    });
    setVehicleError("");
    setShowVehicleForm(true);
  };

  const closeVehicleForm = () => {
    setShowVehicleForm(false);
    setEditingVehicleId(null);
    setVehicleReturnTo("");
    setVehicleForm({ plate: "", type: "ice" });
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

    const typeLabel = vehicleForm.type === "electric" ? "Xe điện" : "Xe xăng/dầu";
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
                type: typeLabel,
              }
            : vehicle,
        )
      : [
          ...profile.vehicles,
          {
            id: `vehicle-${Date.now()}`,
            name: typeLabel,
            plate: normalizedPlate,
            type: typeLabel,
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
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-[#191c1e]">
      <UserNavbar active="Profile" />

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-12 xl:px-14">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <div className="flex flex-col items-center rounded-3xl border border-[#bfc7d5]/30 bg-white/80 p-8 text-center shadow-[0_4px_20px_rgba(13,153,255,0.05)] backdrop-blur-xl">
              <div className="relative mb-4">
                <img
                  src={
                    avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile.name || "Khách hàng",
                    )}&background=0D4F92&color=ffffff&bold=true`
                  }
                  alt={`${profile.name || "Khách hàng"} avatar`}
                  className="h-32 w-32 rounded-full border-4 border-[#d2e4ff] object-cover shadow-md"
                />
                <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white bg-emerald-500"></div>
              </div>
              <h1 className="mb-1 text-2xl font-semibold text-[#191c1e]">
                {profile.name}
              </h1>
              <p className="mb-4 text-[#3f4753]">
                Thành viên từ tháng 10, 2023
              </p>
              <div className="flex items-center gap-2 rounded-full bg-[#a5eeff] px-4 py-1.5 text-xs font-semibold text-[#001f25]">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: `'FILL' 1` }}
                >
                  star
                </span>
                    {profile.membership || "Chưa có hạng"}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-[#0061a5] p-8 text-white shadow-xl">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#0d99ff]/20 blur-3xl" />
              <div className="relative z-10">
                <p className="font-label-sm text-label-sm opacity-80 mb-4 uppercase tracking-[0.24em]">
                  Điểm thưởng hiện tại
                </p>
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="bg-white/10 rounded-3xl p-4">
                    <p className="text-xs opacity-70 mb-1">Điểm quy đổi</p>
                    <p className="text-2xl font-bold">
                      {(profile.points || 0).toLocaleString("vi-VN")}
                    </p>
                    <p className="text-[10px] opacity-60 mt-2">
                      Hết hạn sau 1 tháng. Dùng đổi Voucher
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-3xl p-4">
                    <p className="text-xs opacity-70 mb-1">Điểm xét hạng</p>
                    <p className="text-2xl font-bold">
                      {(profile.rankPoints || 0).toLocaleString("vi-VN")}
                    </p>
                    <p className="text-[10px] opacity-60 mt-2">
                      Hết hạn sau 3 tháng. Dùng thăng hạng
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-label-sm font-label-sm">
                    <span>Tiến trình nâng hạng tiếp theo</span>
                    <span>{profile.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00e0ff]"
                      style={{ width: `${profile.progress}%` }}
                    />
                  </div>
                  <p className="text-xs opacity-70 italic text-right">
                    {profile.nextTierTarget > profile.rankPoints
                      ? `Còn ${(
                          profile.nextTierTarget - profile.rankPoints
                        ).toLocaleString("vi-VN")} điểm để lên hạng tiếp theo`
                      : "Chưa có dữ liệu mục tiêu nâng hạng"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <section>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#191c1e]">
                    Phương tiện của bạn
                  </h2>
                  <p className="text-base text-[#3f4753]">
                    Quản lý danh sách xe cá nhân đã đăng ký
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddVehicleForm}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#0061a5] px-4 py-2 font-bold text-white transition-colors hover:bg-[#005bbf]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    add_circle
                  </span>
                  Thêm xe mới
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {profile.vehicles.length === 0 ? (
                  <div className="col-span-full rounded-3xl border border-dashed border-[#bfc7d5] bg-white/80 p-8 text-center text-sm text-[#3f4753]">
                    Chưa có phương tiện nào.
                  </div>
                ) : (
                  profile.vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id || vehicle.plate}
                    className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-[#bfc7d5]/30 bg-white/80 p-6 shadow-[0_4px_20px_rgba(13,153,255,0.05)] backdrop-blur-xl transition-all hover:shadow-md"
                  >
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#e0f2fe]">
                      <span className="material-symbols-outlined text-[32px] text-[#0061a5]">
                        {vehicle.type === "Electric" || vehicle.type === "Xe điện"
                          ? "electric_car"
                          : "directions_car"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-grow">
                      <h3 className="truncate font-bold text-[#191c1e]">
                        {vehicle.name || vehicle.label || vehicle.type}
                      </h3>
                      <p className="text-xs font-semibold text-[#3f4753]">
                        Biển số: {vehicle.plate}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded bg-[#a5eeff]/50 px-2 py-0.5 text-[10px] font-semibold text-[#001f25]">
                          {vehicle.type || "Xe cá nhân"}
                        </span>
                        {vehicle.default && (
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                            Mặc định
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditVehicleForm(vehicle)}
                      className="text-[#3f4753] transition-colors hover:text-[#0061a5]"
                      aria-label="Sửa xe"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-[#191c1e]">
                    Voucher của bạn
                  </h2>
                  <p className="text-base text-[#3f4753]">
                    Đổi điểm để nhận ưu đãi chăm sóc xe
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/rewards")}
                  className="font-bold text-[#0061a5] hover:underline"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vouchers.length === 0 ? (
                  <div className="col-span-full rounded-3xl border border-dashed border-[#bfc7d5] bg-white/80 p-8 text-center text-sm text-[#3f4753]">
                    Chưa có voucher nào.
                  </div>
                ) : (
                  vouchers.map((voucher) => (
                  <div
                    key={voucher.id || voucher.voucherId || voucher.code || voucher.name}
                    className="group flex items-center gap-4 rounded-3xl border border-[#bfc7d5]/30 bg-white/80 p-6 shadow-[0_4px_20px_rgba(13,153,255,0.05)] backdrop-blur-xl transition-all hover:shadow-lg"
                  >
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl bg-[#e0f2fe]">
                      <span className="material-symbols-outlined text-[32px] text-[#0061a5]">
                        {voucher.icon || "redeem"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#191c1e]">
                        {voucher.name || voucher.title || "Voucher"}
                      </h3>
                      <p className="mt-2 text-xs font-semibold text-[#3f4753]">
                        {voucher.description || voucher.desc || ""}
                      </p>
                      <p className="mt-2 text-xs font-bold text-[#0061a5]">
                        {(
                          voucher.pointCost ??
                          voucher.pointsCost ??
                          voucher.points ??
                          0
                        ).toLocaleString("vi-VN")}{" "}
                        điểm
                      </p>
                    </div>
                    <button className="rounded-2xl bg-[#0061a5] p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="material-symbols-outlined">redeem</span>
                    </button>
                  </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between mb-6">
                <h2 className="text-2xl font-semibold text-[#191c1e]">
                  Lịch sử rửa xe
                </h2>
                <button className="flex items-center gap-2 text-[#3f4753] transition-colors hover:text-[#0061a5]">
                  <span className="material-symbols-outlined">filter_list</span>
                  Lọc
                </button>
              </div>
              <div className="overflow-hidden rounded-3xl border border-[#bfc7d5]/20 bg-white shadow-[0_4px_20px_rgba(13,153,255,0.05)]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#bfc7d5]/30 bg-[#f2f4f6]">
                      <th className="px-6 py-4 text-xs font-semibold text-[#3f4753]">
                        DỊCH VỤ / MÃ
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#3f4753]">
                        NGÀY THỰC HIỆN
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#3f4753]">
                        TRẠNG THÁI
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#3f4753]">
                        TỔNG TIỀN
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#3f4753]">
                        MÃ QR
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#bfc7d5]/20">
                    {recentBookings.length === 0 ? (
                      <tr>
                        <td
                          className="px-6 py-8 text-center text-slate-500"
                          colSpan={5}
                        >
                          Chưa có lịch sử rửa xe.
                        </td>
                      </tr>
                    ) : (
                      recentBookings.map(
                        (
                          item,
                          index, // 🔴 Đã bổ sung index làm phương án dự phòng cho key
                        ) => (
                          <tr
                            key={item.id || index}
                            className="transition-colors hover:bg-[#eceef0]/30"
                          >
                            <td className="px-6 py-4">
                              <div className="font-bold text-[#191c1e]">
                                {item.service || item.serviceName || "-"}
                              </div>
                              <div className="text-xs text-[#3f4753]">
                                {item.id || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[#3f4753]">
                              {item.date || "--/--/----"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles[item.status] || "bg-[#0061a5]/10 text-[#0061a5]"}`}
                              >
                                {item.status || "Chờ thực hiện"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-[#0061a5]">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedQrBooking(item)}
                                className="rounded-lg bg-[#0061a5] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#005bbf]"
                              >
                                Xem mã QR
                              </button>
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="rounded-full border border-[#0061a5] px-8 py-2 font-bold text-[#0061a5] transition-colors hover:bg-[#e0f2fe]"
                >
                  Xem tất cả lịch sử
                </button>
              </div>
            </section>
          </div>
        </section>
      </main>

      {showVehicleForm && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f7f9fb]/95 px-4 py-5 backdrop-blur-sm sm:py-8">
          <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col gap-5">
            <button
              type="button"
              onClick={handleVehicleFormBack}
              className="group sticky top-3 z-10 inline-flex w-fit items-center gap-2 rounded-full bg-[#f7f9fb]/95 px-3 py-2 text-xs font-semibold text-[#0061a5] shadow-sm ring-1 ring-[#0061a5]/10 backdrop-blur transition-all hover:text-[#005bbf]"
            >
              <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">
                arrow_back
              </span>
              {vehicleReturnTo ? "Quay lại đặt lịch" : "Quay lại Profile"}
            </button>

            <div className="rounded-xl border border-[#0d99ff]/10 bg-white/80 p-8 shadow-[0px_4px_20px_rgba(13,153,255,0.05)] backdrop-blur-xl">
              <h1 className="mb-8 text-[40px] font-bold leading-[48px] text-[#191c1e]">
                {editingVehicleId ? "Chỉnh sửa phương tiện" : "Thêm phương tiện mới"}
              </h1>

              <form className="flex flex-col gap-10" onSubmit={handleSaveVehicle}>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-semibold text-[#3f4753]"
                    htmlFor="vehicle-plate"
                  >
                    Biển số xe
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707884]">
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
                      className="h-14 w-full rounded-lg border border-[#bfc7d5]/50 bg-[#f7f9fb] pl-12 pr-4 text-base uppercase outline-none transition-all focus:border-[#0061a5] focus:ring-2 focus:ring-[#0061a5]/20"
                    />
                  </div>
                  {vehicleError && (
                    <p className="text-sm font-semibold text-rose-600">
                      {vehicleError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <span className="text-xs font-semibold text-[#3f4753]">
                    Loại xe
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        value: "electric",
                        label: "Xe điện",
                        icon: "bolt",
                      },
                      {
                        value: "ice",
                        label: "Xe xăng/dầu",
                        icon: "local_gas_station",
                      },
                    ].map((option) => {
                      const active = vehicleForm.type === option.value;
                      return (
                        <label key={option.value} className="relative cursor-pointer">
                          <input
                            className="sr-only"
                            name="vehicle_type"
                            type="radio"
                            value={option.value}
                            checked={active}
                            onChange={() =>
                              handleVehicleFieldChange("type", option.value)
                            }
                          />
                          <div
                            className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 p-6 transition-all duration-300 hover:bg-[#e0f2fe]/30 ${
                              active
                                ? "border-[#0061a5] bg-[#e0f2fe]"
                                : "border-[#bfc7d5]/50 bg-[#f7f9fb]"
                            }`}
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e0e3e5]">
                              <span
                                className="material-symbols-outlined text-3xl text-[#0061a5]"
                                style={{ fontVariationSettings: `'FILL' 1` }}
                              >
                                {option.icon}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-[#191c1e]">
                              {option.label}
                            </span>
                          </div>
                          <div
                            className={`absolute right-3 top-3 transition-opacity ${
                              active ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xl text-[#0061a5]">
                              check_circle
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="group relative mt-2 h-48 w-full overflow-hidden rounded-xl">
                  <img
                    alt="Automotive design details"
                    className="h-full w-full object-cover opacity-20 grayscale transition-all duration-700 group-hover:opacity-40 group-hover:grayscale-0"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM_B3C9XEVYqf0IO-hhVDkcRXt1n5lCDklqGeC2N_f617m2BtDfMDE1815k4JhSrRI96NznAODxe-pBkrTRSoh2iaq7LdjWBRyAbx7CNbJ_3rpdlnUC5oXEDSawnTQAe4LdzIOV8cz55brWW3jdPNxAgr7hom7_JWCcvOsvoXKG7saI01kNDO29z4GTX8y7OK2hXv9AVPAtwgZtIAfZcnBLTgN3yLKyQ1zbQ-RL0mR2SXlq1QmiYcx7rBUQ2k1-NdlEadAoENpnNU"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
                </div>

                <button
                  className="h-14 w-full rounded-lg bg-[#0061a5] font-bold text-white shadow-lg shadow-[#0061a5]/20 transition-all duration-200 hover:bg-[#005bbf] active:scale-[0.98]"
                  type="submit"
                >
                  {editingVehicleId ? "Lưu thay đổi" : "Thêm xe ngay"}
                </button>
              </form>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#707884] opacity-60">
              <span className="material-symbols-outlined text-sm">
                verified_user
              </span>
              <span>Thông tin xe được bảo mật và chỉ dùng để lên lịch hẹn.</span>
            </div>
          </div>
        </div>
      )}

      {selectedQrBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#bfc7d5]/30 px-6 py-5">
              <h2 className="text-xl font-bold text-[#191c1e]">
                Mã QR lịch đặt
              </h2>
              <button
                type="button"
                onClick={() => setSelectedQrBooking(null)}
                className="text-[#3f4753] transition-colors hover:text-[#191c1e]"
                aria-label="Đóng mã QR"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center p-6">
              <div className="mb-6 w-full space-y-3">
                <div className="flex justify-between border-b border-[#bfc7d5]/30 pb-2 text-sm">
                  <span className="text-[#3f4753]">Biển số xe</span>
                  <span className="font-bold text-[#191c1e]">
                    {selectedQrBooking.plate || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#bfc7d5]/30 pb-2 text-sm">
                  <span className="text-[#3f4753]">Dịch vụ</span>
                  <span className="text-right font-bold text-[#191c1e]">
                    {selectedQrBooking.service ||
                      selectedQrBooking.serviceName ||
                      "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#bfc7d5]/30 pb-2 text-sm">
                  <span className="text-[#3f4753]">Thời gian</span>
                  <span className="font-bold text-[#191c1e]">
                    {selectedQrBooking.time || "--:--"},{" "}
                    {selectedQrBooking.date || "--/--/----"}
                  </span>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-[#bfc7d5]/30 bg-white p-4 shadow-inner">
                <img
                  alt="Mã QR lịch đặt"
                  className="h-48 w-48 object-contain"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${getBookingQrValue(
                    selectedQrBooking,
                  )}`}
                />
              </div>

              <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-600">
                Dùng mã này để quét và tra cứu lịch đặt
              </div>

              <button
                type="button"
                onClick={() => setSelectedQrBooking(null)}
                className="mt-8 w-full rounded-xl bg-[#0061a5] py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#005bbf]"
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
