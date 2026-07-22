import api, { apiPath } from "./apiClient";

export const getAdminServices = () =>
  api.get(apiPath("/admin/services"));
export const createService = (data) =>
  api.post(apiPath("/admin/services"), data);
export const updateService = (id, data) =>
  api.put(apiPath(`/admin/services/${id}`), data);
export const deleteService = (id) =>
  api.delete(apiPath(`/admin/services/${id}`));
export const updateServiceStatus = (id, isActive) =>
  api.patch(
    apiPath(`/admin/services/${id}/status`),
    { active: Boolean(isActive), isActive: Boolean(isActive) },
    { params: { active: Boolean(isActive) } }
  );

export default {
  getAdminServices,
  createService,
  updateService,
  deleteService,
  updateServiceStatus,
};
