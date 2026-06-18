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
} from "../../services/adminPromotionApi";

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
      String(v.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(v.code || "")
        .toLowerCase()
        .includes(search.toLowerCase());
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
      return "border-cyan-300/60 bg-cyan-300/10 text-cyan-200";
    if (tier === "Gold")
      return "border-yellow-300/60 bg-yellow-300/10 text-yellow-200";
    return "border-zinc-700 bg-zinc-900 text-zinc-300";
  };

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
                  PROMO OPS
                </span>
                <span className="border border-zinc-800 bg-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  <span className="admin-pulse mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  ACTIVE RULES
                </span>
              </div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
                Promotion Control
              </h1>
              <p className="mt-3 max-w-3xl font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-zinc-500">
                Tier thresholds, voucher campaigns and loyalty exchange rules.
              </p>
            </div>
            <button
              onClick={() => setIsAddDrawerOpen(true)}
              className="group flex h-11 items-center gap-2 border border-cyan-400/60 bg-cyan-400/10 px-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Campaign
            </button>
          </div>
        </div>

        {/* Tier Configuration Section */}
        <div
          className="admin-reveal flex flex-col overflow-hidden border border-zinc-800 bg-zinc-950"
          style={{ animationDelay: "120ms" }}
        >
          <div className="border-b border-zinc-800 bg-black p-4">
            <h2 className="flex items-center gap-2 font-mono text-sm font-black uppercase tracking-[0.18em] text-zinc-100">
              <span className="material-symbols-outlined text-[20px] text-cyan-300">
                military_tech
              </span>
              Cấu hình Quy tắc Hạng Thẻ
            </h2>
            <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
              Thiết lập điểm thăng hạng và đặc quyền giảm giá mặc định tự động
              dựa trên cấp bậc.
            </p>
          </div>
          <div className="flex flex-col">
            {tiers.map((tier, idx) => (
              <div
                key={tier.name}
                className={`admin-reveal grid grid-cols-1 items-center gap-4 bg-zinc-950 p-4 transition hover:bg-cyan-400/[0.04] md:grid-cols-12 ${
                  idx < tiers.length - 1 ? "border-b border-zinc-900" : ""
                }`}
                style={{ animationDelay: `${170 + idx * 55}ms` }}
              >
                <div className="md:col-span-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center border ${
                      tier.name === "Gold"
                        ? "border-yellow-300/60 bg-yellow-300/10"
                        : "border-cyan-400/40 bg-cyan-400/10"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        tier.name === "Gold"
                          ? "text-yellow-200"
                          : "text-cyan-300"
                      }`}
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
                      className={`font-mono text-sm font-black uppercase tracking-[0.12em] ${
                        tier.name === "Gold"
                          ? "text-yellow-200"
                          : tier.name === "Platinum"
                          ? "text-cyan-200"
                          : "text-zinc-100"
                      }`}
                    >
                      Hạng {tier.name}
                    </div>
                    <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                      {tier.description}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-4 flex flex-col gap-1">
                  <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Điểm thăng hạng (pts)
                  </label>
                  <input
                    className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm font-black text-zinc-100 outline-none focus:border-cyan-400"
                    type="text"
                    defaultValue={tier.pointsRequired?.toLocaleString()}
                    onBlur={(e) =>
                      updateTier(tier.id, {
                        pointsRequired: parseInt(
                          e.target.value.replace(/,/g, "")
                        ),
                      })
                    }
                  />
                </div>
                <div className="md:col-span-3 flex flex-col gap-1">
                  <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    % Giảm giá tự động
                  </label>
                  <div className="relative">
                    <input
                      className="h-10 w-full border border-zinc-800 bg-black px-3 pr-8 font-mono text-sm font-black text-zinc-100 outline-none focus:border-cyan-400"
                      type="text"
                      defaultValue={tier.discountPercent}
                      onBlur={(e) =>
                        updateTier(tier.id, {
                          discountPercent: parseInt(e.target.value),
                        })
                      }
                    />
                    <span className="absolute right-3 top-2 font-mono text-zinc-500">
                      %
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button className="w-full border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/20 md:w-auto">
                    Cập nhật
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voucher Campaigns Section */}
        <div
          className="admin-reveal flex flex-col gap-4"
          style={{ animationDelay: "260ms" }}
        >
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h2 className="flex items-center gap-2 font-mono text-lg font-black uppercase tracking-[0.16em] text-zinc-100">
              <span className="material-symbols-outlined text-[24px] text-cyan-300">
                local_activity
              </span>
              Danh Sách Chiến Dịch Voucher
            </h2>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-[20px]">
                  search
                </span>
                <input
                  className="h-10 w-full border border-zinc-800 bg-black pl-10 pr-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
                  placeholder="Tìm tên voucher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-48">
                <select
                  className="h-10 w-full cursor-pointer appearance-none border border-zinc-800 bg-black px-3 pr-8 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option className="bg-black text-zinc-100" value="all">
                    Trạng thái: Tất cả
                  </option>
                  <option className="bg-black text-zinc-100" value="active">
                    Đang chạy (Active)
                  </option>
                  <option className="bg-black text-zinc-100" value="expired">
                    Hết hạn (Expired)
                  </option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[20px] text-zinc-500">
                  arrow_drop_down
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-black">
                  <th className="w-1/4 px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Tên Voucher
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Giá Trị Quy Đổi
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Hạng Áp Dụng
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Thời Gian
                  </th>
                  <th className="w-[120px] px-4 py-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Trạng Thái
                  </th>
                  <th className="w-[130px] px-4 py-3 text-right font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-10 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredVouchers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-10 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((voucher, index) => (
                    <tr
                      key={voucher.id}
                      className="admin-reveal border-b border-zinc-900 transition duration-200 hover:translate-x-1 hover:bg-cyan-400/[0.04]"
                      style={{ animationDelay: `${320 + index * 45}ms` }}
                    >
                      <td className="px-4 py-4">
                        <div className="font-mono font-black text-zinc-100">
                          {voucher.name}
                        </div>
                        <div className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                          {voucher.code}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono font-black text-cyan-300">
                          {voucher.pointsRequired?.toLocaleString()} pts
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${getTierBadge(
                            voucher.tier
                          )}`}
                        >
                          {voucher.tier === "all"
                            ? "All Tiers"
                            : `${voucher.tier} & Up`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-sm text-zinc-100">
                          {voucher.startDate}
                        </div>
                        <div className="font-mono text-sm text-zinc-500">
                          {voucher.endDate}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input
                            checked={voucher.isActive}
                            onChange={(e) =>
                              updateVoucherStatus(voucher.id, e.target.checked)
                            }
                            type="checkbox"
                            className="toggle-checkbox absolute z-10 block h-5 w-5 cursor-pointer appearance-none border-2 border-zinc-700 bg-black transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-emerald-300"
                          />
                          <label className="toggle-label block h-5 cursor-pointer overflow-hidden border-2 border-zinc-700 bg-zinc-900 transition-colors duration-200 ease-in-out"></label>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedVoucher(voucher);
                              setIsDrawerOpen(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => deleteVoucher(voucher.id)}
                            className="flex h-8 w-8 items-center justify-center border border-red-400/40 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
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
          <div className="mt-2 flex items-center justify-between pb-8">
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Showing {filteredVouchers.length} of {vouchers.length}
            </span>
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Tổng: {vouchers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Voucher Drawer */}
      {isDrawerOpen && selectedVoucher && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="admin-reveal fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-black px-6 py-4">
              <div className="flex flex-col gap-1">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                  EDIT CAMPAIGN
                </p>
                <h2 className="text-headline-md text-zinc-100">
                  Chỉnh sửa Khuyến mãi
                </h2>
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-secondary rounded-full"></span>
                  <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                    {selectedVoucher.isActive ? "ĐANG CHẠY" : "ĐÃ DỪNG"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-zinc-500 transition-colors hover:text-cyan-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Tên Voucher
                </label>
                <input
                  className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
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
                <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Mã Voucher
                </label>
                <input
                  className="h-10 w-full cursor-not-allowed border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-500 opacity-70 outline-none"
                  disabled
                  type="text"
                  defaultValue={selectedVoucher.code}
                />
              </div>

              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                  LOGIC GIẢM GIÁ
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      LOẠI KHUYẾN MÃI
                    </label>
                    <select
                      className="h-10 w-full cursor-pointer appearance-none border border-zinc-800 bg-black px-3 pr-8 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                      defaultValue="percentage"
                    >
                      <option
                        className="bg-black text-zinc-100"
                        value="percentage"
                      >
                        Giảm theo %
                      </option>
                      <option className="bg-black text-zinc-100" value="fixed">
                        Giảm theo số tiền cố định
                      </option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      MỨC GIẢM
                    </label>
                    <div className="relative">
                      <input
                        className="h-10 w-full border border-zinc-800 bg-black px-3 pr-8 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                        type="number"
                        defaultValue={selectedVoucher.discountValue || 10}
                      />
                      <span className="absolute right-3 top-2.5 font-mono text-zinc-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    GIÁ TRỊ QUY ĐỔI (PTS)
                  </label>
                  <input
                    className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                    type="number"
                    defaultValue={selectedVoucher.pointsRequired}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Hạng áp dụng
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["TẤT CẢ", "Silver", "Gold", "Platinum"].map((tier) => (
                      <button
                        key={tier}
                        className={`flex cursor-pointer items-center justify-center border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] ${
                          selectedVoucher.tier === tier
                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                            : "border-zinc-800 text-zinc-500 hover:border-cyan-400 hover:text-cyan-300"
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Bắt đầu
                  </label>
                  <input
                    className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                    type="date"
                    defaultValue={selectedVoucher.startDate}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Kết thúc
                  </label>
                  <input
                    className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                    type="date"
                    defaultValue={selectedVoucher.endDate}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300">
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
                    className="toggle-checkbox absolute z-10 block h-5 w-5 cursor-pointer appearance-none border-2 border-zinc-700 bg-black transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-emerald-300"
                  />
                  <label className="toggle-label block h-5 cursor-pointer overflow-hidden border-2 border-zinc-700 bg-zinc-900 transition-colors duration-200 ease-in-out"></label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-zinc-800 bg-black p-6">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 border border-zinc-800 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-600"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  updateVoucher(selectedVoucher.id, selectedVoucher)
                }
                className="flex-1 border border-cyan-400/60 bg-cyan-400/10 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/20"
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
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
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
    <div className="admin-reveal fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="flex min-h-[72px] shrink-0 items-center justify-between border-b border-zinc-800 bg-black px-6">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            NEW CAMPAIGN
          </p>
          <h2 className="mt-1 text-headline-md text-zinc-100">
            Thêm Khuyến mãi mới
          </h2>
        </div>
        <button
          onClick={onClose}
          className="flex size-10 items-center justify-center text-zinc-500 transition-colors hover:text-cyan-300"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              TÊN VOUCHER
            </label>
            <input
              className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
              placeholder="Ví dụ: Ưu đãi mùa hè"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              MÃ VOUCHER
            </label>
            <input
              className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="SUMMER2025"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="border-b border-zinc-800 pb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
            LOGIC GIẢM GIÁ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                LOẠI KHUYẾN MÃI
              </label>
              <select
                className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value })
                }
              >
                <option className="bg-black text-zinc-100" value="percentage">
                  Phần trăm %
                </option>
                <option className="bg-black text-zinc-100" value="fixed">
                  Số tiền cố định
                </option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                MỨC GIẢM
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="h-10 w-full border border-zinc-800 bg-black px-3 pr-10 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: parseInt(e.target.value),
                    })
                  }
                />
                <span className="absolute right-3 top-2 font-mono text-xs font-bold text-zinc-500">
                  {formData.discountType === "percentage" ? "%" : "đ"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              GIÁ TRỊ QUY ĐỔI TỐI ĐA (PTS)
            </label>
            <input
              type="number"
              className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
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
            <label className="mb-1 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              HẠNG ÁP DỤNG
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["TẤT CẢ", "Silver", "Gold", "Platinum"].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setFormData({ ...formData, tier })}
                  className={`border py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] ${
                    formData.tier === tier
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                      : "border-zinc-800 text-zinc-500 hover:border-cyan-400 hover:text-cyan-300"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="border-b border-zinc-800 pb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
            THỜI GIAN
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                BẮT ĐẦU
              </label>
              <input
                type="date"
                className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                KẾT THÚC
              </label>
              <input
                type="date"
                className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 py-4">
          <span className="font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300">
            Kích hoạt ngay khi tạo
          </span>
          <div className="relative inline-block w-10 align-middle select-none">
            <input
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              type="checkbox"
              className="toggle-checkbox absolute z-10 block h-5 w-5 cursor-pointer appearance-none border-2 border-zinc-700 bg-black transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-emerald-300"
            />
            <label className="toggle-label block h-5 cursor-pointer overflow-hidden border-2 border-zinc-700 bg-zinc-900 transition-colors duration-200 ease-in-out"></label>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-zinc-800 bg-black p-6">
        <button
          onClick={onClose}
          className="flex-1 border border-zinc-800 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-600"
        >
          HỦY
        </button>
        <button
          onClick={handleSubmit}
          className="flex-[1.5] items-center justify-center gap-2 border border-cyan-400/60 bg-cyan-400/10 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/20"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> TẠO
          VOUCHER
        </button>
      </div>
    </div>
  );
}
