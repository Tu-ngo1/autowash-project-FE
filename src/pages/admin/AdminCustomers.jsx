// src/pages/admin/AdminCustomers.jsx
import { useState, useEffect } from "react";
import {
  addAdminCustomerVehicle,
  deleteAdminCustomerVehicle,
  getAdminCustomer,
  getAdminCustomers,
  updateAdminCustomer,
  updateAdminCustomerPoints,
  updateAdminCustomerStatus,
} from "../../services/userApi";

const TIER_STYLES = {
  Platinum: "bg-primary/10 border border-primary text-primary platinum-glow",
  Gold: "bg-tertiary-container/20 border border-tertiary-container text-tertiary-container",
  Silver:
    "bg-outline-variant/20 border border-outline-variant text-on-surface-variant",
  Member:
    "bg-outline-variant/20 border border-outline-variant text-on-surface-variant",
};

const STATUS_STYLES = {
  ACTIVE: "bg-secondary/10 border border-secondary/30 text-secondary",
  BANNED: "bg-error/10 border border-error/30 text-error",
  INACTIVE: "bg-error/10 border border-error/30 text-error",
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0 });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getAdminCustomers();
      const customersData = res.data.customers || res.data || [];
      setCustomers(customersData);

      const active = customersData.filter((c) => c.status === "ACTIVE").length;
      const banned = customersData.filter(
        (c) => c.status === "BANNED" || c.status === "INACTIVE",
      ).length;
      setStats({ total: customersData.length, active, banned });
    } catch (err) {
      console.error("Failed to load customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (id) => {
    try {
      const res = await getAdminCustomer(id);
      setSelectedCustomer(res.data);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error("Failed to load customer details:", err);
    }
  };

  const updateCustomer = async (id, data) => {
    try {
      await updateAdminCustomer(id, data);
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to update customer:", err);
    }
  };

  const updateCustomerPoints = async (id, rankDelta, redeemDelta) => {
    try {
      await updateAdminCustomerPoints(id, {
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
      const newStatus = currentStatus === "ACTIVE" ? "BANNED" : "ACTIVE";
      await updateAdminCustomerStatus(id, newStatus);
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const addVehicle = async (customerId, vehicleData) => {
    try {
      await addAdminCustomerVehicle(customerId, vehicleData);
      await fetchCustomers();
      if (selectedCustomer?.id === customerId) {
        const res = await getAdminCustomer(customerId);
        setSelectedCustomer(res.data);
      }
    } catch (err) {
      console.error("Failed to add vehicle:", err);
    }
  };

  const deleteVehicle = async (customerId, vehicleId) => {
    try {
      await deleteAdminCustomerVehicle(customerId, vehicleId);
      await fetchCustomers();
      if (selectedCustomer?.id === customerId) {
        const res = await getAdminCustomer(customerId);
        setSelectedCustomer(res.data);
      }
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchTier = tierFilter === "all" || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline-lg text-on-surface">
              Quản lý Khách Hàng & Tài Sản Số
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Quản lý thông tin khách hàng, điểm thưởng và phương tiện
            </p>
          </div>
          <button className="bg-primary text-background px-4 py-2 font-label-caps uppercase text-[11px] font-bold hover:brightness-110 transition-all active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              person_add
            </span>{" "}
            Thêm Khách Hàng
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-low border border-outline-variant p-5">
            <p className="font-label-caps text-on-surface-variant text-[10px] uppercase mb-2">
              Tổng Khách Hàng
            </p>
            <p className="font-data-display text-[28px] text-primary">
              {stats.total}
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-5">
            <p className="font-label-caps text-on-surface-variant text-[10px] uppercase mb-2">
              Tài khoản Active
            </p>
            <p className="font-data-display text-[28px] text-secondary">
              {stats.active}
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-5">
            <p className="font-label-caps text-on-surface-variant text-[10px] uppercase mb-2">
              Tài khoản bị Ban
            </p>
            <p className="font-data-display text-[28px] text-error">
              {stats.banned}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-sm">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, SĐT..."
                className="bg-surface-container-low border border-outline-variant pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] text-on-surface-variant uppercase">
                Phân hạng:
              </span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-surface-container-low border border-outline-variant px-3 py-1 focus:border-primary focus:outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-surface-container-low border border-outline-variant overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-highest">
              <tr>
                <th className="px-6 py-4 font-label-caps text-[11px] text-on-surface-variant uppercase border-b border-outline-variant">
                  Khách Hàng
                </th>
                <th className="px-6 py-4 font-label-caps text-[11px] text-on-surface-variant uppercase border-b border-outline-variant">
                  Số Lượng Xe
                </th>
                <th className="px-6 py-4 font-label-caps text-[11px] text-on-surface-variant uppercase border-b border-outline-variant">
                  Hạng Thẻ
                </th>
                <th className="px-6 py-4 font-label-caps text-[11px] text-on-surface-variant uppercase border-b border-outline-variant">
                  Điểm Xét Hạng
                </th>
                <th className="px-6 py-4 font-label-caps text-[11px] text-on-surface-variant uppercase border-b border-outline-variant">
                  Điểm Quy Đổi
                </th>
                <th className="px-6 py-4 font-label-caps text-[11px] text-on-surface-variant uppercase border-b border-outline-variant">
                  Trạng thái
                </th>
                <th className="px-6 py-4 font-label-caps text-[11px] text-on-surface-variant uppercase border-b border-outline-variant text-right">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-on-surface-variant"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-on-surface-variant"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-surface-container-high transition-colors group cursor-pointer"
                    onClick={() => fetchCustomerDetails(customer.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center font-bold text-on-surface-variant">
                          {customer.avatar ? (
                            <img
                              src={customer.avatar}
                              alt={customer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            customer.name?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <p className="text-on-surface font-bold">
                            {customer.name}
                          </p>
                          <p className="text-[12px] text-on-surface-variant font-data-display">
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-container-highest border border-outline-variant text-[12px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">
                          directions_car
                        </span>{" "}
                        {customer.vehicleCount ||
                          customer.vehicles?.length ||
                          0}{" "}
                        xe
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-[10px] font-bold uppercase ${TIER_STYLES[customer.tier] || TIER_STYLES.Member}`}
                      >
                        {customer.tier || "Member"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-data-display text-on-surface">
                      {customer.rankPoints?.toLocaleString() || 0} pts
                    </td>
                    <td className="px-6 py-4 font-data-display text-primary font-bold">
                      {customer.redeemPoints?.toLocaleString() || 0} pts
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[customer.status] || STATUS_STYLES.ACTIVE}`}
                      >
                        {customer.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => fetchCustomerDetails(customer.id)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all rounded-sm"
                        >
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            toggleCustomerStatus(customer.id, customer.status)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-error/20 hover:text-error transition-all rounded-sm"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {customer.status === "ACTIVE" ? "block" : "undo"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant text-[12px]">
            Đang hiển thị{" "}
            <span className="text-on-surface font-bold">
              {filteredCustomers.length}
            </span>{" "}
            trong số{" "}
            <span className="text-on-surface font-bold">
              {customers.length}
            </span>{" "}
            khách hàng
          </p>
          <span className="text-on-surface-variant text-[12px]">
            Tổng: {customers.length}
          </span>
        </div>
      </div>

      {/* Edit Customer Drawer */}
      {isDrawerOpen && selectedCustomer && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface-container border-l border-outline-variant z-50 flex flex-col shadow-2xl transition-transform duration-300 transform translate-x-0">
            <header className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-3xl">
                      person
                    </span>
                  </div>
                  <div
                    className={`absolute -bottom-2 -right-2 font-label-caps text-[10px] px-1.5 py-0.5 tracking-tighter ${TIER_STYLES[selectedCustomer.tier] || TIER_STYLES.Member}`}
                  >
                    {selectedCustomer.tier || "Member"}
                  </div>
                </div>
                <div>
                  <h1 className="font-headline-sm text-headline-sm text-on-surface">
                    Chỉnh sửa Hồ Sơ Khách Hàng
                  </h1>
                  <p className="font-label-caps text-label-caps text-primary uppercase">
                    ID: {selectedCustomer.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Basic Information */}
              <section className="space-y-4">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant pb-2">
                  THÔNG TIN CƠ BẢN
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                      TÊN KHÁCH HÀNG
                    </label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface px-4 py-3 outline-none"
                      type="text"
                      defaultValue={selectedCustomer.name}
                      onBlur={(e) =>
                        updateCustomer(selectedCustomer.id, {
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                      SỐ ĐIỆN THOẠI
                    </label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-on-surface px-4 py-3 outline-none"
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
              <section className="p-5 border-2 border-dashed border-outline-variant bg-surface-container-high">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    loyalty
                  </span>
                  <h3 className="font-label-caps text-label-caps text-primary">
                    QUẢN LÝ ĐIỂM THƯỞNG
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-label-caps text-[10px] text-on-surface-variant mb-1">
                      +/- ĐIỂM XÉT HẠNG
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-0 text-on-surface font-data-display px-4 py-2 outline-none"
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (value !== 0)
                          updateCustomerPoints(selectedCustomer.id, value, 0);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-[10px] text-on-surface-variant mb-1">
                      +/- ĐIỂM QUY ĐỔI
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-0 text-on-surface font-data-display px-4 py-2 outline-none"
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (value !== 0)
                          updateCustomerPoints(selectedCustomer.id, 0, value);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-3 items-start p-3 bg-primary/5 border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    info
                  </span>
                  <p className="text-[12px] text-on-surface-variant leading-tight">
                    Nhập số âm để trừ điểm. Mọi thay đổi sẽ được ghi nhật ký hệ
                    thống để kiểm toán.
                  </p>
                </div>
              </section>

              {/* Vehicle Management */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                    QUẢN LÝ PHƯƠNG TIỆN
                  </h3>
                  <button
                    onClick={() => {
                      const plate = prompt("Nhập biển số xe:");
                      const model = prompt("Nhập model xe:");
                      if (plate)
                        addVehicle(selectedCustomer.id, { plate, model });
                    }}
                    className="flex items-center gap-1 text-primary hover:text-primary-container transition-colors"
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
                      className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-surface-container-highest text-primary">
                          <span className="material-symbols-outlined text-[24px]">
                            directions_car
                          </span>
                        </div>
                        <div>
                          <div className="font-data-display text-on-surface">
                            {vehicle.plate}
                          </div>
                          <div className="text-[12px] text-on-surface-variant">
                            {vehicle.model}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          deleteVehicle(selectedCustomer.id, vehicle.id)
                        }
                        className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <footer className="p-6 border-t border-outline-variant bg-surface-container-lowest grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-3 font-label-caps text-label-caps border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
              >
                HỦY
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-3 font-label-caps text-label-caps bg-primary text-on-primary hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
              >
                LƯU THAY ĐỔI
              </button>
            </footer>
          </div>
        </>
      )}
    </div>
  );
}
