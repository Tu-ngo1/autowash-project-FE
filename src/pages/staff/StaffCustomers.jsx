import { useEffect, useState } from "react";
import StaffNavbar from "../../components/StaffNavbar";
import { createStaffCustomer, getStaffCustomers } from "../../services/staffApi";

function AddCustomerDrawer({ onClose, onAdd, loading }) {
  const [form, setForm] = useState({ name: "", phone: "", plate: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.plate) return;
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-[#0c1324] border-l border-[#3c494c] h-full p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex justify-between items-center pb-5 border-b border-[#23293c] mb-6">
            <h3
              className="text-[18px] font-bold text-[#8aebff]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [ THÊM KHÁCH HÀNG ]
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-[#bbc9cd] hover:text-white transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
            <div>
              <label className="block text-[#bbc9cd] mb-1 font-medium">
                Họ và tên khách hàng
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#070d1f] border border-[#3c494c] px-3 py-2 rounded text-white focus:border-[#8aebff] outline-none transition-colors disabled:opacity-50"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-[#bbc9cd] mb-1 font-medium">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-[#070d1f] border border-[#3c494c] px-3 py-2 rounded text-white focus:border-[#8aebff] outline-none transition-colors disabled:opacity-50"
                placeholder="09xx xxx xxx"
              />
            </div>
            <div>
              <label className="block text-[#bbc9cd] mb-1 font-medium">
                Biển số xe đăng ký
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                className="w-full bg-[#070d1f] border border-[#3c494c] px-3 py-2 rounded text-white focus:border-[#8aebff] outline-none transition-colors uppercase disabled:opacity-50"
                placeholder="30A-123.45"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8aebff] text-[#00363e] font-bold py-2.5 rounded mt-6 hover:bg-[#a2eeff] transition-all tracking-wider disabled:bg-slate-500 disabled:text-slate-300"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {loading ? "ĐANG LƯU..." : "LƯU THÔNG TIN KHÁCH HÀNG"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StaffCustomers() {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCustomers = async (currentPage) => {
    setLoading(true);
    setError("");
    try {
      const response = await getStaffCustomers(currentPage);

      if (Array.isArray(response.data)) {
        setCustomers(response.data);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setCustomers(response.data.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải danh sách khách hàng.",
      );
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(page);
  }, [page]);

  const handleAddCustomer = async (data) => {
    setSubmitLoading(true);
    setError("");
    try {
      await createStaffCustomer({
        name: data.name,
        phone: data.phone,
        plate: data.plate.toUpperCase(),
      });

      setShowDrawer(false);
      setPage(1);
      fetchCustomers(1);
    } catch (err) {
      alert(
        err?.response?.data?.message || "Lỗi khi lưu thông tin khách hàng.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1f] text-white lg:pl-64">
      <StaffNavbar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="mx-auto w-full max-w-[1600px] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <header className="mb-8 border-b border-[#23293c] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-[28px] font-bold text-[#dce1fb] tracking-wide"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                QUẢN LÝ KHÁCH HÀNG
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="bg-[#8aebff] text-[#00363e] font-bold text-[13px] tracking-widest uppercase px-4 py-2.5 rounded flex items-center gap-2 hover:bg-[#a2eeff] transition-all"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>{" "}
              THÊM MỚI
            </button>
          </header>

          {error && (
            <div className="mb-4 p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div className="bg-[#0c1324] border border-[#23293c] rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr
                    className="border-b border-[#23293c] bg-[#11192e] text-[#bbc9cd] tracking-wider uppercase"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Số điện thoại</th>
                    <th className="p-4">Biển số</th>
                    <th className="p-4">Hạng thành viên</th>
                    <th className="p-4 text-right">Điểm tích lũy</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-12 text-center text-[#8aebff] italic animate-pulse"
                      >
                        Đang tải dữ liệu từ hệ thống...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-12 text-center text-[#bbc9cd] italic"
                      >
                        Không tìm thấy dữ liệu khách hàng nào trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr
                        key={customer.id || customer._id}
                        className="border-b border-[#161f35] hover:bg-[#11192e]/50 transition-colors"
                      >
                        <td className="p-4 font-semibold text-[#dce1fb]">
                          {customer.name}
                        </td>
                        <td className="p-4 text-[#bbc9cd]">{customer.phone}</td>
                        <td
                          className="p-4 font-bold tracking-wider text-[#8aebff]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {customer.plate}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold border border-[#3c494c] bg-[#070d1f] text-[#bbc9cd]">
                            {customer.tier || "Member"}
                          </span>
                        </td>
                        <td
                          className="p-4 text-right font-bold text-[#4edea3]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {(customer.points || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#11192e] border-t border-[#23293c] flex justify-between items-center">
              <span
                className="text-[12px] text-[#bbc9cd]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Trang {page}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 1 || loading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="w-8 h-8 flex items-center justify-center border border-[#3c494c] text-[#bbc9cd] hover:border-[#8aebff] hover:text-[#8aebff] transition-colors rounded disabled:opacity-30 disabled:hover:border-[#3c494c] disabled:hover:text-[#bbc9cd]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>
                <span
                  className="w-8 h-8 flex items-center justify-center border border-[#8aebff] text-[#8aebff] bg-[#8aebff]/10 text-[12px] font-bold rounded"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {page}
                </span>
                <button
                  type="button"
                  disabled={loading || customers.length === 0}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-[#3c494c] text-[#bbc9cd] hover:border-[#8aebff] hover:text-[#8aebff] transition-colors rounded disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showDrawer && (
        <AddCustomerDrawer
          onClose={() => setShowDrawer(false)}
          onAdd={handleAddCustomer}
          loading={submitLoading}
        />
      )}
    </div>
  );
}
