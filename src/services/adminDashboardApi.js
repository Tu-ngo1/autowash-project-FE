import { getDashboardAnalytics, getRevenueAnalytics } from "./adminAnalyticsApi";
import { getAdminBookings } from "./adminBookingApi";

export const getAdminDashboardAnalytics = getDashboardAnalytics;
export const getAdminDashboardRevenue = getRevenueAnalytics;
export const getAdminDashboardBookings = getAdminBookings;

export default {
  getAdminDashboardAnalytics,
  getAdminDashboardRevenue,
  getAdminDashboardBookings,
};
