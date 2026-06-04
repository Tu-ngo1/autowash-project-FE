import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/UserNavbar";
import { getUser } from "../../utils/auth";
import { getMyBookings } from "../../services/bookingApi";

// Đưa mảng tĩnh ra ngoài component để tránh khởi tạo lại khi render
const VOUCHERS_DATA = [
  {
    title: "Giảm 50.000đ",
    desc: "Cho dịch vụ Rửa xe tiêu chuẩn",
    points: 500,
    icon: "local_offer",
  },
  {
    title: "Vệ sinh nội thất",
    desc: "Giảm giá 15% gói chuyên sâu",
    points: 1200,
    icon: "directions_car",
  },
];

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Lấy thông tin User (Khuyến khích dùng string từ localStorage để so sánh dependency chính xác)
  const user = useMemo(() => getUser() || {}, []);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getMyBookings();
        const bookings = Array.isArray(response.data)
          ? response.data
          : response.data?.bookings || response.data?.data || [];
        if (isMounted) setHistory(bookings);
      } catch {
        if (isMounted) {
          setHistory([]);
          setError("Không thể tải lịch sử đặt lịch.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Tính toán hạng thành viên dựa trên tier thực tế
  const customerTierInfo = useMemo(() => {
    const tier = user.tier || "Member";
    switch (tier) {
      case "Platinum":
        return {
          label: "Hạng Bạch Kim",
          progress: 100,
          pointsToNext: 0,
          nextTier: "Max",
        };
      case "Gold":
        return {
          label: "Hạng Vàng",
          progress: 75,
          pointsToNext: 4000,
          nextTier: "Platinum",
        };
      case "Silver":
        return {
          label: "Hạng Bạc",
          progress: 40,
          pointsToNext: 1800,
          nextTier: "Gold",
        };
      default:
        return {
          label: "Hạng Thành Viên",
          progress: 10,
          pointsToNext: 1200,
          nextTier: "Silver",
        };
    }
  }, [user.tier]);

  // 3. Tự động tạo Avatar mặc định
  const avatarUrl = useMemo(() => {
    const targetSrc = user.avatar || user.picture || user.photoURL;
    if (targetSrc) return targetSrc;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "Khách hàng")}&background=d2e4ff&color=0061a5&bold=true`;
  }, [user.avatar, user.name, user.photoURL, user.picture]);

  // Các hàm helper định dạng dữ liệu
  const formatCurrency = (value) => {
    if (value == null || value === "") return "0đ";
    const number = typeof value === "number" ? value : Number(value);
    return Number.isNaN(number)
      ? String(value)
      : number.toLocaleString("vi-VN") + "đ";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-50 text-[#10B981]";
      case "CANCELLED":
        return "bg-red-50 text-[#ba1a1a]";
      default:
        return "bg-amber-50 text-amber-600";
    }
  };

  const getStatusLabel = (status) => {
    if (status === "COMPLETED") return "Hoàn thành";
    if (status === "CANCELLED") return "Đã hủy";
    return "Chờ phục vụ";
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen font-[Inter,sans-serif]">
      <UserNavbar active="Profile" />

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10 xl:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#d2e4ff] shadow-md"
                />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#10B981] rounded-full border-4 border-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#191c1e] mb-1">
                {user.name || "Khách hàng"}
              </h1>
              <p className="text-gray-500 mb-4 text-sm">
                {user.phone || user.email || "Thành viên autoWash"}
              </p>
              <div className="bg-[#a5eeff] text-[#001f25] px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                ⭐ {customerTierInfo.label}
              </div>
            </div>

            <div className="bg-[#0061a5] text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-2">
                  Điểm thưởng hiện tại
                </p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-bold leading-none">
                    {(user.points || 0).toLocaleString("vi-VN")}
                  </span>
                  <span className="text-lg">điểm</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Tiến trình nâng hạng tiếp theo</span>
                    <span>{customerTierInfo.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00e0ff] h-full rounded-full transition-all duration-300"
                      style={{ width: `${customerTierInfo.progress}%` }}
                    />
                  </div>
                  {customerTierInfo.pointsToNext > 0 && (
                    <p className="text-xs opacity-70 italic text-right">
                      Còn{" "}
                      {customerTierInfo.pointsToNext.toLocaleString("vi-VN")}{" "}
                      điểm để lên hạng {customerTierInfo.nextTier}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* VOUCHERS */}
            <section>
              <div className="flex justify-between items-end mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-[#191c1e]">
                    Voucher khuyên dùng
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Đổi điểm tích lũy ngay để nhận ưu đãi chăm sóc xe chuyên sâu
                  </p>
                </div>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-[#0061a5] font-bold hover:underline text-sm"
                >
                  Đổi thêm quà
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VOUCHERS_DATA.map((v) => (
                  <div
                    key={v.title}
                    onClick={() => navigate("/dashboard")}
                    className="bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-xl p-6 flex gap-4 items-center group hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-[#E0F2FE] rounded-lg flex items-center justify-center flex-shrink-0 text-2xl text-[#0061a5]">
                      <span className="material-symbols-outlined">
                        {v.icon}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-[#191c1e]">{v.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{v.desc}</p>
                      <p className="text-xs text-[#0061a5] font-bold mt-2">
                        {v.points.toLocaleString("vi-VN")} điểm
                      </p>
                    </div>
                    <button className="bg-[#0061a5] text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                      🎁
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* HISTORY */}
            <section>
              <div className="flex justify-between items-end mb-5">
                <h2 className="text-2xl font-bold text-[#191c1e]">
                  Lịch sử hoạt động gần đây
                </h2>
                <button
                  onClick={() => navigate("/history")}
                  className="text-gray-500 flex items-center gap-1.5 hover:text-[#0061a5] transition-colors text-sm font-medium"
                >
                  Xem chi tiết ➔
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Đang tải lịch sử...
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    {error || "Bạn chưa có lịch sử đặt lịch nào."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-[#f2f4f6] border-b border-gray-200/60">
                          {[
                            "Dịch vụ / Mã",
                            "Ngày thực hiện",
                            "Trạng thái",
                            "Tổng tiền",
                          ].map((h, i) => (
                            <th
                              key={h}
                              className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider ${
                                i === 3 ? "text-right" : ""
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {history.map((row, index) => (
                          <tr
                            key={row.id || index}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-bold text-[#191c1e] text-sm">
                                {row.service || "Rửa xe tiêu chuẩn"}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {row.id ? `#AW-${row.id}` : "#AW-LATEST"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-sm">
                              {row.date || "--/--/----"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusStyle(
                                  row.status,
                                )}`}
                              >
                                {getStatusLabel(row.status)}
                              </span>
                            </td>
                            <td
                              className={`px-6 py-4 text-right font-bold text-sm ${
                                row.status === "CANCELLED"
                                  ? "text-gray-400"
                                  : "text-[#0061a5]"
                              }`}
                            >
                              {formatCurrency(row.price || row.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => navigate("/history")}
                  className="border border-[#0061a5] text-[#0061a5] px-8 py-2 rounded-full font-bold hover:bg-[#E0F2FE] transition-colors text-sm"
                >
                  Xem tất cả lịch sử lịch hẹn
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#e0e3e5] border-t border-gray-300/50 mt-16">
        <div className="flex w-full flex-col items-center justify-between gap-8 px-4 py-12 sm:px-6 md:flex-row lg:px-10 xl:px-14">
          <div className="flex flex-col items-center md:items-start">
            <div className="text-xl font-bold text-[#191c1e] mb-1">
              autoWash
            </div>
            <p className="text-gray-500 text-sm text-center md:text-left max-w-xs">
              Giải pháp chăm sóc xe chuyên nghiệp với công nghệ hiện đại nhất.
            </p>
          </div>
          <div className="flex gap-6 flex-wrap justify-center text-sm text-gray-500">
            {[
              "Về chúng tôi",
              "Điều khoản dịch vụ",
              "Chính sách bảo mật",
              "Liên hệ",
            ].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-[#0061a5] transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="text-gray-400 text-xs">
            © 2026 autoWash - Giải pháp chăm sóc xe chuyên nghiệp
          </p>
        </div>
      </footer>
    </div>
  );
}
