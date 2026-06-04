import { useEffect, useState } from "react";
import StaffNavbar from "../../components/StaffNavbar";
import { assignBay, completeBay, getBays, getQueue } from "../../services/staffApi";

const TIER_BADGE = {
  Platinum: "border-[#8aebff] text-[#8aebff] bg-[#0c1324]",
  Gold: "border-[#4edea3] text-[#4edea3] bg-[#0c1324]",
  Silver: "border-[#3c494c] text-[#bbc9cd] bg-[#0c1324]",
  Late: "border-[#ffb4ab]/50 text-[#ffb4ab] bg-[#93000a]/20",
};

function QueueCard({ item, onAssign, isSelected }) {
  const badgeClass =
    TIER_BADGE[item.tier] || "border-[#3c494c] text-[#bbc9cd] bg-[#0c1324]";
  return (
    <div
      className={`border p-4 rounded flex items-center justify-between transition-all ${
        isSelected
          ? "border-[#8aebff] bg-[#8aebff]/5 shadow-[0_0_10px_rgba(138,235,255,0.1)]"
          : "border-[#23293c] bg-[#0c1324]"
      }`}
    >
      <div>
        <div
          className="text-[18px] font-bold tracking-wider text-[#dce1fb]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {item.plate}
        </div>
        <div className="text-[12px] text-[#bbc9cd] mt-1">
          Check-in: {item.checkinTime || item.time}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`border px-2 py-0.5 text-[10px] font-bold rounded uppercase ${badgeClass}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {item.tier}
        </span>
        <button
          type="button"
          onClick={onAssign}
          className={`border text-[11px] font-bold px-3 py-1.5 rounded uppercase transition-colors ${
            isSelected
              ? "bg-[#8aebff] text-[#00363e] border-[#8aebff]"
              : "border-[#8aebff] text-[#8aebff] hover:bg-[#8aebff]/10"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {isSelected ? "Đang chọn" : "Điều phối"}
        </button>
      </div>
    </div>
  );
}

function BayCard({ bay, onComplete, onAssignToBay, hasSelectedCar, disabled }) {
  return (
    <div
      className={`border rounded-lg p-5 flex flex-col justify-between min-h-[220px] transition-all duration-300 ${
        bay.status === "active"
          ? "border-[#4edea3] bg-[#0c1324] shadow-[0_0_15px_rgba(78,222,163,0.05)]"
          : hasSelectedCar
            ? "border-[#8aebff] bg-[#8aebff]/5 border-dashed animate-pulse"
            : "border-[#23293c] bg-[#0c1324]/40"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3
            className="text-[18px] font-bold text-[#dce1fb]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {bay.name}
          </h3>
          <p className="text-[12px] text-[#bbc9cd] mt-0.5">{bay.type}</p>
        </div>
        <span
          className={`text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
            bay.status === "active"
              ? "border-[#4edea3] text-[#4edea3] bg-[#4edea3]/5"
              : "border-[#3c494c] text-[#bbc9cd]"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {bay.status === "active" ? "ĐANG RỬA" : "TRỐNG"}
        </span>
      </div>

      {bay.status === "active" ? (
        <div className="my-4 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span
              className="font-bold text-[#4edea3]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {bay.currentCar?.plate}
            </span>
            <span
              className="text-[#bbc9cd]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {bay.currentCar?.progress || 0}%
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#1a2436] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4edea3] transition-all duration-500"
              style={{ width: `${bay.currentCar?.progress || 0}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="my-6 text-center text-[#bbc9cd] text-[13px] border border-dashed border-[#23293c] py-3 rounded bg-[#070d1f]/50">
          {hasSelectedCar
            ? "Khoang trống sẵn sàng tiếp nhận"
            : "Sẵn sàng tiếp nhận xe mới từ hàng đợi"}
        </div>
      )}

      <div className="border-t border-[#23293c] pt-3 flex justify-end min-h-[40px]">
        {bay.status === "active" ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onComplete}
            className="bg-[#4edea3] text-[#003822] text-[12px] font-bold px-4 py-2 rounded uppercase hover:bg-[#62f2b8] transition-all disabled:opacity-50"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Hoàn thành
          </button>
        ) : (
          hasSelectedCar && (
            <button
              type="button"
              disabled={disabled}
              onClick={onAssignToBay}
              className="bg-[#8aebff] text-[#00363e] text-[12px] font-bold px-4 py-2 rounded uppercase hover:bg-[#a2eeff] transition-all shadow-[0_0_10px_rgba(138,235,255,0.2)]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Vào khoang này
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function StaffQueue() {
  const [queue, setQueue] = useState([]);
  const [bays, setBays] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchQueueAndBays = async () => {
    setLoading(true);
    setError("");
    try {
      const [queueRes, baysRes] = await Promise.all([
        getQueue(),
        getBays(),
      ]);

      setQueue(
        Array.isArray(queueRes.data)
          ? queueRes.data
          : queueRes.data?.data || [],
      );
      setBays(
        Array.isArray(baysRes.data) ? baysRes.data : baysRes.data?.data || [],
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể đồng bộ dữ liệu khoang rửa và hàng đợi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueAndBays();
  }, []);

  const handleAssignToBay = async (bayId) => {
    if (!selectedCar || !bayId) return;
    setSubmitLoading(true);
    try {
      await assignBay(bayId, {
        queueId: selectedCar.id || selectedCar._id,
        plate: selectedCar.plate,
      });
      setSelectedCar(null);
      fetchQueueAndBays();
    } catch (err) {
      alert(
        err?.response?.data?.message || "Gặp lỗi khi điều phối xe vào khoang.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCompleteWash = async (bayId) => {
    if (!bayId) return;
    setSubmitLoading(true);
    try {
      await completeBay(bayId);
      fetchQueueAndBays();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Không thể cập nhật trạng thái hoàn thành.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1f] text-white lg:pl-64">
      <StaffNavbar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <header className="border-b border-[#23293c] pb-5">
            <h1
              className="text-[28px] font-bold text-[#dce1fb] tracking-wide"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ĐIỀU PHỐI KHOANG DỊCH VỤ
            </h1>
          </header>

          {error && (
            <div className="p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start flex-1">
            {/* LEFT Column - Hàng đợi điều phối */}
            <section className="w-full lg:w-[35%] flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1">
                <h2
                  className="text-[20px] font-semibold text-[#dce1fb]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Hàng Đợi Điều Phối
                </h2>
                <span
                  className="bg-[#23293c] border border-[#3c494c] px-2 py-1 rounded text-[#8aebff] text-[12px] font-bold tracking-widest"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {queue.length} XE ĐANG CHỜ
                </span>
              </div>

              {loading ? (
                <p className="text-sm text-[#8aebff] italic border border-dashed border-[#23293c] p-6 text-center rounded animate-pulse">
                  Đang tải dữ liệu hàng đợi...
                </p>
              ) : queue.length === 0 ? (
                <p className="text-sm text-[#bbc9cd] border border-dashed border-[#23293c] p-6 text-center rounded">
                  Hàng đợi đang trống.
                </p>
              ) : (
                queue.map((item) => (
                  <QueueCard
                    key={item.id || item._id}
                    item={item}
                    isSelected={
                      selectedCar?.id === item.id ||
                      selectedCar?._id === item._id
                    }
                    onAssign={() =>
                      setSelectedCar(
                        selectedCar?.id === item.id ||
                          selectedCar?._id === item._id
                          ? null
                          : item,
                      )
                    }
                  />
                ))
              )}
            </section>

            {/* RIGHT Column - Danh sách khoang dịch vụ */}
            <section className="w-full lg:w-[65%] flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1">
                <h2
                  className="text-[20px] font-semibold text-[#dce1fb]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Trạng Thái Khoang Rửa
                </h2>
              </div>

              {loading ? (
                <p className="text-sm text-[#8aebff] italic border border-dashed border-[#23293c] p-6 text-center rounded animate-pulse">
                  Đang kiểm tra trạng thái các khoang...
                </p>
              ) : bays.length === 0 ? (
                <p className="text-sm text-[#bbc9cd] border border-dashed border-[#23293c] p-6 text-center rounded">
                  Chưa có khoang rửa nào.
                </p>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
                  {bays.map((bay) => (
                    <BayCard
                      key={bay.id || bay._id}
                      bay={bay}
                      disabled={submitLoading}
                      hasSelectedCar={!!selectedCar}
                      onComplete={() => handleCompleteWash(bay.id || bay._id)}
                      onAssignToBay={() => handleAssignToBay(bay.id || bay._id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
