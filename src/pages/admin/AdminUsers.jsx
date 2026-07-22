// src/pages/admin/AdminUsers.jsx
import { useMemo, useState, useEffect } from "react";
import {
  addAdminUserVehicle,
  createAdminUser,
  deleteAdminUserVehicle,
  getAdminUser,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserPoints,
  updateAdminUserStatus,
} from "../../services/adminUserApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";
import { normalizeAdminCustomer } from "../../utils/adminDto";
import { getVehicleModels } from "../../services/vehicleModelApi";

const getVehicleBrands = (vehicleModels) =>
  Array.from(new Set(vehicleModels.map((model) => model.brand))).sort((a, b) =>
    a.localeCompare(b),
  );

const getVehicleModelById = (vehicleModels, id) =>
  vehicleModels.find((model) => String(model.id) === String(id));

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

const TIER_STYLES = {
  PLATINUM:
    "border border-cyan-300/60 bg-cyan-300/10 text-cyan-200 platinum-glow",
  GOLD: "border border-yellow-300/60 bg-yellow-300/10 text-yellow-200",
  SILVER: "border border-zinc-700 bg-zinc-900 text-zinc-300",
  MEMBER: "border border-zinc-700 bg-zinc-900 text-zinc-300",
};

const TIER_ORDER = {
  MEMBER: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

const STATUS_STYLES = {
  ACTIVE: "border border-emerald-400/50 bg-emerald-400/10 text-emerald-300",
  INACTIVE: "border border-red-400/50 bg-red-400/10 text-red-300",
  LOCKED: "border border-red-400/50 bg-red-400/10 text-red-300",
  DISABLED: "border border-red-400/50 bg-red-400/10 text-red-300",
};

const getTierStyle = (tierLevel) =>
  TIER_STYLES[String(tierLevel || "MEMBER").toUpperCase()] ||
  TIER_STYLES.MEMBER;

const getTierRank = (tier) =>
  TIER_ORDER[String(tier || "MEMBER").toUpperCase()] ?? 99;

const getNewestValue = (item = {}) => {
  const rawDate =
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at ||
    item.registeredAt ||
    item.joinedAt;
  const parsedDate = rawDate ? new Date(rawDate).getTime() : NaN;
  if (Number.isFinite(parsedDate)) return parsedDate;
  return Number(item.id || item.userId || 0);
};

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export default function AdminUsers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [addError, setAddError] = useState("");
  const [vehicleFormTarget, setVehicleFormTarget] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ plate: "", brand: "", modelId: "" });
  const [vehicleFormError, setVehicleFormError] = useState("");
  const [vehicleModels, setVehicleModels] = useState([]);
  const [vehicleModelsLoading, setVehicleModelsLoading] = useState(false);
  const [drawerForm, setDrawerForm] = useState({ fullName: "", phone: "", rankPointsDelta: 0, redeemPointsDelta: 0 });
  const [stats, setStats] = useState({
    customers: 0,
    staff: 0,
    active: 0,
    locked: 0,
  });

  const vehicleBrands = useMemo(() => getVehicleBrands(vehicleModels), [vehicleModels]);
  const currentBrandModels = useMemo(() => {
    return vehicleModels.filter((model) => model.brand === vehicleForm.brand);
  }, [vehicleModels, vehicleForm.brand]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      setDrawerForm({
        fullName: selectedCustomer.fullName || "",
        phone: selectedCustomer.phone || "",
        rankPointsDelta: 0,
        redeemPointsDelta: 0,
      });
    }
  }, [selectedCustomer]);

  useEffect(() => {
    let isMounted = true;
    const loadVehicleModels = async () => {
      setVehicleModelsLoading(true);
      try {
        const payload = await getVehicleModels();
        const rawList = Array.isArray(payload)
          ? payload
          : payload?.vehicleModels ||
            payload?.vehicle_models ||
            payload?.models ||
            payload?.items ||
            [];
        const activeModels = rawList
          .filter((model) => model?.isActive ?? model?.is_active ?? model?.active ?? true)
          .map((model) => ({
            id: model.id,
            brand: model.brand,
            modelName: model.modelName || model.model_name || model.name,
            vehicleSize: String(
              model.vehicleSize || model.vehicle_size || "",
            ).toUpperCase(),
          }))
          .filter((model) => model.id && model.brand && model.modelName);

        if (isMounted) {
          setVehicleModels(activeModels);
        }
      } catch (err) {
        console.error("Failed to load vehicle models:", err);
      } finally {
        if (isMounted) {
          setVehicleModelsLoading(false);
        }
      }
    };
    loadVehicleModels();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers();
      const payload = res.data?.data ?? res.data;
      const customersData = Array.isArray(payload)
        ? payload
        : payload.users ||
          payload.customers ||
          payload.items ||
          payload.content ||
          [];
      applyCustomers(customersData);
    } catch (err) {
      console.error("Failed to load customers:", err);
      applyCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyCustomers = (items) => {
    const normalizedCustomers = items
      .map(normalizeAdminCustomer)
      .sort((a, b) => {
        const newestDiff = getNewestValue(b) - getNewestValue(a);
        if (newestDiff !== 0) return newestDiff;
        return String(a.name || a.fullName || "").localeCompare(
          String(b.name || b.fullName || ""),
          "vi",
        );
      });
    setCustomers(normalizedCustomers);

    const customerCount = normalizedCustomers.filter(
      (c) => (c.role || "CUSTOMER").toUpperCase() === "CUSTOMER",
    ).length;
    const staffCount = normalizedCustomers.filter(
      (c) => (c.role || "").toUpperCase() === "STAFF",
    ).length;
    const banned = normalizedCustomers.filter(
      (c) =>
        c.status === "INACTIVE" ||
        c.status === "LOCKED" ||
        c.status === "DISABLED",
    ).length;
    setStats({
      total: normalizedCustomers.length,
      customers: customerCount,
      staff: staffCount,
      banned,
    });
  };

  const fetchCustomerDetails = async (id, fallbackCustomer = null) => {
    try {
      console.log("FETCHING CUSTOMER DETAILS FOR ID:", id);
      const res = await getAdminUser(id);
      console.log("GET ADMIN USER RESPONSE:", res.data);
      setSelectedCustomer(normalizeAdminCustomer(res.data?.data ?? res.data));
      setIsDrawerOpen(true);
    } catch (err) {
      console.error("Failed to load customer details:", err, err.response?.data ?? err.message);
      if (fallbackCustomer) {
        console.warn("FALLING BACK TO CUSTOMER LIST ITEM:", fallbackCustomer);
        setSelectedCustomer(normalizeAdminCustomer(fallbackCustomer));
        setIsDrawerOpen(true);
      }
    }
  };

  const updateCustomer = async (id, data) => {
    try {
      await updateAdminUser(id, data);
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to update customer:", err);
    }
  };

  const updateCustomerPoints = async (id, rankDelta, redeemDelta) => {
    try {
      await updateAdminUserPoints(id, {
        rankPointsDelta: rankDelta,
        redeemPointsDelta: redeemDelta,
      });
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to update points:", err);
    }
  };

  const handleSaveDrawer = async () => {
    if (!selectedCustomer) return;
    
    // Tắt Drawer ngay lập tức để tạo cảm giác mượt mà
    setIsDrawerOpen(false);

    try {
      const nameChanged = drawerForm.fullName.trim() !== (selectedCustomer.fullName || "").trim();
      const phoneChanged = drawerForm.phone.trim() !== (selectedCustomer.phone || "").trim();
      
      const updatePromises = [];
      if (nameChanged || phoneChanged) {
        updatePromises.push(
          updateAdminUser(selectedCustomer.id, {
            fullName: drawerForm.fullName.trim(),
            phone: drawerForm.phone.trim(),
          })
        );
      }

      if (drawerForm.rankPointsDelta !== 0 || drawerForm.redeemPointsDelta !== 0) {
        updatePromises.push(
          updateAdminUserPoints(selectedCustomer.id, {
            rankPointsDelta: drawerForm.rankPointsDelta,
            redeemPointsDelta: drawerForm.redeemPointsDelta,
          })
        );
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
      
      fetchCustomers();
    } catch (err) {
      console.error("Failed to save drawer changes:", err);
    }
  };

  const toggleCustomerStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "LOCKED" : "ACTIVE";
      await updateAdminUserStatus(id, newStatus);
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const addCustomer = async (data) => {
    setAddError("");
    try {
      await createAdminUser(data);
      await fetchCustomers();
      setIsAddDrawerOpen(false);
    } catch (err) {
      setAddError(
        getFriendlyErrorMessage(
          err,
          "Không thể tạo user. Vui lòng thử lại sau."
        )
      );
    }
  };

  const addVehicle = async (customerId, vehicleData) => {
    try {
      console.log("ADDING VEHICLE FOR CUSTOMER:", customerId, vehicleData);
      await addAdminUserVehicle(customerId, vehicleData);
      if (selectedCustomer?.id === customerId) {
        const res = await getAdminUser(customerId);
        console.log("REFETCH CUSTOMER RESPONSE:", res.data);
        setSelectedCustomer(normalizeAdminCustomer(res.data?.data ?? res.data));
      }
      fetchCustomers();
    } catch (err) {
      console.error("Failed to add vehicle:", err, err.response?.data ?? err.message);
    }
  };

  const openVehicleForm = (customer) => {
    setVehicleFormTarget(customer);
    setVehicleForm({ plate: "", brand: "", modelId: "" });
    setVehicleFormError("");
  };

  const closeVehicleForm = () => {
    setVehicleFormTarget(null);
    setVehicleForm({ plate: "", brand: "", modelId: "" });
    setVehicleFormError("");
  };

  const submitVehicleForm = async () => {
    const rawPlate = vehicleForm.plate.trim();
    const modelId = vehicleForm.modelId;
    if (!vehicleFormTarget?.id) return;
    if (!rawPlate) {
      setVehicleFormError("Vui lòng nhập biển số xe.");
      return;
    }

    const normalizedPlate = formatVietnamLicensePlate(rawPlate);
    if (!isValidVietnamLicensePlate(normalizedPlate)) {
      setVehicleFormError("Biển số xe phải đúng dạng 59A - 123.45.");
      return;
    }

    if (!modelId) {
      setVehicleFormError("Vui lòng chọn dòng xe.");
      return;
    }

    setVehicleFormError("");
    await addVehicle(vehicleFormTarget.id, {
      licensePlate: normalizedPlate,
      vehicleModelId: Number(modelId),
    });
    closeVehicleForm();
  };

  const deleteVehicle = async (customerId, vehicleId) => {
    try {
      console.log("DELETING VEHICLE:", vehicleId, "FOR CUSTOMER:", customerId);
      await deleteAdminUserVehicle(customerId, vehicleId);
      if (selectedCustomer?.id === customerId) {
        const res = await getAdminUser(customerId);
        console.log("REFETCH CUSTOMER RESPONSE (AFTER DELETE):", res.data);
        setSelectedCustomer(normalizeAdminCustomer(res.data?.data ?? res.data));
      }
      fetchCustomers();
    } catch (err) {
      console.error("Failed to delete vehicle:", err, err.response?.data ?? err.message);
    }
  };

  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) => {
        const keyword = search.trim().toLowerCase();
        const haystack = [
          c.name,
          c.fullName,
          c.email,
          c.phone,
          c.tier,
          c.role,
          ...(c.vehicles || []).flatMap((vehicle) => [
            vehicle.plate,
            vehicle.licensePlate,
            vehicle.model,
            vehicle.brand,
          ]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchSearch = !keyword || haystack.includes(keyword);
        const matchTier =
          tierFilter === "all" ||
          String(c.tier || "").toUpperCase() === tierFilter.toUpperCase();
        const role = (c.role || "CUSTOMER").toUpperCase();
        const matchRole = roleFilter === "all" || role === roleFilter;
        return matchSearch && matchTier && matchRole;
      }),
    [customers, roleFilter, search, tierFilter]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tierFilter, roleFilter]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#05070a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.11),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(63,63,70,0.2),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>
      <div className="relative flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        {/* Header */}
        <div className="admin-reveal relative overflow-hidden border border-zinc-800 bg-zinc-950 p-5">
          <div className="admin-scanline pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-transparent via-cyan-300/12 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                  USER OPS
                </span>
                <span className="border border-zinc-800 bg-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  <span className="admin-pulse mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  HỒ SƠ TÀI KHOẢN
                </span>
              </div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
                Quản lý User
              </h1>
              <p className="mt-3 max-w-3xl font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-zinc-500">
                Quản lý customer, staff, trạng thái tài khoản và quyền vận hành.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(true)}
              className="flex h-11 items-center gap-2 border border-cyan-400/60 bg-cyan-400/10 px-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/20"
            >
              <span className="material-symbols-outlined text-sm">
                person_add
              </span>{" "}
              Thêm User
            </button>
          </div>
        </div>

        {addError && (
          <div className="admin-reveal border border-yellow-300/40 bg-yellow-300/10 p-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-yellow-200">
            {addError}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="admin-reveal border border-zinc-800 bg-zinc-950 p-5">
            <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Tổng User
            </p>
            <p className="font-mono text-[28px] font-black text-cyan-300">
              {stats.total}
            </p>
          </div>
          <div className="admin-reveal border border-zinc-800 bg-zinc-950 p-5" style={{ animationDelay: "80ms" }}>
            <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Customer
            </p>
            <p className="font-mono text-[28px] font-black text-cyan-300">
              {stats.customers}
            </p>
          </div>
          <div
            className="admin-reveal border border-zinc-800 bg-zinc-950 p-5"
            style={{ animationDelay: "80ms" }}
          >
            <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Staff
            </p>
            <p className="font-mono text-[28px] font-black text-yellow-200">
              {stats.staff}
            </p>
          </div>
          <div
            className="admin-reveal border border-zinc-800 bg-zinc-950 p-5"
            style={{ animationDelay: "160ms" }}
          >
            <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Hoạt Động (Active)
            </p>
            <p className="font-mono text-[28px] font-black text-emerald-300">
              {stats.active}
            </p>
          </div>
          <div
            className="admin-reveal border border-zinc-800 bg-zinc-950 p-5"
            style={{ animationDelay: "240ms" }}
          >
            <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Bị Khóa (Locked)
            </p>
            <p className="font-mono text-[28px] font-black text-red-400">
              {stats.locked}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className="admin-reveal flex flex-wrap items-center justify-between gap-4 border border-zinc-800 bg-zinc-950 p-4"
          style={{ animationDelay: "220ms" }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, email..."
                className="w-64 border border-zinc-800 bg-black py-2 pl-10 pr-4 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Role:
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-zinc-800 bg-black px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
              >
                <option className="bg-black text-zinc-100" value="all">
                  Tất cả
                </option>
                <option className="bg-black text-zinc-100" value="CUSTOMER">
                  Customer
                </option>
                <option className="bg-black text-zinc-100" value="STAFF">
                  Staff
                </option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Phân hạng:
              </span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="border border-zinc-800 bg-black px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
              >
                <option className="bg-black text-zinc-100" value="all">
                  Tất cả
                </option>
                <option className="bg-black text-zinc-100" value="PLATINUM">
                  Platinum
                </option>
                <option className="bg-black text-zinc-100" value="GOLD">
                  Gold
                </option>
                <option className="bg-black text-zinc-100" value="SILVER">
                  Silver
                </option>
                <option className="bg-black text-zinc-100" value="MEMBER">
                  Member
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div
          className="admin-reveal overflow-x-auto border border-zinc-800 bg-zinc-950 custom-scrollbar"
          style={{ animationDelay: "280ms" }}
        >
          <table className="w-full table-fixed border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-black shadow-[0_1px_0_0_rgba(34,211,238,0.25)] font-mono">
              <tr>
                <th className="w-12 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  ID
                </th>
                <th className="w-48 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  USER
                </th>
                <th className="w-24 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  ROLE
                </th>
                <th className="w-28 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  HẠNG THẺ
                </th>
                <th className="w-28 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  ĐIỂM HẠNG
                </th>
                <th className="w-28 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  ĐIỂM ĐỔI
                </th>
                <th className="w-16 whitespace-nowrap px-3 py-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  SỐ XE
                </th>
                <th className="w-20 whitespace-nowrap px-3 py-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  BOOKING
                </th>
                <th className="w-28 whitespace-nowrap px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  TRẠNG THÁI
                </th>
                <th className="w-24 whitespace-nowrap px-3 py-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-xs">
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-3 py-10 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-3 py-10 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer, index) => {
                  const role = (customer.role || "CUSTOMER").toUpperCase();
                  return (
                    <tr
                      key={customer.id}
                      className="admin-reveal group cursor-pointer transition duration-200 hover:translate-x-1 hover:bg-cyan-400/[0.04]"
                      style={{ animationDelay: `${260 + index * 35}ms` }}
                      onClick={() => fetchCustomerDetails(customer.id, customer)}
                    >
                      <td className="px-3 py-3 align-middle font-mono text-zinc-400">
                        {customer.id}
                      </td>
                      <td className="px-3 py-3 align-middle min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-700 bg-black font-bold text-zinc-400">
                            {customer.avatar ? (
                              <img
                                src={customer.avatar}
                                alt={customer.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              customer.fullName?.charAt(0).toUpperCase() || "U"
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-100" title={customer.fullName}>
                              {customer.fullName}
                            </p>
                            <p
                              className="truncate font-mono text-[11px] text-zinc-500"
                              title={customer.email || customer.phone || ""}
                            >
                              {customer.email || customer.phone || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                            role === "STAFF"
                              ? "border-yellow-300/50 bg-yellow-300/10 text-yellow-200"
                              : "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {role === "STAFF" ? "engineering" : "person"}
                          </span>
                          {role}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        {role === "CUSTOMER" ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase ${getTierStyle(
                              customer.tierLevel
                            )}`}
                          >
                            {customer.tierLevel || "MEMBER"}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-middle font-mono text-zinc-100">
                        {role === "CUSTOMER"
                          ? `${customer.tierPoints?.toLocaleString() || 0} pts`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 align-middle font-mono font-bold text-cyan-300">
                        {role === "CUSTOMER"
                          ? `${customer.rewardPoints?.toLocaleString() || 0} pts`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 align-middle text-center font-mono text-zinc-100">
                        {role === "CUSTOMER" ? customer.carCount ?? 0 : "-"}
                      </td>
                      <td className="px-3 py-3 align-middle text-center font-mono text-zinc-100">
                        {role === "CUSTOMER" ? customer.bookingCount ?? 0 : "-"}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span
                          className={`inline-flex min-w-[76px] items-center justify-center gap-1 whitespace-nowrap px-2 py-0.5 text-[10px] font-bold ${
                            STATUS_STYLES[customer.status] || STATUS_STYLES.ACTIVE
                          }`}
                        >
                          {customer.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle text-center">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => fetchCustomerDetails(customer.id, customer)}
                            className="flex h-7 w-7 items-center justify-center border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20"
                            title="Chỉnh sửa người dùng"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              toggleCustomerStatus(customer.id, customer.status)
                            }
                            className="flex h-7 w-7 items-center justify-center border border-red-400/40 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                            title={customer.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {customer.status === "ACTIVE" ? "block" : "undo"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
            ĐANG HIỂN THỊ{" "}
            <span className="text-zinc-100">
              {filteredCustomers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="text-zinc-100">
              {Math.min(currentPage * pageSize, filteredCustomers.length)}
            </span>{" "}
            TRONG <span className="text-zinc-100">{filteredCustomers.length}</span> NGUỜI DÙNG
          </p>

          {/* Pagination Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="h-9 border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              TRƯỚC
            </button>
            {(() => {
              const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
              const pageItems = getPageNumbers(currentPage, totalPages);

              return pageItems.map((item, idx) => {
                if (item === "...") {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="flex h-9 w-7 items-center justify-center font-mono text-xs font-bold text-zinc-600 select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = item === currentPage;

                return (
                  <button
                    key={`page-${item}`}
                    onClick={() => setCurrentPage(item)}
                    className={`h-9 min-w-9 px-2 font-mono text-xs font-black transition ${
                      isActive
                        ? "border border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        : "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {item}
                  </button>
                );
              });
            })()}
            <button
              disabled={currentPage * pageSize >= filteredCustomers.length}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="h-9 border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              SAU
            </button>
          </div>
        </div>
      </div>

      {/* Edit Customer Drawer */}
      {isDrawerOpen && selectedCustomer && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="admin-reveal fixed inset-y-0 right-0 z-50 flex w-full max-w-lg translate-x-0 transform flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300">
            <header className="flex items-center justify-between border-b border-zinc-800 bg-black p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center border border-zinc-700 bg-black">
                    <span className="material-symbols-outlined text-3xl text-zinc-500">
                      person
                    </span>
                  </div>
                  {selectedCustomer.role?.toUpperCase() === "STAFF" ? (
                    <div className="absolute -bottom-2 -right-2 font-label-caps text-[10px] px-1.5 py-0.5 tracking-tighter border border-yellow-300/60 bg-yellow-300/10 text-yellow-200">
                      STAFF
                    </div>
                  ) : (
                    <div
                      className={`absolute -bottom-2 -right-2 font-label-caps text-[10px] px-1.5 py-0.5 tracking-tighter ${getTierStyle(
                        selectedCustomer.tierLevel
                      )}`}
                    >
                      {selectedCustomer.tierLevel || "MEMBER"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                    {selectedCustomer.role?.toUpperCase() === "STAFF"
                      ? "SỬA STAFF"
                      : "SỬA CUSTOMER"}
                  </p>
                  <h1 className="font-headline-sm text-headline-sm text-zinc-100">
                    {selectedCustomer.role?.toUpperCase() === "STAFF"
                      ? "Chỉnh sửa Hồ Sơ Nhân Viên"
                      : "Chỉnh sửa Hồ Sơ Khách Hàng"}
                  </h1>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                    ID: {selectedCustomer.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-zinc-500 transition-colors hover:text-cyan-300"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              <section className="border border-zinc-800 bg-black p-4">
                <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Role
                </p>
                <span
                  className={`inline-flex items-center gap-2 border px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] ${
                    (selectedCustomer.role || "CUSTOMER").toUpperCase() ===
                    "STAFF"
                      ? "border-yellow-300/50 bg-yellow-300/10 text-yellow-200"
                      : "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {(selectedCustomer.role || "CUSTOMER").toUpperCase() ===
                    "STAFF"
                      ? "engineering"
                      : "person"}
                  </span>
                  {(selectedCustomer.role || "CUSTOMER").toUpperCase()}
                </span>
              </section>

              {/* Basic Information */}
              <section className="space-y-4">
                <h3 className="border-b border-zinc-800 pb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  {selectedCustomer.role?.toUpperCase() === "STAFF"
                    ? "THÔNG TIN NHÂN VIÊN"
                    : "THÔNG TIN CƠ BẢN"}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      {selectedCustomer.role?.toUpperCase() === "STAFF"
                        ? "TÊN NHÂN VIÊN"
                        : "TÊN KHÁCH HÀNG"}
                    </label>
                    <input
                      className="w-full border border-zinc-800 bg-black px-4 py-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                      type="text"
                      value={drawerForm.fullName}
                      onChange={(e) =>
                        setDrawerForm((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      SỐ ĐIỆN THOẠI
                    </label>
                    <input
                      className="w-full border border-zinc-800 bg-black px-4 py-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                      type="text"
                      value={drawerForm.phone}
                      onChange={(e) =>
                        setDrawerForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Points Management */}
              {(selectedCustomer.role || "CUSTOMER").toUpperCase() ===
                "CUSTOMER" && (
                <section className="border-2 border-dashed border-cyan-400/30 bg-cyan-400/10 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      loyalty
                    </span>
                    <h3 className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                      QUẢN LÝ ĐIỂM THƯỞNG
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="mb-1 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        +/- ĐIỂM XÉT HẠNG
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full border border-zinc-800 bg-black px-4 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                        value={drawerForm.rankPointsDelta || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setDrawerForm((prev) => ({
                            ...prev,
                            rankPointsDelta: val,
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        +/- ĐIỂM QUY ĐỔI
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full border border-zinc-800 bg-black px-4 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                        value={drawerForm.redeemPointsDelta || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setDrawerForm((prev) => ({
                            ...prev,
                            redeemPointsDelta: val,
                          }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border border-cyan-400/20 bg-black/40 p-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      info
                    </span>
                    <p className="text-[12px] leading-tight text-zinc-400">
                      Nhập số âm để trừ điểm. Mọi thay đổi sẽ được ghi nhật ký
                      hệ thống để kiểm toán.
                    </p>
                  </div>
                </section>
              )}

              {/* Vehicle Management */}
              {(selectedCustomer.role || "CUSTOMER").toUpperCase() ===
                "CUSTOMER" && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                    <h3 className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      QUẢN LÝ PHƯƠNG TIỆN
                    </h3>
                    <button
                      onClick={() => openVehicleForm(selectedCustomer)}
                      className="flex items-center gap-1 text-cyan-300 transition-colors hover:text-cyan-100"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add_circle
                      </span>
                      <span className="font-label-caps text-[11px]">
                        THÊM XE MỚI
                      </span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(selectedCustomer.vehicles || []).map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between border border-zinc-800 bg-black p-4 transition-colors hover:border-cyan-400/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center bg-cyan-400/10 text-cyan-300">
                            <span className="material-symbols-outlined text-[24px]">
                              directions_car
                            </span>
                          </div>
                          <div>
                            <div className="font-mono font-black text-zinc-100">
                              {formatVietnamLicensePlate(vehicle.plate)}
                            </div>
                            <div className="text-[12px] text-zinc-500">
                              {vehicle.model}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            deleteVehicle(selectedCustomer.id, vehicle.id)
                          }
                          className="flex h-8 w-8 items-center justify-center text-zinc-500 transition-all hover:bg-red-400/10 hover:text-red-300"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <footer className="grid grid-cols-2 gap-4 border-t border-zinc-800 bg-black p-6">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-full border border-zinc-800 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-600"
              >
                HỦY
              </button>
              <button
                onClick={handleSaveDrawer}
                className="w-full border border-cyan-400/60 bg-cyan-400/10 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/20"
              >
                LƯU THAY ĐỔI
              </button>
            </footer>
          </div>
        </>
      )}

      {isAddDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAddDrawerOpen(false)}
          ></div>
          <AddUserDrawer
            onClose={() => setIsAddDrawerOpen(false)}
            onCreate={addCustomer}
          />
        </>
      )}

      {vehicleFormTarget ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeVehicleForm();
          }}
        >
          <div className="w-full max-w-md border border-cyan-400/35 bg-zinc-950 p-6 shadow-2xl">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Thêm phương tiện
            </p>
            <h3 className="mt-2 text-2xl font-black text-zinc-50">
              Thêm xe cho {vehicleFormTarget.name}
            </h3>
            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Biển số xe
                </label>
                <input
                  value={vehicleForm.plate}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      plate: event.target.value,
                    }))
                  }
                  placeholder="50A123456"
                  className="h-11 w-full border border-zinc-800 bg-black px-4 font-mono text-sm font-black uppercase text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Hãng xe
                  </label>
                  <select
                    value={vehicleForm.brand}
                    onChange={(event) =>
                      setVehicleForm((prev) => ({
                        ...prev,
                        brand: event.target.value,
                        modelId: "",
                      }))
                    }
                    disabled={vehicleModelsLoading || vehicleBrands.length === 0}
                    className="h-11 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                  >
                    <option className="bg-black text-zinc-100" value="">
                      {vehicleModelsLoading ? "Đang tải..." : "Chọn hãng"}
                    </option>
                    {vehicleBrands.map((brand) => (
                      <option key={brand} className="bg-black text-zinc-100" value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Mẫu xe
                  </label>
                  <select
                    value={vehicleForm.modelId}
                    onChange={(event) =>
                      setVehicleForm((prev) => ({
                        ...prev,
                        modelId: event.target.value,
                      }))
                    }
                    disabled={!vehicleForm.brand || currentBrandModels.length === 0}
                    className="h-11 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                  >
                    <option className="bg-black text-zinc-100" value="">
                      Chọn mẫu
                    </option>
                    {currentBrandModels.map((model) => (
                      <option key={model.id} className="bg-black text-zinc-100" value={model.id}>
                        {model.modelName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {vehicleFormError ? (
              <div className="mt-4 border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200">
                {vehicleFormError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeVehicleForm}
                className="border border-zinc-700 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitVehicleForm}
                className="border border-cyan-400/60 bg-cyan-400/10 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-200 transition hover:bg-cyan-400/20"
              >
                Thêm xe
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AddUserDrawer({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "CUSTOMER",
    tierLevel: "MEMBER",
    status: "ACTIVE",
  });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!formData.fullName.trim()) {
      setError("Vui lòng nhập tên user.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(formData.email.trim())) {
      setError("Email không đúng định dạng.");
      return;
    }
    onCreate({
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    });
  };

  return (
    <div className="admin-reveal fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-black p-6">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            NEW USER
          </p>
          <h2 className="mt-1 text-headline-md text-zinc-100">Thêm User</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-zinc-500 transition hover:text-cyan-300"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <label className="block">
          <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Tên user
          </span>
          <input
            value={formData.fullName}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            className="w-full border border-zinc-800 bg-black px-4 py-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
            placeholder="Nguyễn Văn A"
          />
        </label>

        <label className="block">
          <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Số điện thoại
          </span>
          <input
            value={formData.phone}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            className="w-full border border-zinc-800 bg-black px-4 py-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
            placeholder="0900000019"
          />
        </label>

        <label className="block">
          <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Email
          </span>
          <input
            type="email"
            value={formData.email}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            className="w-full border border-zinc-800 bg-black px-4 py-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
            placeholder="user@autowash.com"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Role
            </span>
            <select
              value={formData.role}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  role: event.target.value,
                  tierLevel: event.target.value === "STAFF" ? null : "MEMBER",
                }))
              }
              className="h-12 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
            >
              <option className="bg-black text-zinc-100" value="CUSTOMER">
                CUSTOMER
              </option>
              <option className="bg-black text-zinc-100" value="STAFF">
                STAFF
              </option>
            </select>
          </label>

          {formData.role === "CUSTOMER" && (
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Hạng
              </span>
              <select
                value={formData.tierLevel}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    tierLevel: event.target.value,
                  }))
                }
                className="h-12 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
              >
                {["MEMBER", "SILVER", "GOLD", "PLATINUM"].map((tierLevel) => (
                  <option
                    key={tierLevel}
                    className="bg-black text-zinc-100"
                    value={tierLevel}
                  >
                    {tierLevel}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Trạng thái
            </span>
            <select
              value={formData.status}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="h-12 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
            >
              <option className="bg-black text-zinc-100" value="ACTIVE">
                ACTIVE
              </option>
              <option className="bg-black text-zinc-100" value="LOCKED">
                LOCKED
              </option>
            </select>
          </label>
        </div>

        {error && (
          <div className="border border-red-400/40 bg-red-400/10 p-3 font-mono text-xs font-black uppercase tracking-[0.14em] text-red-300">
            {error}
          </div>
        )}
      </div>

      <footer className="grid grid-cols-2 gap-4 border-t border-zinc-800 bg-black p-6">
        <button
          type="button"
          onClick={onClose}
          className="border border-zinc-800 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-600"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="border border-cyan-400/60 bg-cyan-400/10 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/20"
        >
          Tạo user
        </button>
      </footer>
    </div>
  );
}
