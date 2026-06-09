import api, { apiPath } from "./apiClient";

export const getProfile = () => api.get(apiPath("/customer/profile"));
export const updateProfile = (data) => api.put(apiPath("/customer/profile"), data);

export default {
  getProfile,
  updateProfile,
};
