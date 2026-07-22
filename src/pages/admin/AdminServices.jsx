// src/pages/admin/AdminServices.jsx
import { Fragment, useState, useEffect } from "react";
import {
  createService as createServiceApi,
  deleteService as deleteServiceApi,
  getAdminServices,
  updateService as updateServiceApi,
  updateServiceStatus as updateServiceStatusApi,
} from "../../services/adminServiceApi";
const VEHICLE_SIZE_LABELS = {
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
  XLARGE: "XLarge",
};

const DEFAULT_SERVICE_PRICES = [
  { vehicleSize: "SMALL", price: "", duration: "" },
  { vehicleSize: "MEDIUM", price: "", duration: "" },
  { vehicleSize: "LARGE", price: "", duration: "" },
];

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
        checked ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]" : "bg-zinc-800"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const getServicePrices = (service = {}) => {
  if (Array.isArray(service.servicePrices)) return service.servicePrices;
  if (Array.isArray(service.prices)) return service.prices;

  if (service.price || service.duration) {
    return [
      {
        id: `${service.id || "service"}-default`,
        vehicleSize: "DEFAULT",
        vehicleLabel: "Default",
        price: service.price,
        duration: service.duration,
        active: service.status === "ACTIVE",
      },
    ];
  }

  return [];
};

const getServiceId = (service = {}) =>
  service.id ?? service.serviceId ?? service.washServiceId;

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("vi-VN") + "đ";
};

