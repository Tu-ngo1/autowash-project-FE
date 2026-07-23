import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLoyaltyVouchers,
  getMyLoyalty,
  redeemVoucher,
} from "../../services/customerLoyaltyApi";
import { getCustomerVouchers } from "../../services/customerVoucherApi";
import { getCustomerTierConfigs } from "../../services/customerConfigApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";
import { getUser } from "../../utils/auth";
import UserNavbar from "../../components/UserNavbar";
import {
  mergeUniqueBy,
  sortNewestFirst,
  unwrapList,
  unwrapPayload,
} from "../../utils/dataHelpers";

const getVoucherPoints = (voucher) =>
  Number(voucher.pointCost ?? voucher.pointsCost ?? voucher.points ?? 0);

const getVoucherName = (voucher) =>
  voucher.name || voucher.title || voucher.campaignName || "Voucher";
const getVoucherDescription = (voucher) =>
  voucher.description ||
  voucher.desc ||
  (voucher.discountAmount
    ? `Giảm ${Number(voucher.discountAmount).toLocaleString("vi-VN")}đ cho lần rửa xe.`
    : "") ||
  (voucher.discountPercent
    ? `Giảm ${Number(voucher.discountPercent).toLocaleString("vi-VN")}% cho lần rửa xe.`
    : "");

const getTierName = (tier) => tier?.tierLevel || tier?.tier || tier?.name || "";
const getTierLabel = (tier) =>
  tier?.label || tier?.displayName || getTierName(tier);
const getTierMinPoints = (tier) =>
  Number(tier?.minPoints ?? tier?.thresholdPoints ?? tier?.requiredPoints ?? 0);
const getVoucherIdentity = (voucher) =>
  String(
    voucher?.promotionId ??
      voucher?.voucherId ??
      voucher?.id ??
      voucher?.voucherCode ??
      voucher?.code ??
      "",
  );
const mergeUniqueVouchers = (...voucherGroups) => {
  return mergeUniqueBy(
    voucherGroups.flat().filter(Boolean),
    (voucher) => getVoucherIdentity(voucher) || getVoucherName(voucher),
  );
};

const getVoucherList = (payload) =>
  unwrapList(payload, ["vouchers", "items", "data", "content"]);

