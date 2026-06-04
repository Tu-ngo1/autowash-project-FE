import api, { apiPath } from "./apiClient";

export const getDashboardAnalytics = () =>
  api.get(apiPath("/admin/analytics/dashboard"));
export const getRevenueAnalytics = (params) =>
  api.get(apiPath("/admin/analytics/revenue"), { params });

export default {
  getDashboardAnalytics,
  getRevenueAnalytics,
};
