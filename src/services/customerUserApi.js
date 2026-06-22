import api, { apiPath } from "./apiClient";

const normalizeProfileUpdate = (data = {}) => ({
  fullName: data.fullName || data.name || "",
});

export const getMe = () => api.get(apiPath("/customer/me"));
export const getProfile = () => api.get(apiPath("/customer/profile"));
export const updateProfile = (data) =>
  api.put(apiPath("/customer/profile"), normalizeProfileUpdate(data));

export default {
  getMe,
  getProfile,
  updateProfile,
};
