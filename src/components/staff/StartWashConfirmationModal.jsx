import { useEffect } from "react";

const getServiceName = (service) => {
  if (typeof service === "string") return service;
  return (
    service?.serviceName ||
    service?.name ||
    service?.label ||
    service?.description ||
    "Dịch vụ rửa xe"
  );
};

export default function StartWashConfirmationModal({
  isOpen,
  bay,
  vehicle,
  services = [],
  isLoading = false,
  error = "",
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const serviceNames = services.map(getServiceName).filter(Boolean);
  const plate =
    vehicle?.plate ||
    vehicle?.licensePlate ||
    vehicle?.vehicleLicensePlate ||
    vehicle?.vehicle?.licensePlate ||
    "";

  const closeIfReady = () => {
    if (!isLoading) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#03111a]/80 px-4 py-6 backdrop-blur-md"
      onMouseDown={closeIfReady}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-wash-title"
        className="staff-reveal w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#72f3ff]/25 bg-[#071620] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative border-b border-[#244653] bg-gradient-to-br from-[#0f3340] via-[#0b2532] to-[#071620] p-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={closeIfReady}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#b8d8de] transition hover:border-[#72f3ff]/50 hover:text-[#72f3ff] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#72f3ff]/45 bg-[#72f3ff]/12 text-[#72f3ff] shadow-[0_0_24px_rgba(114,243,255,0.16)]">
              <span className="material-symbols-outlined text-[28px]">
                local_car_wash
              </span>
            </div>
            <div>
              <p
                className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#72f3ff]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Xác nhận thao tác
              </p>
              <h2
                id="start-wash-title"
                className="text-2xl font-black leading-tight text-[#ecfeff]"
              >
                Xác nhận bắt đầu rửa xe
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#b8d8de]">
                Bạn có chắc chắn muốn bắt đầu thực hiện dịch vụ cho xe tại
                khoang này không?
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {(bay?.name || plate || serviceNames.length > 0) && (
            <div className="grid gap-3 rounded-2xl border border-[#244653] bg-[#03111a]/70 p-4 sm:grid-cols-2">
              {bay?.name && (
                <div>
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6ff6df]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Khoang rửa
                  </p>
                  <p className="mt-1 font-bold text-[#ecfeff]">{bay.name}</p>
                </div>
              )}

              {plate && (
                <div>
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6ff6df]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Biển số xe
                  </p>
                  <p
                    className="mt-1 font-black tracking-widest text-[#ecfeff]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {plate}
                  </p>
                </div>
              )}

              {serviceNames.length > 0 && (
                <div className="sm:col-span-2">
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6ff6df]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Dịch vụ đã chọn
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {serviceNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-full border border-[#72f3ff]/25 bg-[#72f3ff]/10 px-3 py-1 text-xs font-semibold text-[#ecfeff]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr]">
            <button
              type="button"
              disabled={isLoading}
              onClick={closeIfReady}
              className="rounded-2xl border border-[#244653] bg-white/5 px-5 py-3 font-bold text-[#dff7fb] transition hover:border-[#72f3ff]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#72f3ff] px-5 py-3 font-black text-[#061427] shadow-[0_16px_34px_rgba(114,243,255,0.22)] transition hover:bg-[#a5f7ff] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#061427]/30 border-t-[#061427]" />
              )}
              {isLoading ? "Đang bắt đầu..." : "Bắt đầu rửa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