const getPriceRange = (service) => {
  const prices = getServicePrices(service)
    .map((item) => Number(item.price))
    .filter(Number.isFinite);

  if (!prices.length) return "-";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

const getDurationRange = (service) => {
  const durations = getServicePrices(service)
    .map((item) => Number(item.durationMinutes ?? item.duration))
    .filter(Number.isFinite);

  if (!durations.length) return "-";

  const min = Math.min(...durations);
  const max = Math.max(...durations);

  if (min === max) return `${min}m`;
  return `${min}m - ${max}m`;
};

const getVehicleLabel = (price) => {
  return (
    price.vehicleLabel ||
    VEHICLE_SIZE_LABELS[price.vehicleSize] ||
    price.vehicleSize ||
    "Default"
  );
};

const getIsMainService = (service = {}) => {
  if (typeof service.isMainService === "boolean") return service.isMainService;
  if (typeof service.mainService === "boolean") return service.mainService;
  if (service.type) return String(service.type).toUpperCase() === "MAIN";
  return true;
};

const getServiceStatus = (service = {}) => {
  if (typeof service.active === "boolean") {
    return service.active ? "ACTIVE" : "INACTIVE";
  }
  if (typeof service.isActive === "boolean") {
    return service.isActive ? "ACTIVE" : "INACTIVE";
  }
  return String(service.status || "ACTIVE").toUpperCase() === "INACTIVE"
    ? "INACTIVE"
    : "ACTIVE";
};

const getNewestValue = (item = {}) => {
  const rawDate =
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at;
  const parsedDate = rawDate ? new Date(rawDate).getTime() : NaN;
  if (Number.isFinite(parsedDate)) return parsedDate;
  return Number(getServiceId(item) || 0);
};

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await getAdminServices();
      const payload = res.data?.data ?? res.data;
      const data = Array.isArray(payload)
        ? payload
        : payload?.services || payload?.items || [];
      setServices([...data].sort((a, b) => getNewestValue(b) - getNewestValue(a)));
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
    if (!id) return;
    try {
      await updateServiceApi(id, data);
      fetchServices();
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Failed to update service:", err);
    }
  };

  const deleteService = async (id) => {
    if (!id) return;
    // Optimistic UI state update to set status to INACTIVE immediately
    setServices((prev) =>
      prev.map((s) =>
        getServiceId(s) === id ? { ...s, active: false, isActive: false, status: "INACTIVE" } : s
      )
    );
    try {
      await deleteServiceApi(id);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete service:", err);
      fetchServices();
    }
  };

  const toggleServiceStatus = async (service, overrideActive) => {
    const id = getServiceId(service);
    if (!id) return;
    const currentActive = getServiceStatus(service) === "ACTIVE";
    const nextActive = typeof overrideActive === "boolean" ? overrideActive : !currentActive;

    // Optimistic UI state update in 0ms for 60fps smooth toggle transition
    setServices((prev) =>
      prev.map((s) =>
        getServiceId(s) === id
          ? { ...s, active: nextActive, isActive: nextActive, status: nextActive ? "ACTIVE" : "INACTIVE" }
          : s
      )
    );

    setStatusUpdatingId(id);
    try {
      await updateServiceStatusApi(id, nextActive);
    } catch (err) {
      console.error("Failed to update service status:", err);
      fetchServices();
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const filteredServices = services.filter((service) => {
    const keyword = search.trim().toLowerCase();
    const haystack = [
      service.name,
      service.description,
      service.status,
      getServiceStatus(service),
      ...getServicePrices(service).map((price) => getVehicleLabel(price)),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchSearch = !keyword || haystack.includes(keyword);
    const matchStatus =
      statusFilter === "all" ||
      getServiceStatus(service) === statusFilter;
    return matchSearch && matchStatus;
  });

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
                  BẢNG GIÁ
                </span>
              </div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-zinc-50 md:text-5xl">
                Quản lý dịch vụ
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
              Thêm dịch vụ
            </button>
          </div>
        </div>

        <div
          className="admin-reveal flex flex-col gap-3 border border-zinc-800 bg-zinc-950 p-4 md:flex-row md:items-center md:justify-between"
          style={{ animationDelay: "100ms" }}
        >
          <div className="relative w-full md:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm dịch vụ, mô tả, loại xe..."
              className="h-11 w-full border border-zinc-800 bg-black pl-10 pr-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 border border-zinc-800 bg-black px-3 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
          >
            <option className="bg-black text-zinc-100" value="all">
              Tất cả trạng thái
            </option>
            <option className="bg-black text-zinc-100" value="ACTIVE">
              Đang hoạt động
            </option>
            <option className="bg-black text-zinc-100" value="INACTIVE">
              Đã tắt
            </option>
          </select>
        </div>

        {/* Data Table */}
        <div
          className="admin-reveal overflow-x-auto border border-zinc-800 bg-zinc-950"
          style={{ animationDelay: "140ms" }}
        >
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-black">
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Tên dịch vụ
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Khoảng giá
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Thời lượng
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Đánh giá
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Tổng doanh thu
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Loại
                </th>
                <th className="px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-right font-mono text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center font-mono text-xs font-black uppercase tracking-[0.22em] text-zinc-600"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredServices.map((service, index) => {
                  const serviceId = getServiceId(service);
                  const expanded = expandedServiceId === serviceId;
                  const prices = getServicePrices(service);
                  const isActive = getServiceStatus(service) === "ACTIVE";

                  return (
                    <Fragment key={serviceId}>
                      <tr
                        className={`admin-reveal transition duration-200 hover:bg-cyan-400/[0.04] ${
                          expanded ? "bg-cyan-400/[0.08]" : ""
                        }`}
                        style={{ animationDelay: `${220 + index * 45}ms` }}
                      >
                        <td className="px-6 py-5 font-black text-zinc-100">
                          <button
                            type="button"
                          onClick={() =>
                            setExpandedServiceId(expanded ? null : serviceId)
                          }
                            className="flex items-center gap-2 text-left"
                          >
                            <span className="material-symbols-outlined text-[18px] text-cyan-300">
                              {expanded ? "expand_more" : "chevron_right"}
                            </span>
                            {service.name}
                          </button>
                        </td>
                        <td className="px-6 py-5 font-black text-cyan-300">
                          {getPriceRange(service)}
                        </td>
                        <td className="px-6 py-5 text-zinc-300">
                          {getDurationRange(service)}
                        </td>
                        <td className="px-6 py-5 text-zinc-300">
                          {service.rating ? `★ ${service.rating}` : "-"}
                        </td>
                        <td className="px-6 py-5 text-zinc-300">
                          {formatCurrency(service.totalRevenue)}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex min-w-[72px] items-center justify-center whitespace-nowrap border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${
                              getIsMainService(service)
                                ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                                : "border-emerald-300/50 bg-emerald-300/10 text-emerald-200"
                            }`}
                          >
                            {getIsMainService(service) ? "Gói chính" : "Phụ"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <ToggleSwitch
                              checked={isActive}
                              disabled={statusUpdatingId === serviceId}
                              onChange={(val) => toggleServiceStatus(service, val)}
                            />
                            <span className={`font-mono text-[10px] font-black uppercase tracking-[0.14em] ${isActive ? "text-emerald-300" : "text-zinc-500"}`}>
                              {isActive ? "ĐANG BẬT" : "ĐÃ TẮT"}
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
                              onClick={() => setDeleteTarget(service)}
                              className="flex h-8 w-8 items-center justify-center border border-red-400/40 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td
                            colSpan="8"
                            className="bg-cyan-400/[0.04] px-14 pb-5"
                          >
                            <div className="max-w-xl border border-cyan-300/30 bg-cyan-300/10 p-4">
                              {prices.length === 0 ? (
                                <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                                  Chưa có bảng giá theo loại xe
                                </p>
                              ) : (
                                <div className="grid gap-3">
                                  {prices.map((price) => (
                                    <div
                                      key={price.id || price.vehicleSize}
                                      className="grid grid-cols-3 border-b border-cyan-300/15 pb-2 last:border-b-0 last:pb-0"
                                    >
                                      <span className="text-zinc-300">
                                        {getVehicleLabel(price)}
                                      </span>
                                      <span className="font-black text-cyan-200">
                                        {formatCurrency(price.price)}
                                      </span>
                                      <span className="text-zinc-400">
                                        {price.duration
                                          ? `${price.duration}m`
                                          : "-"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
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
            onSave={(data) => updateService(getServiceId(selectedService), data)}
          />
        </>
      )}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="w-full max-w-md border border-red-400/35 bg-zinc-950 p-6 shadow-2xl">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
              Xóa dịch vụ
            </p>
            <h3 className="mt-2 text-2xl font-black text-zinc-50">
              Xác nhận xóa gói dịch vụ
            </h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
              Bạn có chắc muốn xóa / ngưng hoạt động gói{" "}
              <span className="text-cyan-200">{deleteTarget.name}</span> không?
              Dịch vụ sẽ chuyển sang trạng thái <span className="text-amber-300 font-bold">ĐÃ TẮT (INACTIVE)</span> để bảo toàn lịch sử đặt xe của khách hàng.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="border border-zinc-700 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => deleteService(getServiceId(deleteTarget))}
                className="border border-red-400/60 bg-red-400/10 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-400/20"
              >
                Xóa dịch vụ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Service Drawer Component (Reusable for Add/Edit)
function ServiceDrawer({ mode, service, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    status: getServiceStatus(service),
    isMainService: getIsMainService(service),
    servicePrices: getServicePrices(service).length
      ? getServicePrices(service)
      : DEFAULT_SERVICE_PRICES,
  });

  const updateServicePrice = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      servicePrices: prev.servicePrices.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    }));
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      active: formData.status === "ACTIVE",
      isActive: formData.status === "ACTIVE",
      isMainService: Boolean(formData.isMainService),
      servicePrices: formData.servicePrices.map((item) => ({
        ...item,
        id: typeof item.id === "number" ? item.id : undefined,
        price: Number(item.price),
        duration: Number(item.durationMinutes ?? item.duration),
        durationMinutes: Number(item.durationMinutes ?? item.duration),
        active: item.active ?? true,
      })),
    });
  };

  return (
    <div className="admin-reveal fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-black px-6 py-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            {mode === "add" ? "THÊM DỊCH VỤ" : "SỬA DỊCH VỤ"}
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
            placeholder="Ví dụ: Rửa tiêu chuẩn"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Loại dịch vụ
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isMainService: true })}
              className={`border px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.14em] transition ${
                formData.isMainService
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                  : "border-zinc-800 bg-black text-zinc-500 hover:border-cyan-400/60 hover:text-cyan-300"
              }`}
            >
              Gói chính
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isMainService: false })}
              className={`border px-3 py-3 font-mono text-[11px] font-black uppercase tracking-[0.14em] transition ${
                !formData.isMainService
                  ? "border-emerald-300 bg-emerald-300/10 text-emerald-200"
                  : "border-zinc-800 bg-black text-zinc-500 hover:border-emerald-300/60 hover:text-emerald-200"
              }`}
            >
              Dịch vụ phụ
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Bảng giá theo loại xe
          </label>
          <div className="grid gap-3">
            {formData.servicePrices.map((price, index) => (
              <div
                key={price.vehicleSize || index}
                className="border border-zinc-800 bg-black p-3"
              >
                <div className="mb-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  {getVehicleLabel(price)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      className="h-10 w-full border border-zinc-800 bg-zinc-950 px-3 pr-12 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                      placeholder="Giá"
                      value={price.price}
                      onChange={(e) =>
                        updateServicePrice(index, "price", e.target.value)
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-zinc-500">
                      VND
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      className="h-10 w-full border border-zinc-800 bg-zinc-950 px-3 pr-12 font-mono text-sm text-zinc-100 outline-none focus:border-cyan-400"
                      placeholder="Phút"
                      value={price.duration}
                      onChange={(e) =>
                        updateServicePrice(index, "duration", e.target.value)
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-zinc-500">
                      PHÚT
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 border-l-2 border-cyan-400/50 bg-cyan-400/10 p-3">
            <p className="text-[11px] font-semibold leading-relaxed text-zinc-400">
              Mỗi loại xe có thể có giá và thời lượng riêng. Dữ liệu này sẽ gửi
              lên backend trong trường servicePrices.
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
          <ToggleSwitch
            checked={formData.status === "ACTIVE"}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                status: val ? "ACTIVE" : "INACTIVE",
              }))
            }
          />
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
