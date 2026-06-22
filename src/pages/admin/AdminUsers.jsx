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

const TIER_STYLES = {
  PLATINUM:
    "border border-cyan-300/60 bg-cyan-300/10 text-cyan-200 platinum-glow",
  GOLD: "border border-yellow-300/60 bg-yellow-300/10 text-yellow-200",
  SILVER: "border border-zinc-700 bg-zinc-900 text-zinc-300",
  MEMBER: "border border-zinc-700 bg-zinc-900 text-zinc-300",
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

export default function AdminUsers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [addError, setAddError] = useState("");
  const [stats, setStats] = useState({
    customers: 0,
    staff: 0,
    active: 0,
    locked: 0,
  });

  useEffect(() => {
    fetchCustomers();
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
    const normalizedCustomers = items.map(normalizeAdminCustomer);
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

  const fetchCustomerDetails = async (id) => {
    try {
      const res = await getAdminUser(id);
      setSelectedCustomer(normalizeAdminCustomer(res.data?.data ?? res.data));
      setIsDrawerOpen(true);
    } catch (err) {
      console.error("Failed to load customer details:", err);
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
      await addAdminUserVehicle(customerId, vehicleData);
      await fetchCustomers();
      if (selectedCustomer?.id === customerId) {
        const res = await getAdminUser(customerId);
        setSelectedCustomer(normalizeAdminCustomer(res.data?.data ?? res.data));
      }
    } catch (err) {
      console.error("Failed to add vehicle:", err);
    }
  };

  const deleteVehicle = async (customerId, vehicleId) => {
    try {
      await deleteAdminUserVehicle(customerId, vehicleId);
      await fetchCustomers();
      if (selectedCustomer?.id === customerId) {
        const res = await getAdminUser(customerId);
        setSelectedCustomer(normalizeAdminCustomer(res.data?.data ?? res.data));
      }
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
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
    [customers, roleFilter, search, tierFilter],
  );

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
                  IDENTITY LEDGER
                </span>
              </div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
                User Control
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
              Customers
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
          className="admin-reveal overflow-x-auto border border-zinc-800 bg-zinc-950"
          style={{ animationDelay: "280ms" }}
        >
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-black">
              <tr>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  ID
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  User
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Role
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Hạng Thẻ
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Điểm Xét Hạng
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Điểm Quy Đổi
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Số Xe
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Booking
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Trạng thái
                </th>
                <th className="border-b border-zinc-800 px-6 py-4 text-right font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-12 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-12 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const role = (customer.role || "CUSTOMER").toUpperCase();
                  return (
                    <tr
                      key={customer.id}
                      className="admin-reveal group cursor-pointer transition duration-200 hover:translate-x-1 hover:bg-cyan-400/[0.04]"
                      style={{ animationDelay: `${340 + index * 45}ms` }}
                      onClick={() => fetchCustomerDetails(customer.id)}
                    >
                      <td className="px-6 py-4 font-mono text-zinc-400">
                        {customer.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center border border-zinc-700 bg-black font-bold text-zinc-400">
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
                          <div>
                            <p className="font-bold text-zinc-100">
                              {customer.fullName}
                            </p>
                            <p className="font-mono text-[12px] text-zinc-500">
                              {customer.email || customer.phone || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                            role === "STAFF"
                              ? "border-yellow-300/50 bg-yellow-300/10 text-yellow-200"
                              : "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {role === "STAFF" ? "engineering" : "person"}
                          </span>
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {role === "CUSTOMER" ? (
                          <span
                            className={`inline-block px-3 py-1 text-[10px] font-bold uppercase ${getTierStyle(
                              customer.tierLevel
                            )}`}
                          >
                            {customer.tierLevel || "MEMBER"}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-100">
                        {role === "CUSTOMER"
                          ? `${customer.tierPoints?.toLocaleString() || 0} pts`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-cyan-300">
                        {role === "CUSTOMER"
                          ? `${
                              customer.rewardPoints?.toLocaleString() || 0
                            } pts`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-100">
                        {role === "CUSTOMER" ? customer.carCount ?? 0 : "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-100">
                        {role === "CUSTOMER" ? customer.bookingCount ?? 0 : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold ${
                            STATUS_STYLES[customer.status] ||
                            STATUS_STYLES.ACTIVE
                          }`}
                        >
                          {customer.status === "ACTIVE"
                            ? "Hoạt động"
                            : "Bị khóa"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => fetchCustomerDetails(customer.id)}
                            className="flex h-8 w-8 items-center justify-center border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20"
                          >
                            <span className="material-symbols-outlined text-sm">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              toggleCustomerStatus(customer.id, customer.status)
                            }
                            className="flex h-8 w-8 items-center justify-center border border-red-400/40 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                          >
                            <span className="material-symbols-outlined text-sm">
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
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Đang hiển thị{" "}
            <span className="font-bold text-zinc-100">
              {filteredCustomers.length}
            </span>{" "}
            trong số{" "}
            <span className="font-bold text-zinc-100">{customers.length}</span>{" "}
            người dùng
          </p>
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Tổng: {customers.length}
          </span>
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
                      ? "EDIT STAFF"
                      : "EDIT CUSTOMER"}
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
                      defaultValue={selectedCustomer.fullName}
                      onBlur={(e) =>
                        updateCustomer(selectedCustomer.id, {
                          fullName: e.target.value,
                        })
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
                      defaultValue={selectedCustomer.phone}
                      onBlur={(e) =>
                        updateCustomer(selectedCustomer.id, {
                          phone: e.target.value,
                        })
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
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value !== 0)
                            updateCustomerPoints(selectedCustomer.id, value, 0);
                          e.target.value = "";
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
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value !== 0)
                            updateCustomerPoints(selectedCustomer.id, 0, value);
                          e.target.value = "";
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
                      onClick={() => {
                        const plate = prompt("Nhập biển số xe:");
                        const model = prompt("Nhập model xe:");
                        if (plate)
                          addVehicle(selectedCustomer.id, { plate, model });
                      }}
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
                              {vehicle.plate}
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
                onClick={() => setIsDrawerOpen(false)}
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
