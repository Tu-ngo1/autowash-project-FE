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
import { sortNewestFirst } from "../../utils/dataHelpers";

const TIER_ORDER = {
  MEMBER: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

const getTierName = (tier = {}) =>
  String(tier.name || tier.tier || tier.tierLevel || tier.id || "MEMBER");

const getTierRank = (tier) => TIER_ORDER[getTierName(tier).toUpperCase()] ?? 99;

const sortTiersLowToHigh = (items = []) =>
  [...items].sort((a, b) => getTierRank(a) - getTierRank(b));

const isMemberTier = (tier) => getTierName(tier).toUpperCase() === "MEMBER";

const getTierPointsRequired = (tier) =>
  isMemberTier(tier) ? 0 : tier.pointsRequired;

const toDateInputValue = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const formatVoucherDate = (value) => {
  const dateValue = toDateInputValue(value);
  if (!dateValue) return "-";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("vi-VN");
};

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
        checked ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]" : "bg-zinc-800"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const normalizeVoucher = (voucher = {}) => {
  const rawDiscountType = String(
    voucher.discountType || voucher.type || ""
  ).toLowerCase();

  const discountPercent = voucher.discountPercent ?? voucher.percent;
  const discountAmount = voucher.discountAmount ?? voucher.amount;

  const isPercentType =
    rawDiscountType.includes("percent") ||
    (discountPercent !== null && discountPercent !== undefined);

  const discountValue = isPercentType
    ? (discountPercent ?? voucher.discountValue ?? 0)
    : (discountAmount ?? voucher.discountValue ?? 0);

  const maxDiscountAmount =
    voucher.maxDiscountAmount ?? voucher.maxDiscountValue ?? voucher.maxAmount ?? null;

  const rawTier = String(
    voucher.tier || voucher.targetTier || voucher.tierLevel || "all",
  );
  const tier = rawTier.toUpperCase() === "MEMBER" ? "all" : rawTier;
  const isActive =
    voucher.isActive ??
    voucher.active ??
    String(voucher.status || "ACTIVE").toUpperCase() === "ACTIVE";

  return {
    ...voucher,
    code: voucher.code || voucher.voucherCode || "",
    voucherCode: voucher.voucherCode || voucher.code || "",
    name: voucher.name || voucher.campaignName || "Voucher",
    campaignName: voucher.campaignName || voucher.name || "Voucher",
    pointsRequired: voucher.pointsRequired ?? voucher.pointCost ?? 0,
    pointCost: voucher.pointCost ?? voucher.pointsRequired ?? 0,
    tier,
    targetTier: voucher.targetTier || (tier === "all" ? "MEMBER" : tier),
    discountType: isPercentType ? "percentage" : "fixed",
    discountValue: Number(discountValue) || 0,
    discountAmount: isPercentType ? null : Number(discountValue),
    discountPercent: isPercentType ? Number(discountValue) : null,
    maxDiscountAmount:
      maxDiscountAmount !== null && maxDiscountAmount !== undefined && maxDiscountAmount !== ""
        ? Number(maxDiscountAmount)
        : null,
    isActive: Boolean(isActive),
    startDate: toDateInputValue(voucher.startDate || voucher.startAt),
    endDate: toDateInputValue(voucher.endDate || voucher.endAt),
  };
};

const toBackendVoucherPayload = (voucher = {}) => {
  const discountType = voucher.discountType || "percentage";
  const discountValue = Number(voucher.discountValue) || 0;
  const rawMax = voucher.maxDiscountAmount;
  const maxDiscountAmount =
    discountType === "percentage" && rawMax !== null && rawMax !== undefined && rawMax !== ""
      ? Number(rawMax)
      : null;
  const tier = String(voucher.tier || voucher.targetTier || "all");

  return {
    ...voucher,
    voucherCode: (voucher.voucherCode || voucher.code || "").trim(),
    campaignName: (voucher.campaignName || voucher.name || "").trim(),
    pointCost: Number(voucher.pointCost ?? voucher.pointsRequired ?? 0),
    targetTier: tier === "all" || tier === "TẤT CẢ" ? "MEMBER" : tier.toUpperCase(),
    discountPercent: discountType === "percentage" ? discountValue : null,
    discountAmount: discountType === "fixed" ? discountValue : null,
    maxDiscountAmount,
    isActive: Boolean(voucher.isActive),
    active: Boolean(voucher.isActive),
    startAt: voucher.startDate ? `${voucher.startDate}T00:00:00` : voucher.startAt,
    endAt: voucher.endDate ? `${voucher.endDate}T23:59:59` : voucher.endAt,
  };
};

const getVoucherId = (voucher = {}) =>
  voucher.id ?? voucher.voucherId ?? voucher.promotionId ?? voucher.campaignId;

