// src/pages/admin/AdminPromotions.jsx
import { useState, useEffect } from "react";
import {
  createVoucher as createVoucherApi,
  deleteVoucher as deleteVoucherApi,
  getTiers,
  getVouchers,
  updateTier as updateTierApi,
  updateVoucher as updateVoucherApi,
  updateVoucherStatus as updateVoucherStatusApi,
} from "../../services/promotionApi";

export default function AdminPromotions() {
  const [tiers, setTiers] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchTiers();
    fetchVouchers();
  }, []);

  const fetchTiers = async () => {
    try {
      const res = await getTiers();
      const payload = res.data?.data ?? res.data;
      setTiers(Array.isArray(payload) ? payload : payload?.tiers || []);
    } catch {
      setTiers([]);
    }
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await getVouchers();
      const payload = res.data?.data ?? res.data;
      setVouchers(Array.isArray(payload) ? payload : payload?.vouchers || []);
    } catch {
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (tierId, data) => {
    try {
      await updateTierApi(tierId, data);
      fetchTiers();
    } catch (err) {
      console.error("Failed to update tier:", err);
    }
  };

  const updateVoucherStatus = async (voucherId, isActive) => {
    try {
      await updateVoucherStatusApi(voucherId, isActive);
      fetchVouchers();
    } catch (err) {
      console.error("Failed to update voucher status:", err);
    }
  };

  const deleteVoucher = async (voucherId) => {
    if (window.confirm("Bạn có chắc muốn xóa voucher này?")) {
      try {
        await deleteVoucherApi(voucherId);
        fetchVouchers();
      } catch (err) {
        console.error("Failed to delete voucher:", err);
      }
    }
  };

  const createVoucher = async (data) => {
    try {
      await createVoucherApi(data);
      fetchVouchers();
      setIsAddDrawerOpen(false);
    } catch (err) {
      console.error("Failed to create voucher:", err);
    }
  };

  const updateVoucher = async (voucherId, data) => {
    try {
      await updateVoucherApi(voucherId, data);
      fetchVouchers();
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Failed to update voucher:", err);
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchSearch =
      String(v.name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(v.code || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && v.isActive) ||
      (statusFilter === "expired" &&
        !v.isActive &&
        new Date(v.endDate) < new Date());
    return matchSearch && matchStatus;
  });

  const getTierBadge = (tier) => {
    if (tier === "Platinum")
      return "bg-primary/10 border border-primary text-primary";
    if (tier === "Gold")
      return "bg-tertiary-container/20 border border-tertiary-container text-tertiary-container";
    return "bg-outline-variant/20 border border-outline-variant text-on-surface-variant";
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-container-highest pb-6">
          <div>
            <h1 className="font-headline-lg text-on-surface">
              Quản lý Khuyến Mãi & Hạng Thẻ
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Thiết lập điểm thăng hạng, giảm giá và các chiến dịch voucher đang
              hoạt động.
            </p>
          </div>
          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="bg-primary hover:bg-primary-fixed-dim text-on-primary text-label-caps px-6 py-3 flex items-center gap-2 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>{" "}
            Tạo Chiến Dịch Mới
          </button>
        </div>

        {/* Tier Configuration Section */}
        <div className="bg-surface border border-outline-variant flex flex-col">
          <div className="bg-surface-container-low border-b border-outline-variant p-4">
            <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                military_tech
              </span>
              Cấu hình Quy tắc Hạng Thẻ
            </h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Thiết lập điểm thăng hạng và đặc quyền giảm giá mặc định tự động
              dựa trên cấp bậc.
            </p>
          </div>
          <div className="flex flex-col">
            {tiers.map((tier, idx) => (
              <div
                key={tier.name}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center bg-surface hover:bg-surface-container-low transition-colors ${idx < tiers.length - 1 ? "border-b border-surface-container-highest" : ""}`}
              >
                <div className="md:col-span-3 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center ${tier.name === "Gold" ? "bg-[#3f311d] border border-[#d4af37]" : "bg-surface-container-highest border border-outline-variant"}`}
                  >
                    <span
                      className={`material-symbols-outlined ${tier.name === "Gold" ? "text-[#d4af37]" : "text-on-surface-variant"}`}
                    >
                      {tier.name === "Platinum"
                        ? "diamond"
                        : tier.name === "Gold"
                          ? "workspace_premium"
                          : "star"}
                    </span>
                  </div>
                  <div>
                    <div
                      className={`text-body-lg font-semibold ${tier.name === "Gold" ? "text-[#d4af37]" : tier.name === "Platinum" ? "text-primary" : "text-on-surface"}`}
                    >
                      Hạng {tier.name}
                    </div>
                    <div className="text-label-caps text-on-surface-variant mt-1">
                      {tier.description}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-4 flex flex-col gap-1">
                  <label className="text-label-caps text-on-surface-variant">
                    Điểm thăng hạng (pts)
                  </label>
                  <input
                    className="input-base text-data-display"
                    type="text"
                    defaultValue={tier.pointsRequired?.toLocaleString()}
                    onBlur={(e) =>
                      updateTier(tier.id, {
                        pointsRequired: parseInt(
                          e.target.value.replace(/,/g, ""),
                        ),
                      })
                    }
                  />
                </div>
                <div className="md:col-span-3 flex flex-col gap-1">
                  <label className="text-label-caps text-on-surface-variant">
                    % Giảm giá tự động
                  </label>
                  <div className="relative">
                    <input
                      className="input-base text-data-display pr-8"
                      type="text"
                      defaultValue={tier.discountPercent}
                      onBlur={(e) =>
                        updateTier(tier.id, {
                          discountPercent: parseInt(e.target.value),
                        })
                      }
                    />
                    <span className="absolute right-3 top-2 text-on-surface-variant font-data-display">
                      %
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button className="border border-primary text-primary hover:bg-primary/10 px-4 py-2 text-label-caps transition-colors w-full md:w-auto">
                    Cập nhật
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voucher Campaigns Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">
                local_activity
              </span>
              Danh Sách Chiến Dịch Voucher
            </h2>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  className="input-base pl-10"
                  placeholder="Tìm tên voucher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-48">
                <select
                  className="input-base appearance-none bg-surface-container-high pr-8 cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Trạng thái: Tất cả</option>
                  <option value="active">Đang chạy (Active)</option>
                  <option value="expired">Hết hạn (Expired)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2.5 text-on-surface-variant text-[20px] pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr>
                  <th className="th-cell w-1/4">Tên Voucher</th>
                  <th className="th-cell">Giá Trị Quy Đổi</th>
                  <th className="th-cell">Hạng Áp Dụng</th>
                  <th className="th-cell">Thời Gian</th>
                  <th className="th-cell w-[100px] text-center">Trạng Thái</th>
                  <th className="th-cell w-[120px] text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="td-cell text-center">
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="td-cell text-center">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((voucher) => (
                    <tr key={voucher.id} className="tr-hover group">
                      <td className="td-cell">
                        <div className="font-semibold text-on-surface">
                          {voucher.name}
                        </div>
                        <div className="text-label-caps text-on-surface-variant mt-1">
                          {voucher.code}
                        </div>
                      </td>
                      <td className="td-cell">
                        <span className="text-data-display text-primary">
                          {voucher.pointsRequired?.toLocaleString()} pts
                        </span>
                      </td>
                      <td className="td-cell">
                        <span
                          className={`inline-block border px-2 py-1 text-label-caps text-on-surface-variant ${getTierBadge(voucher.tier)}`}
                        >
                          {voucher.tier === "all"
                            ? "All Tiers"
                            : `${voucher.tier} & Up`}
                        </span>
                      </td>
                      <td className="td-cell">
                        <div className="text-data-display text-[14px]">
                          {voucher.startDate}
                        </div>
                        <div className="text-data-display text-[14px] text-on-surface-variant">
                          {voucher.endDate}
                        </div>
                      </td>
                      <td className="td-cell text-center">
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input
                            checked={voucher.isActive}
                            onChange={(e) =>
                              updateVoucherStatus(voucher.id, e.target.checked)
                            }
                            type="checkbox"
                            className="toggle-checkbox absolute block w-5 h-5 bg-background border-2 border-outline-variant appearance-none cursor-pointer z-10 transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-secondary"
                          />
                          <label className="toggle-label block overflow-hidden h-5 bg-surface-container-highest border-2 border-outline-variant cursor-pointer transition-colors duration-200 ease-in-out"></label>
                        </div>
                      </td>
                      <td className="td-cell text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedVoucher(voucher);
                              setIsDrawerOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => deleteVoucher(voucher.id)}
                            className="w-8 h-8 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:text-error hover:border-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
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
          <div className="flex justify-between items-center mt-2 pb-8">
            <span className="text-label-caps text-on-surface-variant">
              Showing {filteredVouchers.length} of {vouchers.length}
            </span>
            <span className="text-label-caps text-on-surface-variant">
              Tổng: {vouchers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Voucher Drawer */}
      {isDrawerOpen && selectedVoucher && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-container-low border-l border-outline-variant shadow-2xl flex flex-col h-full">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
              <div className="flex flex-col gap-1">
                <h2 className="text-headline-md text-on-surface">
                  Chỉnh sửa Khuyến mãi
                </h2>
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-secondary rounded-full"></span>
                  <span className="text-label-caps text-secondary">
                    {selectedVoucher.isActive ? "ĐANG CHẠY" : "ĐÃ DỪNG"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-label-caps text-on-surface-variant">
                  Tên Voucher
                </label>
                <input
                  className="input-base"
                  type="text"
                  defaultValue={selectedVoucher.name}
                  onBlur={(e) =>
                    setSelectedVoucher({
                      ...selectedVoucher,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-label-caps text-on-surface-variant">
                  Mã Voucher
                </label>
                <input
                  className="input-base opacity-60 cursor-not-allowed"
                  disabled
                  type="text"
                  defaultValue={selectedVoucher.code}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-outline-variant/30">
                <label className="text-label-caps text-on-surface-variant">
                  LOGIC GIẢM GIÁ
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-label-caps text-on-surface-variant text-[10px]">
                      LOẠI KHUYẾN MÃI
                    </label>
                    <select
                      className="input-base appearance-none pr-8 cursor-pointer"
                      defaultValue="percentage"
                    >
                      <option value="percentage">Giảm theo %</option>
                      <option value="fixed">Giảm theo số tiền cố định</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-label-caps text-on-surface-variant text-[10px]">
                      MỨC GIẢM
                    </label>
                    <div className="relative">
                      <input
                        className="input-base text-data-display pr-8"
                        type="number"
                        defaultValue={selectedVoucher.discountValue || 10}
                      />
                      <span className="absolute right-3 top-2.5 text-on-surface-variant font-data-display">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label-caps text-on-surface-variant text-[10px]">
                    GIÁ TRỊ QUY ĐỔI (PTS)
                  </label>
                  <input
                    className="input-base"
                    type="number"
                    defaultValue={selectedVoucher.pointsRequired}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label-caps text-on-surface-variant">
                    Hạng áp dụng
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["TẤT CẢ", "Silver", "Gold", "Platinum"].map((tier) => (
                      <button
                        key={tier}
                        className={`flex items-center justify-center border px-3 py-1 text-label-caps text-on-surface-variant cursor-pointer ${selectedVoucher.tier === tier ? "border-primary bg-primary/10 text-primary" : "border-outline-variant hover:border-primary"}`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-label-caps text-on-surface-variant">
                    Bắt đầu
                  </label>
                  <input
                    className="input-base"
                    type="date"
                    defaultValue={selectedVoucher.startDate}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label-caps text-on-surface-variant">
                    Kết thúc
                  </label>
                  <input
                    className="input-base"
                    type="date"
                    defaultValue={selectedVoucher.endDate}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <span className="text-body-md font-semibold text-on-surface">
                  Trạng thái hoạt động
                </span>
                <div className="relative inline-block w-10 align-middle select-none">
                  <input
                    checked={selectedVoucher.isActive}
                    onChange={(e) =>
                      setSelectedVoucher({
                        ...selectedVoucher,
                        isActive: e.target.checked,
                      })
                    }
                    type="checkbox"
                    className="toggle-checkbox absolute block w-5 h-5 bg-background border-2 border-outline-variant appearance-none cursor-pointer z-10 transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-secondary"
                  />
                  <label className="toggle-label block overflow-hidden h-5 bg-surface-container-highest border-2 border-outline-variant cursor-pointer transition-colors duration-200 ease-in-out"></label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-container flex gap-3">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors text-label-caps py-3"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  updateVoucher(selectedVoucher.id, selectedVoucher)
                }
                className="flex-1 bg-primary hover:bg-primary-fixed-dim text-on-primary transition-colors text-label-caps py-3"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Voucher Drawer */}
      {isAddDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsAddDrawerOpen(false)}
          ></div>
          <AddVoucherDrawer
            onClose={() => setIsAddDrawerOpen(false)}
            onCreate={createVoucher}
          />
        </>
      )}
    </div>
  );
}

// Add Voucher Drawer Component
function AddVoucherDrawer({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    discountType: "percentage",
    discountValue: 10,
    pointsRequired: 1000,
    tier: "TẤT CẢ",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const handleSubmit = () => {
    onCreate({
      ...formData,
      tier: formData.tier === "TẤT CẢ" ? "all" : formData.tier,
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-container-low border-l border-outline-variant shadow-2xl flex flex-col h-full">
      <div className="h-[72px] flex items-center justify-between px-6 border-b border-surface-container-highest shrink-0 bg-surface-container-low">
        <h2 className="text-headline-md text-on-surface">
          Thêm Khuyến mãi mới
        </h2>
        <button
          onClick={onClose}
          className="size-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant">
              TÊN VOUCHER
            </label>
            <input
              className="input-base"
              placeholder="Ví dụ: Ưu đãi mùa hè"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant">
              MÃ VOUCHER
            </label>
            <input
              className="input-base"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="SUMMER2025"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="text-label-caps text-primary border-b border-surface-container-highest pb-2">
            LOGIC GIẢM GIÁ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant">
                LOẠI KHUYẾN MÃI
              </label>
              <select
                className="input-base"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value })
                }
              >
                <option value="percentage">Phần trăm %</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant">
                MỨC GIẢM
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="input-base pr-10"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: parseInt(e.target.value),
                    })
                  }
                />
                <span className="absolute right-3 top-2 text-on-surface-variant text-label-caps font-bold">
                  {formData.discountType === "percentage" ? "%" : "đ"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant">
              GIÁ TRỊ QUY ĐỔI TỐI ĐA (PTS)
            </label>
            <input
              type="number"
              className="input-base text-data-display"
              value={formData.pointsRequired}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointsRequired: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant mb-1">
              HẠNG ÁP DỤNG
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["TẤT CẢ", "Silver", "Gold", "Platinum"].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setFormData({ ...formData, tier })}
                  className={`border py-2 text-label-caps ${formData.tier === tier ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"}`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-label-caps text-primary border-b border-surface-container-highest pb-2">
            THỜI GIAN
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant">
                BẮT ĐẦU
              </label>
              <input
                type="date"
                className="input-base"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant">
                KẾT THÚC
              </label>
              <input
                type="date"
                className="input-base"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-t border-surface-container-highest">
          <span className="text-body-md text-on-surface font-semibold">
            Kích hoạt ngay khi tạo
          </span>
          <div className="relative inline-block w-10 align-middle select-none">
            <input
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              type="checkbox"
              className="toggle-checkbox absolute block w-5 h-5 bg-background border-2 border-outline-variant appearance-none cursor-pointer z-10 transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-secondary"
            />
            <label className="toggle-label block overflow-hidden h-5 bg-surface-container-highest border-2 border-outline-variant cursor-pointer transition-colors duration-200 ease-in-out"></label>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-surface-container-highest bg-surface-container-low flex gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 border border-outline-variant text-on-surface hover:bg-surface-container-high py-3 text-label-caps transition-colors"
        >
          HỦY
        </button>
        <button
          onClick={handleSubmit}
          className="flex-[1.5] bg-primary hover:bg-primary-fixed-dim text-on-primary py-3 text-label-caps transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> TẠO
          VOUCHER
        </button>
      </div>
    </div>
  );
}

