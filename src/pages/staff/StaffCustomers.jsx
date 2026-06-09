import { useEffect, useState } from "react";
import StaffNavbar from "../../components/StaffNavbar";
import { createStaffCustomer, getStaffCustomers } from "../../services/staffCustomerApi";
import { getFriendlyErrorMessage } from "../../utils/errorMessage";

function AddCustomerDrawer({ onClose, onAdd, loading }) {
  const [form, setForm] = useState({ name: "", phone: "", plate: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.plate) return;
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 bg-black/66 backdrop-blur-md z-[100] flex justify-end animate-fadeIn">
      <div className="staff-panel staff-reveal w-full max-w-md border-l border-cyan-100/20 h-full p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex justify-between items-center pb-5 border-b border-[#244653] mb-6">
            <h3
              className="text-[18px] font-bold text-[#6ff6df]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [ THÊM KHÁCH HÀNG ]
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-[#b8d8de] hover:text-white transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
            <div>
              <label className="block text-[#b8d8de] mb-1 font-medium">
                Họ và tên khách hàng
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0b2532] border border-teal-100/20 px-3 py-3 rounded-2xl text-white focus:border-[#6ff6df] outline-none transition-colors disabled:opacity-50"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-[#b8d8de] mb-1 font-medium">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-[#0b2532] border border-teal-100/20 px-3 py-3 rounded-2xl text-white focus:border-[#6ff6df] outline-none transition-colors disabled:opacity-50"
                placeholder="09xx xxx xxx"
              />
            </div>
            <div>
              <label className="block text-[#b8d8de] mb-1 font-medium">
                Biển số xe đăng ký
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                className="w-full bg-[#0b2532] border border-teal-100/20 px-3 py-3 rounded-2xl text-white focus:border-[#6ff6df] outline-none transition-colors uppercase disabled:opacity-50"
                placeholder="30A-123.45"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6ff6df] text-[#06343a] font-bold py-3 rounded-2xl mt-6 hover:bg-[#9fffee] transition-all tracking-wider disabled:bg-slate-500 disabled:text-slate-300 active:scale-[0.98]"
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
        getFriendlyErrorMessage(
          err,
          "Không thể tải danh sách khách hàng. Vui lòng thử lại sau.",
        ),
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
        getFriendlyErrorMessage(
          err,
          "Không thể lưu thông tin khách hàng. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="staff-motion-root min-h-screen text-white lg:pl-64">
      <StaffNavbar />
      <div className="staff-shell flex-1 flex flex-col min-w-0">
        <main className="mx-auto w-full max-w-[1600px] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <header className="staff-reveal mb-8 border-b border-cyan-100/15 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-[28px] font-bold text-[#ecfeff] tracking-wide"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                QUẢN LÝ KHÁCH HÀNG
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="bg-[#6ff6df] text-[#06343a] font-bold text-[13px] tracking-widest uppercase px-4 py-3 rounded-2xl flex items-center gap-2 hover:bg-[#9fffee] transition-all active:scale-[0.98] shadow-[0_16px_40px_rgba(94,234,212,0.18)]"
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

          <div className="staff-panel staff-reveal rounded-3xl overflow-hidden" style={{ animationDelay: "100ms" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr
                    className="border-b border-teal-100/15 bg-white/[0.04] text-[#b8d8de] tracking-wider uppercase"
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
                        className="p-12 text-center text-[#6ff6df] italic animate-pulse"
                      >
                        Đang tải dữ liệu từ hệ thống...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-12 text-center text-[#b8d8de] italic"
                      >
                        Không tìm thấy dữ liệu khách hàng nào trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr
                        key={customer.id || customer._id}
                        className="border-b border-teal-100/10 hover:bg-white/[0.05] transition-colors"
                      >
                        <td className="p-4 font-semibold text-[#ecfeff]">
                          {customer.name}
                        </td>
                        <td className="p-4 text-[#b8d8de]">{customer.phone}</td>
                        <td
                          className="p-4 font-bold tracking-wider text-[#6ff6df]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {customer.plate}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold border border-[#4f7883] bg-[#0b2532] text-[#b8d8de]">
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

            <div className="p-4 bg-white/[0.04] border-t border-cyan-100/15 flex justify-between items-center">
              <span
                className="text-[12px] text-[#b8d8de]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Trang {page}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 1 || loading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="w-8 h-8 flex items-center justify-center border border-[#4f7883] text-[#b8d8de] hover:border-[#6ff6df] hover:text-[#6ff6df] transition-colors rounded disabled:opacity-30 disabled:hover:border-[#4f7883] disabled:hover:text-[#b8d8de]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>
                <span
                  className="w-8 h-8 flex items-center justify-center border border-[#6ff6df] text-[#6ff6df] bg-[#6ff6df]/10 text-[12px] font-bold rounded"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {page}
                </span>
                <button
                  type="button"
                  disabled={loading || customers.length === 0}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-[#4f7883] text-[#b8d8de] hover:border-[#6ff6df] hover:text-[#6ff6df] transition-colors rounded disabled:opacity-30"
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