export default function AdminPromotions() {
  const [tiers, setTiers] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierDrafts, setTierDrafts] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchTiers();
    fetchVouchers();
  }, []);

  useEffect(() => {
    const nextDrafts = {};
    tiers.forEach((tier) => {
      nextDrafts[tier.id] = {
        pointsRequired: getTierPointsRequired(tier) ?? 0,
        discountPercent: tier.discountPercent ?? 0,
      };
    });
    setTierDrafts(nextDrafts);
  }, [tiers]);

  const fetchTiers = async () => {
    try {
      const res = await getTiers();
      const payload = res.data?.data ?? res.data;
      const nextTiers = Array.isArray(payload) ? payload : payload?.tiers || [];
      setTiers(sortTiersLowToHigh(nextTiers));
    } catch {
      setTiers([]);
    }
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await getVouchers();
      const payload = res.data?.data ?? res.data;
      const nextVouchers = Array.isArray(payload)
        ? payload
        : payload?.vouchers || [];
      setVouchers(sortNewestFirst(nextVouchers.map(normalizeVoucher)));
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

  const updateTierDraft = (tierId, field, value) => {
    setTierDrafts((current) => ({
      ...current,
      [tierId]: {
        ...(current[tierId] || {}),
        [field]: value,
      },
    }));
  };

  const updateVoucherStatus = async (voucherId, isActive) => {
    if (!voucherId) return;
    // Optimistic UI state update for smooth 60fps toggle animation
    setVouchers((prev) =>
      prev.map((v) =>
        getVoucherId(v) === voucherId ? { ...v, isActive } : v
      )
    );
    try {
      await updateVoucherStatusApi(voucherId, isActive);
    } catch (err) {
      console.error("Failed to update voucher status:", err);
      fetchVouchers();
    }
  };

  const deleteVoucher = async (voucherId) => {
    if (!voucherId) return;
    try {
      await deleteVoucherApi(voucherId);
      setVouchers((prev) =>
        prev.filter((voucher) => getVoucherId(voucher) !== voucherId),
      );
      setDeleteTarget(null);
      fetchVouchers();
    } catch (err) {
      console.error("Failed to delete voucher:", err);
    }
  };

  const createVoucher = async (data) => {
    try {
      await createVoucherApi(toBackendVoucherPayload(data));
      fetchVouchers();
      setIsAddDrawerOpen(false);
    } catch (err) {
      console.error("Failed to create voucher:", err);
    }
  };

  const updateVoucher = async (voucherId, data) => {
    if (!voucherId) return;
    try {
      await updateVoucherApi(voucherId, toBackendVoucherPayload(data));
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
    const normalized = String(tier || "").toUpperCase();
    if (normalized === "PLATINUM")
      return "border-cyan-300/60 bg-cyan-300/10 text-cyan-200";
    if (normalized === "GOLD")
      return "border-yellow-300/60 bg-yellow-300/10 text-yellow-200";
    return "border-zinc-700 bg-zinc-900 text-zinc-300";
  };

  const getTierCustomerCount = (tier) =>
    tier.customerCount ?? tier.totalCustomers ?? tier.customersCount ?? 0;

  const tierCustomerStats = sortTiersLowToHigh(tiers).map((tier) => ({
    id: tier.id || tier.name,
    name: tier.name || tier.tier || tier.tierLevel || "Tier",
    customerCount: getTierCustomerCount(tier),
  }));

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
                Quản lý ưu đãi
              </h1>
              <p className="mt-3 max-w-3xl font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-zinc-500">
                Cấu hình hạng thành viên, chiến dịch voucher và quy tắc đổi điểm.
              </p>
            </div>
            <button
              onClick={() => setIsAddDrawerOpen(true)}
              className="group flex h-11 items-center gap-2 border border-cyan-400/60 bg-cyan-400/10 px-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo chiến dịch
            </button>
          </div>
        </div>

        {/* Tier Customer Summary */}
        <div
          className="admin-reveal border border-zinc-800 bg-zinc-950"
          style={{ animationDelay: "90ms" }}
        >
          <div className="border-b border-zinc-800 bg-black p-4">
            <h2 className="flex items-center gap-2 font-mono text-sm font-black uppercase tracking-[0.18em] text-zinc-100">
              <span className="material-symbols-outlined text-[20px] text-cyan-300">
                groups
              </span>
              Customer theo hạng
            </h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-zinc-900 md:grid-cols-4 md:divide-x md:divide-y-0">
            {tierCustomerStats.map((tier, index) => (
              <div
                key={tier.id}
                className="admin-reveal bg-zinc-950 p-4 transition hover:bg-cyan-400/[0.04]"
                style={{ animationDelay: `${130 + index * 45}ms` }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Hạng {getTierName(tier)}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      getTierName(tier).toUpperCase() === "GOLD"
                        ? "text-yellow-200"
                        : getTierName(tier).toUpperCase() === "PLATINUM"
                          ? "text-cyan-200"
                          : "text-cyan-300"
                    }`}
                  >
                    {getTierName(tier).toUpperCase() === "PLATINUM"
                      ? "diamond"
                      : getTierName(tier).toUpperCase() === "GOLD"
                        ? "workspace_premium"
                        : "star"}
                  </span>
                </div>
                <div className="font-mono text-3xl font-black text-cyan-300">
                  {tier.customerCount.toLocaleString()}
                </div>
                <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600">
                  Customer
                </p>
              </div>
            ))}
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
                      getTierName(tier).toUpperCase() === "GOLD"
                        ? "border-yellow-300/60 bg-yellow-300/10"
                        : "border-cyan-400/40 bg-cyan-400/10"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        getTierName(tier).toUpperCase() === "GOLD"
                          ? "text-yellow-200"
                          : "text-cyan-300"
                      }`}
                    >
                      {getTierName(tier).toUpperCase() === "PLATINUM"
                        ? "diamond"
                        : getTierName(tier).toUpperCase() === "GOLD"
                        ? "workspace_premium"
                        : "star"}
                    </span>
                  </div>
                  <div>
                    <div
                      className={`font-mono text-sm font-black uppercase tracking-[0.12em] ${
                        getTierName(tier).toUpperCase() === "GOLD"
                          ? "text-yellow-200"
                          : getTierName(tier).toUpperCase() === "PLATINUM"
                          ? "text-cyan-200"
                          : "text-zinc-100"
                      }`}
                    >
                      Hạng {getTierName(tier)}
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
                    className={`h-10 w-full border px-3 font-mono text-sm font-black outline-none focus:border-cyan-400 ${
                      isMemberTier(tier)
                        ? "cursor-not-allowed border-zinc-900 bg-zinc-950 text-zinc-500"
                        : "border-zinc-800 bg-black text-zinc-100"
                    }`}
                    type="text"
                    disabled={isMemberTier(tier)}
                    value={
                      isMemberTier(tier)
                        ? "0"
                        : (tierDrafts[tier.id]?.pointsRequired ?? "")
                    }
                    onChange={(e) => {
                      if (isMemberTier(tier)) return;
                      updateTierDraft(
                        tier.id,
                        "pointsRequired",
                        e.target.value.replace(/[^\d]/g, ""),
                      );
                    }}
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
                      value={tierDrafts[tier.id]?.discountPercent ?? ""}
                      onChange={(e) =>
                        updateTierDraft(
                          tier.id,
                          "discountPercent",
                          e.target.value.replace(/[^\d.]/g, ""),
                        )
                      }
                    />
                    <span className="absolute right-3 top-2 font-mono text-zinc-500">
                      %
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      updateTier(tier.id, {
                        pointsRequired: isMemberTier(tier)
                          ? 0
                          : Number(tierDrafts[tier.id]?.pointsRequired ?? 0),
                        discountPercent: Number(
                          tierDrafts[tier.id]?.discountPercent ?? 0,
                        ),
                      })
                    }
                    className="w-full border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/20 md:w-auto"
                  >
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
                    Mức Giảm
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Giảm Tối Đa
                  </th>
                  <th className="px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Đổi Điểm
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
                      colSpan="8"
                      className="px-4 py-10 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredVouchers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((voucher, index) => {
                    const voucherId = getVoucherId(voucher);
                    const isPercentage = voucher.discountType === "percentage" || voucher.discountPercent !== null;
                    return (
                    <tr
                      key={voucherId || voucher.code || index}
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
                      <td className="px-4 py-4 font-mono font-black text-emerald-300">
                        {isPercentage
                          ? `${voucher.discountValue}%`
                          : `${Number(voucher.discountValue || 0).toLocaleString()} ₫`}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-zinc-300">
                        {isPercentage && voucher.maxDiscountAmount
                          ? `${Number(voucher.maxDiscountAmount).toLocaleString()} ₫`
                          : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono font-black text-cyan-300">
                          {voucher.pointsRequired?.toLocaleString()} pts
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex min-w-[92px] items-center justify-center whitespace-nowrap border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${getTierBadge(
                            voucher.tier
                          )}`}
                        >
                          {String(voucher.tier).toLowerCase() === "all"
                            ? "Tất cả hạng"
                            : `${voucher.tier} & Up`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-sm text-zinc-100">
                          {formatVoucherDate(voucher.startDate || voucher.startAt)}
                        </div>
                        <div className="font-mono text-sm text-zinc-500">
                          {formatVoucherDate(voucher.endDate || voucher.endAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <ToggleSwitch
                          checked={voucher.isActive}
                          onChange={(val) => updateVoucherStatus(voucherId, val)}
                        />
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
                            onClick={() => setDeleteTarget(voucher)}
                            className="flex h-8 w-8 items-center justify-center border border-red-400/40 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
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
          <div className="mt-2 flex items-center justify-between pb-8">
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Đang hiển thị {filteredVouchers.length} trong {vouchers.length}
            </span>
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Tổng: {vouchers.length}
            </span>
          </div>
        </div>
      </div>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="w-full max-w-md border border-red-400/35 bg-zinc-950 p-6 shadow-2xl">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
              Xóa voucher
            </p>
            <h3 className="mt-2 text-2xl font-black text-zinc-50">
              Xác nhận xóa ưu đãi
            </h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
              Bạn có chắc muốn xóa{" "}
              <span className="text-cyan-200">{deleteTarget.name}</span> không?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="border border-zinc-700 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => deleteVoucher(getVoucherId(deleteTarget))}
                className="border border-red-400/60 bg-red-400/10 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-400/20"
              >
                Xóa voucher
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                      value={selectedVoucher.discountType || "percentage"}
                      onChange={(e) =>
                        setSelectedVoucher({
                          ...selectedVoucher,
                          discountType: e.target.value,
                        })
                      }
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
                        value={selectedVoucher.discountValue || 0}
                        onChange={(e) =>
                          setSelectedVoucher({
                            ...selectedVoucher,
                            discountValue: Number(e.target.value),
                          })
                        }
                      />
                      <span className="absolute right-3 top-2.5 font-mono text-zinc-500">
                        {selectedVoucher.discountType === "percentage" ? "%" : "₫"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedVoucher.discountType === "percentage" && (
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      SỐ TIỀN GIẢM TỐI ĐA (VND)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="h-10 w-full border border-zinc-800 bg-black px-3 pr-10 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
                        placeholder="Ví dụ: 50000 (Bỏ trống nếu không giới hạn)"
                        value={selectedVoucher.maxDiscountAmount ?? ""}
                        onChange={(e) =>
                          setSelectedVoucher({
                            ...selectedVoucher,
                            maxDiscountAmount: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                      />
                      <span className="absolute right-3 top-2.5 font-mono text-xs font-bold text-zinc-500">
                        ₫
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    GIÁ TRỊ QUY ĐỔI (PTS)
                  </label>
                  <input
                    className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                    type="number"
                    value={selectedVoucher.pointsRequired || 0}
                    onChange={(e) =>
                      setSelectedVoucher({
                        ...selectedVoucher,
                        pointsRequired: Number(e.target.value),
                      })
                    }
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
                        type="button"
                        onClick={() =>
                          setSelectedVoucher({
                            ...selectedVoucher,
                            tier: tier === "TẤT CẢ" ? "all" : tier,
                          })
                        }
                        className={`flex cursor-pointer items-center justify-center border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] ${
                          selectedVoucher.tier ===
                          (tier === "TẤT CẢ" ? "all" : tier)
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
                    value={selectedVoucher.startDate || ""}
                    onChange={(e) =>
                      setSelectedVoucher({
                        ...selectedVoucher,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Kết thúc
                  </label>
                  <input
                    className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                    type="date"
                    value={selectedVoucher.endDate || ""}
                    onChange={(e) =>
                      setSelectedVoucher({
                        ...selectedVoucher,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300">
                  Trạng thái hoạt động
                </span>
                <ToggleSwitch
                  checked={selectedVoucher.isActive}
                  onChange={(val) =>
                    setSelectedVoucher({
                      ...selectedVoucher,
                      isActive: val,
                    })
                  }
                />
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
                  updateVoucher(getVoucherId(selectedVoucher), selectedVoucher)
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
    maxDiscountAmount: "",
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
                      discountValue: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <span className="absolute right-3 top-2 font-mono text-xs font-bold text-zinc-500">
                  {formData.discountType === "percentage" ? "%" : "đ"}
                </span>
              </div>
            </div>
          </div>

          {formData.discountType === "percentage" && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                SỐ TIỀN GIẢM TỐI ĐA (VND)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="h-10 w-full border border-zinc-800 bg-black px-3 pr-10 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
                  placeholder="Ví dụ: 50000 (Bỏ trống nếu không giới hạn)"
                  value={formData.maxDiscountAmount ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: e.target.value ? parseInt(e.target.value) : "",
                    })
                  }
                />
                <span className="absolute right-3 top-2 font-mono text-xs font-bold text-zinc-500">
                  ₫
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              GIÁ TRỊ QUY ĐỔI (PTS)
            </label>
            <input
              type="number"
              className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
              value={formData.pointsRequired}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointsRequired: parseInt(e.target.value) || 0,
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
          <ToggleSwitch
            checked={formData.isActive}
            onChange={(val) =>
              setFormData({ ...formData, isActive: val })
            }
          />
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
