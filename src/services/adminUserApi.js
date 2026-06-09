import api, { apiPath } from "./apiClient";

const adminUsersPath = (path = "") =>
  apiPath(`/admin/users${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const getAdminUsers = (params) =>
  api.get(adminUsersPath(), { params });
export const getAdminUser = (id) => api.get(adminUsersPath(id));
export const createAdminUser = (data) => api.post(adminUsersPath(), data);
export const updateAdminUser = (id, data) =>
  api.put(adminUsersPath(id), data);
export const updateAdminUserStatus = (id, status) =>
  api.patch(adminUsersPath(`${id}/status`), { status });
export const updateAdminUserPoints = (id, data) =>
  api.patch(adminUsersPath(`${id}/points`), data);
export const addAdminUserVehicle = (userId, vehicleData) =>
  api.post(adminUsersPath(`${userId}/vehicles`), vehicleData);
export const deleteAdminUserVehicle = (userId, vehicleId) =>
  api.delete(adminUsersPath(`${userId}/vehicles/${vehicleId}`));

export default {
  getAdminUsers,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
  updateAdminUserPoints,
  addAdminUserVehicle,
  deleteAdminUserVehicle,
};
