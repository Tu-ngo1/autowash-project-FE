import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLoyaltyVouchers,
  getMyLoyalty,
  redeemVoucher,
} from "../../services/loyaltyApi";
import UserNavbar from "../../components/UserNavbar";

const TIERS = ["Member", "Silver", "Gold", "Platinum"];
const TIER_THRESHOLDS = { Member: 0, Silver: 1200, Gold: 3000, Platinum: 7000 };
const TIER_LABELS = {
  Member: "Thành viên",
  Silver: "Bạc",
  Gold: "Vàng",
  Platinum: "Platinum",
};
const TIER_ICON_COLOR = {
  Member: "text-slate-400",
  Silver: "text-slate-500",
  Gold: "text-amber-500",
  Platinum: "text-blue-600",
};

const getVoucherPoints = (voucher) =>
  Number(voucher.pointCost ?? voucher.pointsCost ?? voucher.points ?? 0);

const getVoucherName = (voucher) => voucher.name || voucher.title || "Voucher";

const getVoucherDescription = (voucher) => voucher.description || voucher.desc || "";

function VoucherCard({ voucher, redeemablePoints, onRedeem }) {
  const pointCost = getVoucherPoints(voucher);
  const canRedeem = pointCost <= (redeemablePoints ?? 0);

  return (
    <div
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-xl border bg-white p-4 transition-all duration-300 ${
        canRedeem
          ? "border-slate-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
          : "border-slate-200 opacity-70 grayscale-[20%]"
      }`}
    >
      <div
        className={`absolute right-0 top-0 -z-10 h-24 w-24 rounded-bl-full transition-transform duration-300 group-hover:scale-110 ${
          canRedeem ? "bg-blue-50" : "bg-slate-100"
        }`}
      />
      <div className="flex items-start gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border ${
            canRedeem
              ? "border-blue-100 bg-blue-50"
              : "border-slate-200 bg-slate-100"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[32px] ${canRedeem ? "text-blue-600" : "text-slate-400"}`}
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            {voucher.icon || "local_car_wash"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-base font-bold leading-tight text-slate-900">
            {getVoucherName(voucher)}
          </h3>
          <p className="line-clamp-2 text-xs font-semibold text-slate-500">
            {getVoucherDescription(voucher)}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-slate-200 pt-4">
        <div
          className={`flex items-center gap-1 font-bold ${canRedeem ? "text-blue-600" : "text-slate-500"}`}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            stars
          </span>
          <span className="text-base">{pointCost.toLocaleString("vi-VN")} pts</span>
        </div>
        <button
          type="button"
          disabled={!canRedeem}
          onClick={() => onRedeem(voucher.id || voucher.voucherId)}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            canRedeem
              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              : "cursor-not-allowed bg-slate-100 text-slate-500"
          }`}
        >
          {canRedeem ? "Đổi ngay" : "Không đủ điểm"}
        </button>
      </div>
    </div>
  );
}

export function VoucherPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [allVouchers, setAllVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [profileRes, voucherRes] = await Promise.all([
          getMyLoyalty().catch(() => null),
          getLoyaltyVouchers().catch(() => []),
        ]);
        setProfile(profileRes || null);
        setAllVouchers(Array.isArray(voucherRes) ? voucherRes : []);
      } catch {
        setAllVouchers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const redeemablePoints = profile?.redeemablePoints ?? 0;

  const filtered = useMemo(() => {
    let list = allVouchers || [];
    if (filter === "redeemable")
      list = list.filter((v) => getVoucherPoints(v) <= redeemablePoints);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          getVoucherName(v).toLowerCase().includes(q) ||
          getVoucherDescription(v).toLowerCase().includes(q),
      );
    }
    return list;
  }, [allVouchers, filter, search, redeemablePoints]);

  const handleRedeem = async (voucherId) => {
    try {
      await redeemVoucher(voucherId);
      alert("Đổi voucher thành công.");
      const [profileRes, voucherRes] = await Promise.all([
        getMyLoyalty().catch(() => profile),
        getLoyaltyVouchers().catch(() => allVouchers),
      ]);
      setProfile(profileRes || null);
      setAllVouchers(Array.isArray(voucherRes) ? voucherRes : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Đổi voucher thất bại.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="flex h-[72px] w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/rewards")}
              className="group -ml-2 flex items-center gap-2 rounded-full px-3 py-2 text-blue-600 transition-colors hover:bg-blue-50"
            >
              <span className="material-symbols-outlined text-[22px] transition-transform group-hover:-translate-x-0.5">
                arrow_back
              </span>
              <span className="hidden text-sm font-semibold md:block">
                Quay lại
              </span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <h1 className="text-xl font-bold text-slate-900">
              Tất cả ưu đãi &amp; Voucher
            </h1>
          </div>
          {/* Points badge */}
          <div className="flex items-center gap-2.5 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
            <span
              className="material-symbols-outlined text-[18px] text-blue-600"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              stars
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Số dư
              </span>
              <span className="mt-0.5 text-sm font-bold text-blue-600">
                {(redeemablePoints ?? 0).toLocaleString("vi-VN")} pts
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-12 xl:px-14">
        {/* Filter + Search */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
            {[
              { key: "all", label: "Tất cả" },
              { key: "redeemable", label: "Có thể đổi" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                  filter === f.key
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm voucher..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-slate-100"
              />
            ))
          ) : error ? (
            <p className="col-span-full text-sm text-red-600">{error}</p>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <span className="material-symbols-outlined block text-[52px] text-slate-300">
                redeem
              </span>
              <p className="mt-4 text-sm text-slate-500">
                Chưa có voucher nào.
              </p>
            </div>
          ) : (
            filtered.map((v) => (
              <VoucherCard
                key={v.id || v.voucherId || v.code || getVoucherName(v)}
                voucher={v}
                redeemablePoints={redeemablePoints}
                onRedeem={handleRedeem}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function LoyaltyDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [allVouchers, setAllVouchers] = useState([]);
  const error = "";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, voucherRes] = await Promise.all([
          getMyLoyalty().catch(() => null),
          getLoyaltyVouchers().catch(() => []),
        ]);
        setProfile(profileRes || null);
        setAllVouchers(Array.isArray(voucherRes) ? voucherRes : []);
      } catch {
        setProfile(null);
        setAllVouchers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tier = profile?.tier || "Member";

  const nextTier = useMemo(() => {
    const idx = TIERS.indexOf(tier);
    return TIERS[idx + 1] || null;
  }, [tier]);

  const progress = useMemo(() => {
    if (!profile) return 0;
    if (!nextTier) return 100;
    const cur = TIER_THRESHOLDS[tier] ?? 0;
    const nxt = TIER_THRESHOLDS[nextTier] ?? cur;
    if (nxt === cur) return 100;
    return Math.max(
      0,
      Math.min(100, ((profile.points - cur) / (nxt - cur)) * 100),
    );
  }, [profile, nextTier, tier]);

  const myVouchers = profile?.vouchers || [];
  const previewVouchers = allVouchers.slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-slate-900">
      <UserNavbar active="Rewards" />

      <main className="flex w-full flex-grow flex-col gap-8 px-4 py-8 sm:px-6 md:gap-12 lg:px-10 lg:py-12 xl:px-14">
        {/* Page header */}
        <section>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Rewards &amp; Loyalty
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Quản lý điểm thưởng và tận hưởng ưu đãi đặc quyền.
          </p>
        </section>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-5">
            <div className="h-52 animate-pulse rounded-3xl bg-slate-200" />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <span className="material-symbols-outlined block text-[40px] text-red-400">
              error
            </span>
            <p className="mt-3 text-sm text-red-700">{error}</p>
          </div>
        ) : (
          <>
            {/* ── Tier Banner ── */}
            <section className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-md md:p-8">
              {/* Decorative blob */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-50 blur-3xl transition-all duration-700 group-hover:bg-blue-100" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-cyan-50 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-stretch">
                {/* Tier badge */}
                <div className="flex flex-shrink-0 flex-col items-center justify-center">
                  <div className="relative mb-3 flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-100 bg-amber-50 shadow-inner md:h-32 md:w-32">
                    <span
                      className={`material-symbols-outlined text-5xl md:text-6xl ${TIER_ICON_COLOR[tier] || "text-blue-600"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      workspace_premium
                    </span>
                    <span className="material-symbols-outlined absolute right-1.5 top-1.5 animate-pulse text-xs text-amber-400">
                      auto_awesome
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-4 py-1 text-sm font-bold text-amber-700">
                    Hạng {TIER_LABELS[tier] || tier}
                  </span>
                </div>

                {/* Progress side */}
                <div className="flex flex-grow flex-col justify-center gap-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Tiến trình xét hạng
                      </p>
                      <p className="mt-1.5 text-slate-600">
                        <span className="text-2xl font-extrabold text-blue-600">
                          {(profile?.points ?? 0).toLocaleString("vi-VN")}
                        </span>
                        <span className="ml-1 text-sm text-slate-400">
                          /{" "}
                          {nextTier
                            ? TIER_THRESHOLDS[nextTier].toLocaleString("vi-VN")
                            : "MAX"}{" "}
                          pts
                        </span>
                      </p>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 -skew-x-12 translate-x-[-100%] bg-white/30 animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    {nextTier ? (
                      <>
                        Còn{" "}
                        <span className="font-semibold text-slate-800">
                          {(
                            TIER_THRESHOLDS[nextTier] - (profile?.points ?? 0)
                          ).toLocaleString("vi-VN")}{" "}
                          điểm
                        </span>{" "}
                        nữa để lên hạng{" "}
                        <span className="font-semibold text-blue-600">
                          {nextTier}
                        </span>
                        .
                      </>
                    ) : (
                      <span className="font-semibold text-blue-600">
                        🎉 Bạn đã đạt hạng cao nhất — Platinum!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Two Wallets ── */}
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Redeemable */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <span
                    className="material-symbols-outlined text-2xl text-blue-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    redeem
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Điểm có thể đổi quà
                  </p>
                  <p className="mt-2 text-4xl font-extrabold text-blue-600">
                    {(profile?.redeemablePoints ?? 0).toLocaleString("vi-VN")}
                    <span className="ml-1 text-lg font-normal text-slate-400">
                      pts
                    </span>
                  </p>
                </div>
                <p className="mt-auto text-sm text-slate-500">
                  Dùng để đổi Voucher ưu đãi dịch vụ.
                </p>
              </div>

              {/* Tier points */}
              <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-blue-50/60" />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <span
                    className="material-symbols-outlined text-2xl text-slate-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    stars
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Điểm xét hạng
                  </p>
                  <p className="mt-2 text-4xl font-extrabold text-slate-800">
                    {(profile?.points ?? 0).toLocaleString("vi-VN")}
                    <span className="ml-1 text-lg font-normal text-slate-400">
                      pts
                    </span>
                  </p>
                </div>
                <p className="relative z-10 mt-auto text-sm text-slate-500">
                  Dùng để duy trì và nâng hạng thành viên.
                </p>
              </div>
            </section>

            {/* ── My Vouchers ── */}
            <section className="flex flex-col gap-6">
              <div className="flex items-end justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Ưu đãi của bạn
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Các voucher bạn đang sở hữu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/rewards/vouchers")}
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  Đổi thêm ưu đãi
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </button>
              </div>

              {myVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                  <span className="material-symbols-outlined text-[52px] text-slate-300">
                    redeem
                  </span>
                  <p className="mt-4 text-base font-semibold text-slate-700">
                    Chưa có voucher nào
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Dùng điểm để đổi ưu đãi ngay
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/rewards/vouchers")}
                    className="mt-6 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    Xem voucher
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {myVouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl bg-blue-50">
                        <span
                          className="material-symbols-outlined z-10 text-5xl text-blue-600"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {voucher.icon || "percent"}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>
                      <div>
                        <h4 className="line-clamp-2 min-h-[48px] text-base font-semibold text-slate-900">
                          {voucher.name}
                        </h4>
                        {voucher.expiredAt && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                            <span
                              className="material-symbols-outlined text-[14px] text-emerald-500"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              calendar_today
                            </span>
                            Hạn dùng:{" "}
                            {new Date(voucher.expiredAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-100 py-2.5 text-sm font-bold text-cyan-800 transition-colors hover:bg-cyan-200"
                      >
                        Sử dụng ngay
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-6">
              <div className="flex items-end justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Kho voucher
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Danh sách voucher hiện có.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/rewards/vouchers")}
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  Xem voucher
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </button>
              </div>

              {previewVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
                  <span className="material-symbols-outlined text-[48px] text-slate-300">
                    inventory_2
                  </span>
                  <p className="mt-4 text-base font-semibold text-slate-700">
                    Chưa có voucher nào
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Danh sách voucher đang trống.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {previewVouchers.map((voucher) => (
                    <VoucherCard
                      key={voucher.id || voucher.voucherId || voucher.code || getVoucherName(voucher)}
                      voucher={voucher}
                      redeemablePoints={profile?.redeemablePoints ?? 0}
                      onRedeem={async (voucherId) => {
                        try {
                          await redeemVoucher(voucherId);
                          navigate("/rewards/vouchers");
                        } catch (err) {
                          alert(
                            err?.response?.data?.message ||
                              "Đổi voucher thất bại.",
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="flex w-full flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row lg:px-10 xl:px-14">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="text-xl font-black text-blue-600">autoWash</span>
            <p className="max-w-xs text-center text-xs text-slate-400 md:text-left">
              © 2026 autoWash Detailing. Efficiency, Clarity, Fluidity.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {[
              "About Us",
              "Services",
              "Pricing",
              "Privacy Policy",
              "Contact",
            ].map((t) => (
              <button
                key={t}
                type="button"
                className="text-sm text-slate-500 underline-offset-4 transition-colors hover:text-blue-600 hover:underline"
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </footer>

      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}
