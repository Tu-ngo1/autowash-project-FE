// src/pages/admin/AdminServices.jsx
import { useState, useEffect } from "react";
import {
  createService as createServiceApi,
  deleteService as deleteServiceApi,
  getAdminServices,
  updateService as updateServiceApi,
} from "../../services/adminServiceApi";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await getAdminServices();
      setServices(res.data);
    } catch (err) {
      console.error("Failed to load services:", err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const createService = async (data) => {
    try {
      await createServiceApi(data);
      fetchServices();
      setIsAddDrawerOpen(false);
    } catch (err) {
      console.error("Failed to create service:", err);
    }
  };

  const updateService = async (id, data) => {
    try {
      await updateServiceApi(id, data);
      fetchServices();
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Failed to update service:", err);
    }
  };

  const deleteService = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa gói dịch vụ này?")) {
      try {
        await deleteServiceApi(id);
        fetchServices();
      } catch (err) {
        console.error("Failed to delete service:", err);
      }
    }
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
                  SERVICE OPS
                </span>
                <span className="border border-zinc-800 bg-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  <span className="admin-pulse mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  PRICE MATRIX
                </span>
              </div>
            <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
              Service Control
            </h1>
            <p className="mt-3 max-w-3xl font-mono text-xs font-bold uppercase leading-6 tracking-[0.14em] text-zinc-500">
              Thiết lập gói rửa, giá tiền, thời lượng và trạng thái vận hành.
            </p>
          </div>
          <button
            onClick={() => setIsAddDrawerOpen(true)}
              className="flex h-11 items-center gap-2 border border-cyan-400/60 bg-cyan-400/10 px-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>{" "}
            New Service
          </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="admin-reveal overflow-x-auto border border-zinc-800 bg-zinc-950" style={{ animationDelay: "140ms" }}>
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-black">
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Tên Gói Dịch Vụ
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Giá Tiền (đ)
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Dự Kiến (Phút)
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Mô Tả Ngắn
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Trạng Thái
                </th>
                <th className="px-6 py-4 text-right font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                services.map((service, index) => (
                  <tr
                    key={service.id}
                    className="admin-reveal transition duration-200 hover:translate-x-1 hover:bg-cyan-400/[0.04]"
                    style={{ animationDelay: `${220 + index * 45}ms` }}
                  >
                    <td className="px-6 py-5 font-black text-zinc-100">
                      {service.name}
                    </td>
                    <td className="px-6 py-5 font-black text-cyan-300">
                      {service.price?.toLocaleString()}đ
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <span className="material-symbols-outlined text-[18px]">
                          schedule
                        </span>
                        <span className="font-data-display">
                          {service.duration} min
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-zinc-400">
                      {service.description}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${service.status === "ACTIVE" ? "bg-emerald-300" : "bg-red-300"}`}
                        ></div>
                        <span className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300">
                          {service.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setIsDrawerOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="flex h-8 w-8 items-center justify-center border border-red-400/40 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                        >
                          <span className="material-symbols-outlined text-[20px]">
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
      </div>

      {/* Add Service Drawer */}
      {isAddDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAddDrawerOpen(false)}
          ></div>
          <ServiceDrawer
            mode="add"
            onClose={() => setIsAddDrawerOpen(false)}
            onSave={createService}
          />
        </>
      )}

      {/* Edit Service Drawer */}
      {isDrawerOpen && selectedService && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <ServiceDrawer
            mode="edit"
            service={selectedService}
            onClose={() => setIsDrawerOpen(false)}
            onSave={(data) => updateService(selectedService.id, data)}
          />
        </>
      )}
    </div>
  );
}

// Service Drawer Component (Reusable for Add/Edit)
function ServiceDrawer({ mode, service, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: service?.name || "",
    price: service?.price || "",
    duration: service?.duration || "",
    description: service?.description || "",
    status: service?.status || "ACTIVE",
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="admin-reveal fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-black px-6 py-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            {mode === "add" ? "NEW SERVICE" : "EDIT SERVICE"}
          </p>
          <h2 className="text-headline-md text-zinc-100">
            {mode === "add" ? "Thêm Gói Dịch Vụ" : "Chỉnh sửa Gói Dịch Vụ"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
              Cấu hình tham số vận hành
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 transition-colors hover:text-cyan-300"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Tên gói dịch vụ
          </label>
          <input
            className="h-10 w-full border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
            placeholder="Ví dụ: Standard Wash"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Giá tiền (VND)
          </label>
          <div className="relative">
            <input
              type="number"
              className="h-10 w-full border border-zinc-800 bg-black px-3 pr-12 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
              placeholder="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseInt(e.target.value) })
              }
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-zinc-500">
              VND
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Thời gian thực hiện (Phút)
          </label>
          <div className="relative">
            <input
              type="number"
              className="h-10 w-full border border-zinc-800 bg-black px-3 pr-12 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
              placeholder="30"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: parseInt(e.target.value) })
              }
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-zinc-500">
              MIN
            </span>
          </div>
          <div className="mt-1 border-l-2 border-cyan-400/50 bg-cyan-400/10 p-3">
            <p className="text-[11px] font-semibold leading-relaxed text-zinc-400">
              Lưu ý: Thông số này dùng để tính toán bộ đếm ngược và thời gian
              chờ trong hàng đợi cho nhân viên Staff.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Mô tả chi tiết
          </label>
          <textarea
            className="w-full resize-none border border-zinc-800 bg-black p-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
            placeholder="Mô tả các hạng mục trong gói dịch vụ này..."
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <div>
            <span className="font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-100">
              Kích hoạt ngay
            </span>
            <p className="text-[10px] text-zinc-500">
              Hiển thị gói này trên ứng dụng khách hàng
            </p>
          </div>
          <div className="relative inline-block w-10 h-5 align-middle select-none">
            <input
              checked={formData.status === "ACTIVE"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.checked ? "ACTIVE" : "INACTIVE",
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
          onClick={onClose}
          className="flex-1 border border-zinc-800 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-600"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 border border-cyan-400/60 bg-cyan-400/10 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/20 active:scale-[0.98]"
        >
          {mode === "add" ? "Lưu Gói Dịch Vụ" : "Cập nhật"}
        </button>
      </div>
    </div>
  );
}
