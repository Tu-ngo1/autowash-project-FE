import api, { apiPath } from "./apiClient";

export const getProfile = () => api.get(apiPath("/users/me"));
export const updateProfile = (data) => api.put(apiPath("/users/me"), data);
export const getAdminCustomers = () => api.get(apiPath("/admin/customers"));
export const getAdminCustomer = (id) =>
  api.get(apiPath(`/admin/customers/${id}`));
export const updateAdminCustomer = (id, data) =>
  api.put(apiPath(`/admin/customers/${id}`), data);
export const updateAdminCustomerPoints = (id, data) =>
  api.patch(apiPath(`/admin/customers/${id}/points`), data);
export const updateAdminCustomerStatus = (id, status) =>
  api.patch(apiPath(`/admin/customers/${id}/status`), { status });
export const addAdminCustomerVehicle = (customerId, vehicleData) =>
  api.post(apiPath(`/admin/customers/${customerId}/vehicles`), vehicleData);
export const deleteAdminCustomerVehicle = (customerId, vehicleId) =>
  api.delete(apiPath(`/admin/customers/${customerId}/vehicles/${vehicleId}`));

export default {
  getProfile,
  updateProfile,
  getAdminCustomers,
  getAdminCustomer,
  updateAdminCustomer,
  updateAdminCustomerPoints,
  updateAdminCustomerStatus,
  addAdminCustomerVehicle,
  deleteAdminCustomerVehicle,
};