function PageShell({ active = "Rewards", children }) {
  return (
    <div className="customer-motion-root min-h-screen overflow-hidden bg-[#f4fafc] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(244,253,255,0.96),rgba(244,250,252,0.84)_46%,rgba(70,190,230,0.48))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,116,158,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,116,158,0.1)_1px,transparent_1px)] bg-[size:74px_74px]" />
      </div>
      <div className="relative z-10">
        <UserNavbar active={active} />
        <main className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-32 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function VoucherCard({ voucher, redeemablePoints, onRedeem, redeemed = false }) {
  const pointCost = getVoucherPoints(voucher);
  const canRedeem = !redeemed && pointCost <= (redeemablePoints ?? 0);

  return (
    <article
      className={`group relative overflow-hidden rounded-[28px] border p-5 shadow-sm backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(2,74,138,0.14)] ${
        canRedeem
          ? "border-white/75 bg-white/72 hover:border-cyan-200"
          : "border-white/60 bg-white/46 opacity-70 grayscale-[20%]"
      }`}
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-100/80 blur-2xl transition group-hover:scale-125" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
          <span className="material-symbols-outlined text-[32px]">
            {voucher.icon || "local_car_wash"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black leading-tight text-slate-950">
            {getVoucherName(voucher)}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
            {getVoucherDescription(voucher)}
          </p>
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between border-t border-dashed border-cyan-200 pt-4">
        <div className="flex items-center gap-2 font-black text-cyan-700">
          <span className="material-symbols-outlined text-[20px]">stars</span>
          <span>{pointCost.toLocaleString("vi-VN")} pts</span>
        </div>
        <button
          type="button"
          disabled={!canRedeem}
          onClick={() => onRedeem(getVoucherIdentity(voucher))}
          className={`rounded-2xl px-4 py-2 text-xs font-black transition ${
            redeemed
              ? "cursor-default bg-emerald-100 text-emerald-700"
              : canRedeem
              ? "bg-slate-950 text-white hover:bg-slate-800"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
        >
          {redeemed ? "Đã đổi" : canRedeem ? "Đổi ngay" : "Không đủ điểm"}
        </button>
      </div>
    </article>
  );
}

export function VoucherPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [allVouchers, setAllVouchers] = useState([]);
  const [ownedVouchers, setOwnedVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const currentUser = getUser();
        const userId = currentUser?.id || currentUser?.userId;
        const [profileRes, voucherRes, ownedVoucherRes, tierRes] = await Promise.all([
          getMyLoyalty().catch(() => null),
          getLoyaltyVouchers().catch(() => []),
          userId ? getCustomerVouchers(userId).catch(() => []) : Promise.resolve([]),
          getCustomerTierConfigs().catch(() => []),
        ]);
        setProfile(unwrapPayload(profileRes, null) || null);
        setAllVouchers(sortNewestFirst(getVoucherList(voucherRes)));
        setOwnedVouchers(sortNewestFirst(getVoucherList(ownedVoucherRes)));
        unwrapList(tierRes, [
          "tiers",
          "tierConfigs",
          "items",
          "data",
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const redeemablePoints =
    profile?.redeemablePoints ??
    profile?.rewardPoints ??
    profile?.points ??
    0;
  const ownedVoucherKeys = useMemo(() => {
    const keys = new Set();
    ownedVouchers.forEach((voucher) => {
      const promotionKey = voucher?.promotionId ?? voucher?.promotion?.id;
      const codeKey = voucher?.voucherCode ?? voucher?.code;
      if (promotionKey != null) keys.add(String(promotionKey));
      if (codeKey) keys.add(String(codeKey));
    });
    return keys;
  }, [ownedVouchers]);
  const filtered = useMemo(() => {
    let list = allVouchers || [];
    if (filter === "redeemable") {
      list = list.filter(
        (voucher) => getVoucherPoints(voucher) <= redeemablePoints,
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (voucher) =>
          getVoucherName(voucher).toLowerCase().includes(q) ||
          getVoucherDescription(voucher).toLowerCase().includes(q),
      );
    }
    return list;
  }, [allVouchers, filter, search, redeemablePoints]);

  const handleRedeem = async (voucherId) => {
    setMessage("");
    const redeemedVoucher = allVouchers.find(
      (voucher) => getVoucherIdentity(voucher) === String(voucherId),
    );
    try {
      const redeemRes = await redeemVoucher(voucherId);
      const currentUser = getUser();
      const userId = currentUser?.id || currentUser?.userId;
      const [profileRes, voucherRes, ownedVoucherRes] = await Promise.all([
        getMyLoyalty().catch(() => profile),
        getLoyaltyVouchers().catch(() => allVouchers),
        userId ? getCustomerVouchers(userId).catch(() => ownedVouchers) : Promise.resolve(ownedVouchers),
      ]);
      setProfile(unwrapPayload(profileRes, null) || null);
      setAllVouchers(sortNewestFirst(getVoucherList(voucherRes)));
      const returnedVoucher =
        redeemRes?.voucher ||
        redeemRes?.customerVoucher ||
        redeemRes?.promotion ||
        redeemRes;
      setOwnedVouchers(
        mergeUniqueVouchers(
          getVoucherList(ownedVoucherRes),
          [returnedVoucher, redeemedVoucher],
        ),
      );
      setMessage("Đổi voucher thành công. Ưu đãi đã được cập nhật.");
    } catch (err) {
      setMessage(
        getFriendlyErrorMessage(
          err,
          "Đổi voucher chưa thực hiện được. Vui lòng thử lại sau.",
        ),
      );
    }
  };

  return (
    <PageShell>
      <section className="mb-8 rounded-[34px] border border-white/75 bg-white/58 p-7 shadow-[0_32px_90px_rgba(2,74,138,0.12)] backdrop-blur-2xl sm:p-10">
        <button
          type="button"
          onClick={() => navigate("/rewards")}
          className="mb-7 inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white/70 px-4 py-2 text-sm font-black text-cyan-800 transition hover:bg-cyan-50"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Quay lại
        </button>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Kho voucher
            </p>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-normal sm:text-5xl xl:text-6xl">
              Đổi ưu đãi cho lần rửa tiếp theo.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              Dùng điểm thưởng để nhận giảm giá, vệ sinh nội thất hoặc các gói
              chăm sóc xe đặc quyền.
            </p>
          </div>
          <div className="rounded-[28px] bg-slate-950 p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Số dư điểm
            </p>
            <p className="mt-3 text-4xl font-black">
              {(redeemablePoints ?? 0).toLocaleString("vi-VN")}
              <span className="ml-2 text-base text-slate-400">pts</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-[30px] border border-white/75 bg-white/70 p-5 shadow-sm backdrop-blur-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {[
              ["all", "Tất cả"],
              ["redeemable", "Có thể đổi"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-black transition ${
                  filter === key
                    ? "bg-slate-950 text-white"
                    : "bg-white/70 text-slate-600 hover:bg-cyan-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-cyan-700">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm voucher..."
              className="h-13 w-full rounded-2xl border border-cyan-100 bg-white/80 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>
        </div>
      </section>

      {message && (
        <div className="mb-6 rounded-2xl border border-cyan-100 bg-white/76 px-5 py-4 text-sm font-black text-cyan-800 shadow-sm backdrop-blur-2xl">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-[28px] bg-white/60"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-[34px] border border-white/75 bg-white/70 p-12 text-center shadow-sm backdrop-blur-2xl">
            <span className="material-symbols-outlined text-[56px] text-cyan-200">
              redeem
            </span>
            <p className="mt-4 font-black text-slate-700">
              Chưa có voucher nào.
            </p>
          </div>
        ) : (
          filtered.map((voucher) => (
            <VoucherCard
              key={
                voucher.id ||
                voucher.voucherId ||
                voucher.code ||
                getVoucherName(voucher)
              }
              voucher={voucher}
              redeemablePoints={redeemablePoints}
              onRedeem={handleRedeem}
              redeemed={
                ownedVoucherKeys.has(getVoucherIdentity(voucher)) ||
                ownedVoucherKeys.has(String(voucher.code || voucher.voucherCode || ""))
              }
            />
          ))
        )}
      </section>
    </PageShell>
  );
}

export default function CustomerLoyalty() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ownedVouchers, setOwnedVouchers] = useState([]);
  const [tierConfigs, setTierConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = getUser();
        const userId = currentUser?.id || currentUser?.userId;
        const [profileRes, ownedVoucherRes, tierRes] = await Promise.all([
          getMyLoyalty().catch(() => null),
          userId ? getCustomerVouchers(userId).catch(() => []) : Promise.resolve([]),
          getCustomerTierConfigs().catch(() => []),
        ]);
        setProfile(unwrapPayload(profileRes, null) || null);
        setOwnedVouchers(sortNewestFirst(getVoucherList(ownedVoucherRes)));
        const tiers = unwrapList(tierRes, [
          "tiers",
          "tierConfigs",
          "items",
          "data",
        ]);
        setTierConfigs(
          tiers.sort((a, b) => getTierMinPoints(a) - getTierMinPoints(b)),
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tier = profile?.tier || profile?.tierLevel || "";
  const nextTier = useMemo(() => {
    return (
      tierConfigs.find(
        (item) => getTierMinPoints(item) > (profile?.points ?? 0),
      ) || null
    );
  }, [tierConfigs, profile?.points]);

  const progress = useMemo(() => {
    if (!profile) return 0;
    if (!tierConfigs.length) return Number(profile.progress ?? 0);
    if (!nextTier) return 100;

    const nextTierIdx = tierConfigs.findIndex((item) => item === nextTier);
    const currentTier =
      nextTierIdx > 0 ? tierConfigs[nextTierIdx - 1] : tierConfigs[0];

    const cur = getTierMinPoints(currentTier);
    const nxt = getTierMinPoints(nextTier);
    if (nxt === cur) return 100;
    return Math.max(
      0,
      Math.min(100, (((profile?.points ?? 0) - cur) / (nxt - cur)) * 100),
    );
  }, [profile, nextTier, tierConfigs]);

  const myVouchers = mergeUniqueVouchers(
    ownedVouchers,
    profile?.vouchers || [],
  );

  return (
    <PageShell>
      <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="relative overflow-hidden rounded-[34px] border border-white/75 bg-white/58 p-7 shadow-[0_32px_90px_rgba(2,74,138,0.12)] backdrop-blur-2xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.18),transparent_28%)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/62 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Ưu đãi
            </p>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-slate-950 sm:text-5xl xl:text-6xl">
              Tích điểm, đổi voucher
            </h1>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-[34px] border border-white/75 bg-white/72 p-7 text-slate-950 shadow-[0_28px_80px_rgba(2,74,138,0.12)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.2),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(16,185,129,0.14),transparent_30%)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
              <span className="material-symbols-outlined text-[16px]">
                workspace_premium
              </span>
              Hạng hiện tại
            </p>
            <div className="mt-6 flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50 to-emerald-100 text-cyan-700 shadow-[0_18px_45px_rgba(8,145,178,0.16)]">
                <span className="material-symbols-outlined text-[42px]">
                  verified
                </span>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-950">
                  {tier || "-"}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {Math.round(progress)}% tới hạng kế tiếp
                </p>
              </div>
            </div>
            <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 shadow-[0_8px_24px_rgba(34,211,238,0.35)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            {nextTier && (
              <p className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
                {`Còn ${Math.max(
                  getTierMinPoints(nextTier) - (profile?.points ?? 0),
                  0,
                ).toLocaleString(
                  "vi-VN",
                )} điểm để lên hạng ${getTierLabel(nextTier)}.`}
              </p>
            )}
          </div>
        </aside>
      </section>

      {loading ? (
        <div className="space-y-5">
          <div className="h-56 animate-pulse rounded-[34px] bg-white/60" />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-[28px] bg-white/60" />
            <div className="h-40 animate-pulse rounded-[28px] bg-white/60" />
          </div>
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-5 md:grid-cols-2">
            {[
              [
                "Điểm có thể đổi quà",
                profile?.redeemablePoints ?? profile?.rewardPoints ?? profile?.points ?? 0,
                "redeem",
              ],
              ["Điểm xét hạng", profile?.points ?? 0, "stars"],
            ].map(([label, value, icon]) => (
              <div
                key={label}
                className="rounded-[30px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-cyan-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <span className="material-symbols-outlined text-[26px]">
                    {icon}
                  </span>
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                  {label}
                </p>
                <p className="mt-2 text-5xl font-black text-slate-950">
                  {Number(value).toLocaleString("vi-VN")}
                  <span className="ml-2 text-base text-slate-400">pts</span>
                </p>
              </div>
            ))}
          </section>

          <section className="mb-8 rounded-[34px] border border-white/75 bg-white/72 p-6 shadow-sm backdrop-blur-2xl sm:p-7">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                  Voucher của bạn
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  Ưu đãi đang sở hữu
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate("/rewards/vouchers")}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                Đổi thêm ưu đãi
              </button>
            </div>

            {myVouchers.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-cyan-200 bg-cyan-50/70 p-10 text-center">
                <span className="material-symbols-outlined text-[52px] text-cyan-200">
                  redeem
                </span>
                <p className="mt-4 font-black text-slate-700">
                  Chưa có voucher nào.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {myVouchers.map((voucher) => (
                  <VoucherCard
                    key={
                      voucher.id ||
                      voucher.voucherId ||
                      voucher.code ||
                      getVoucherName(voucher)
                    }
                    voucher={voucher}
                    redeemablePoints={
                      profile?.redeemablePoints ??
                      profile?.rewardPoints ??
                      profile?.points ??
                      0
                    }
                    onRedeem={() => {}}
                    redeemed
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}
