import api, { apiPath } from "./apiClient";

const adminUsersPath = (path = "") =>
  apiPath(`/admin/users${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const getAdminUsers = (params) =>
  api.get(adminUsersPath(), { params });
export const getAdminUser = (id) => api.get(adminUsersPath(id));
export const createAdminUser = (data) => api.post(adminUsersPath(), data);
export const updateAdminUser = (id, data) =>
  api.put(adminUsersPath(id), data);
export const updateAdminUserStatus = (id, status) => {
  const normalized = String(status || "").toUpperCase();
  if (["LOCKED", "INACTIVE", "DISABLED", "BLOCKED"].includes(normalized)) {
    return api.put(adminUsersPath(`${id}/lock`));
  }
  return api.put(adminUsersPath(`${id}/unlock`));
};
export const lockAdminUser = (id) => api.put(adminUsersPath(`${id}/lock`));
export const unlockAdminUser = (id) => api.put(adminUsersPath(`${id}/unlock`));
export const createAdminStaff = (data) => api.post(apiPath("/admin/staff"), data);
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
  createAdminStaff,
  updateAdminUser,
  updateAdminUserStatus,
  lockAdminUser,
  unlockAdminUser,
  updateAdminUserPoints,
  addAdminUserVehicle,
  deleteAdminUserVehicle,
};
