import api, { apiPath } from "./apiClient";

export const getDashboardAnalytics = () =>
  api.get(apiPath("/admin/analytics/dashboard"));
export const getRevenueAnalytics = (params) =>
  api.get(apiPath("/admin/analytics/revenue"), { params });
export const getBookingsByStatusAnalytics = () =>
  api.get(apiPath("/admin/analytics/bookings-by-status"));
export const getTopUsedVouchers = () =>
  api.get(apiPath("/admin/analytics/top-used-vouchers"));

export default {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getBookingsByStatusAnalytics,
  getTopUsedVouchers,
};
