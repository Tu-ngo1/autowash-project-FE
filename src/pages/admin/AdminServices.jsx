// src/pages/admin/AdminServices.jsx
import { useState, useEffect } from "react";
import {
  createService as createServiceApi,
  deleteService as deleteServiceApi,
  getAdminServices,
  updateService as updateServiceApi,
} from "../../services/serviceApi";

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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-headline-lg text-on-surface">
              Quản lý Gói Dịch Vụ & Vận Hành
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Thiết lập và quản lý các gói dịch vụ rửa xe
            </p>
          </div>
          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="bg-primary text-on-primary h-10 px-6 font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-primary-fixed-dim transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>{" "}
            Thêm Gói Dịch Vụ Mới
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-surface-container-low border border-outline-variant">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest border-b border-outline-variant">
                <th className="px-6 py-4 font-label-caps text-on-surface-variant text-[11px]">
                  Tên Gói Dịch Vụ
                </th>
                <th className="px-6 py-4 font-label-caps text-on-surface-variant text-[11px]">
                  Giá Tiền (đ)
                </th>
                <th className="px-6 py-4 font-label-caps text-on-surface-variant text-[11px]">
                  Dự Kiến (Phút)
                </th>
                <th className="px-6 py-4 font-label-caps text-on-surface-variant text-[11px]">
                  Mô Tả Ngắn
                </th>
                <th className="px-6 py-4 font-label-caps text-on-surface-variant text-[11px]">
                  Trạng Thái
                </th>
                <th className="px-6 py-4 font-label-caps text-on-surface-variant text-[11px] text-right">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-on-surface-variant"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-on-surface-variant"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-surface-container-high transition-colors"
                  >
                    <td className="px-6 py-5 text-white font-medium">
                      {service.name}
                    </td>
                    <td className="px-6 py-5 font-data-display text-white">
                      {service.price?.toLocaleString()}đ
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">
                          schedule
                        </span>
                        <span className="font-data-display">
                          {service.duration} min
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant">
                      {service.description}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${service.status === "ACTIVE" ? "bg-secondary" : "bg-error"}`}
                        ></div>
                        <span className="font-label-caps text-[10px]">
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
                          className="text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="text-on-surface-variant hover:text-error transition-colors"
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-container-low border-l border-outline-variant shadow-2xl flex flex-col h-full">
      <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
        <div className="flex flex-col gap-1">
          <h2 className="text-headline-md text-on-surface">
            {mode === "add" ? "Thêm Gói Dịch Vụ" : "Chỉnh sửa Gói Dịch Vụ"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-label-caps text-on-surface-variant text-[10px] tracking-widest uppercase">
              Cấu hình tham số vận hành
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-on-surface-variant hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-label-caps text-on-surface-variant text-[12px]">
            Tên gói dịch vụ
          </label>
          <input
            className="bg-surface-container-high border border-outline-variant text-on-surface h-10 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
            placeholder="Ví dụ: Standard Wash"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-label-caps text-on-surface-variant text-[12px]">
            Giá tiền (VND)
          </label>
          <div className="relative">
            <input
              type="number"
              className="bg-surface-container-high border border-outline-variant text-on-surface h-10 px-3 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full font-data-display"
              placeholder="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseInt(e.target.value) })
              }
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-data-display text-[12px]">
              VND
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-label-caps text-on-surface-variant text-[12px]">
            Thời gian thực hiện (Phút)
          </label>
          <div className="relative">
            <input
              type="number"
              className="bg-surface-container-high border border-outline-variant text-on-surface h-10 px-3 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full font-data-display"
              placeholder="30"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: parseInt(e.target.value) })
              }
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-data-display text-[12px]">
              MIN
            </span>
          </div>
          <div className="mt-1 p-3 bg-primary/5 border-l-2 border-primary-container">
            <p className="text-[11px] text-on-surface-variant italic leading-relaxed">
              Lưu ý: Thông số này dùng để tính toán bộ đếm ngược và thời gian
              chờ trong hàng đợi cho nhân viên Staff.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-label-caps text-on-surface-variant text-[12px]">
            Mô tả chi tiết
          </label>
          <textarea
            className="bg-surface-container-high border border-outline-variant text-on-surface p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full resize-none"
            placeholder="Mô tả các hạng mục trong gói dịch vụ này..."
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
          <div>
            <span className="text-body-md font-semibold text-white">
              Kích hoạt ngay
            </span>
            <p className="text-[10px] text-on-surface-variant">
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
              className="toggle-checkbox absolute block w-5 h-5 bg-white border-2 border-outline-variant appearance-none cursor-pointer z-10 transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-secondary"
            />
            <label className="toggle-label block overflow-hidden h-5 bg-surface-container-highest border-2 border-outline-variant cursor-pointer transition-colors duration-200 ease-in-out"></label>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-outline-variant bg-surface-container flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors font-label-caps py-3 text-[12px] uppercase tracking-widest"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 bg-primary hover:bg-primary-fixed-dim text-on-primary transition-colors font-label-caps py-3 text-[12px] uppercase tracking-widest active:scale-[0.98]"
        >
          {mode === "add" ? "Lưu Gói Dịch Vụ" : "Cập nhật"}
        </button>
      </div>
    </div>
  );
}
