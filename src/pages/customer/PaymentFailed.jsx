import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import { customerBookingApi } from "../../services";

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingCode = searchParams.get("bookingCode") || searchParams.get("orderCode") || "";

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [isWalletDeposit, setIsWalletDeposit] = useState(false);

  useEffect(() => {
    const orderCode = searchParams.get("orderCode");
    if (orderCode) {
      const orderCodeNum = Number(orderCode);
      const isWallet = !isNaN(orderCodeNum) && orderCodeNum >= 5000000000000000;
      setIsWalletDeposit(isWallet);

      if (isWallet) {
        // Nạp tiền ví thất bại, không cần gọi API đồng bộ của booking
        setVerifying(false);
        setError("Giao dịch nạp tiền vào ví đã bị hủy hoặc thất bại.");
      } else {
        setVerifying(true);
        customerBookingApi.verifyPayment(orderCode)
          .then(() => {
            setVerifying(false);
          })
          .catch((err) => {
            console.error("Xác thực thanh toán thất bại:", err);
            setError("Không thể đồng bộ trạng thái thất bại ngay lập tức. Lịch hẹn của bạn sẽ tự động cập nhật sau.");
            setVerifying(false);
          });
      }
    } else {
      setVerifying(false);
    }
  }, [searchParams]);

  return (
    <div className="customer-motion-root min-h-screen overflow-hidden bg-[#d9f7ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(244,253,255,0.96),rgba(204,243,255,0.84)_46%,rgba(70,190,230,0.48))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,116,158,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,116,158,0.1)_1px,transparent_1px)] bg-[size:74px_74px]" />
      </div>

      <div className="relative z-10">
        <UserNavbar active="" />

        <main className="mx-auto flex min-h-screen w-full max-w-[600px] flex-col justify-center px-4 pb-14 pt-32 sm:px-6">
          <section className="relative overflow-hidden rounded-[34px] border border-white/75 bg-white/74 p-8 text-center shadow-[0_32px_90px_rgba(2,74,138,0.14)] backdrop-blur-2xl sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(239,68,68,0.15),transparent_40%)]" />
            
            {verifying ? (
              <>
                {/* Loading icon */}
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)] animate-spin duration-1000">
                  <span className="material-symbols-outlined text-[54px] font-black">
                    sync
                  </span>
                </div>

                <h1 className="mt-8 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  Đang đồng bộ giao dịch...
                </h1>
                <p className="mt-4 text-base font-semibold leading-relaxed text-slate-500">
                  Hệ thống đang kiểm tra trạng thái hủy/lỗi thanh toán từ cổng PayOS. Xin vui lòng đợi.
                </p>
              </>
            ) : (
              <>
                {/* Error Icon */}
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 shadow-[0_0_40px_rgba(239,68,68,0.2)] animate-pulse">
                  <span className="material-symbols-outlined text-[54px] font-black">
                    cancel
                  </span>
                </div>

                <h1 className="mt-8 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                  {isWalletDeposit ? "Nạp tiền thất bại!" : "Thanh toán thất bại!"}
                </h1>
                <p className="mt-4 text-base font-semibold leading-relaxed text-slate-500">
                  {isWalletDeposit
                    ? "Giao dịch nạp tiền vào ví của bạn đã bị hủy bỏ hoặc không thể hoàn tất trên cổng thanh toán PayOS."
                    : "Giao dịch của bạn đã bị hủy bỏ hoặc không thể hoàn tất trên cổng thanh toán PayOS. Lịch hẹn chưa được xác nhận thanh toán."}
                </p>
                {error && (
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800 text-left">
                    ⚠️ {error}
                  </div>
                )}
              </>
            )}

            <div className="mt-8 space-y-3.5 rounded-[26px] border border-cyan-100 bg-white/50 p-6 text-left">
              {bookingCode && (
                <div className="flex justify-between border-b border-cyan-50/50 pb-3">
                  <span className="text-sm font-bold text-slate-500">Mã đơn hàng</span>
                  <span className="text-sm font-black text-slate-950 font-mono">{bookingCode}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-cyan-50/50 pb-3">
                <span className="text-sm font-bold text-slate-500">Phương thức</span>
                <span className="text-sm font-black text-slate-950">PayOS (Online Banking/VietQR)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-bold text-slate-500">Trạng thái</span>
                <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
                  Thất bại / Đã hủy
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isWalletDeposit ? (
                <button
                  type="button"
                  onClick={() => navigate("/profile?tab=wallet")}
                  className="flex-1 rounded-2xl bg-cyan-400 py-4 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300 active:scale-95"
                >
                  Nạp tiền lại
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/booking")}
                  className="flex-1 rounded-2xl bg-cyan-400 py-4 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(6,182,212,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300 active:scale-95"
                >
                  Đặt lịch lại
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-95"
              >
                Về trang chủ
              </button>
            </div>
            
            <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Hotline hỗ trợ kỹ thuật: 1900-1234
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
