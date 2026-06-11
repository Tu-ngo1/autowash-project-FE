import {
  getBookingsByStatusAnalytics,
  getDashboardAnalytics,
  getRevenueAnalytics,
  getTopUsedVouchers,
} from "./adminAnalyticsApi";
import { getAdminBookings } from "./adminBookingApi";

export const getAdminDashboardAnalytics = getDashboardAnalytics;
export const getAdminDashboardRevenue = getRevenueAnalytics;
export const getAdminDashboardBookings = getAdminBookings;
export const getAdminDashboardBookingsByStatus = getBookingsByStatusAnalytics;
export const getAdminDashboardTopVouchers = getTopUsedVouchers;

export default {
  getAdminDashboardAnalytics,
  getAdminDashboardRevenue,
  getAdminDashboardBookings,
  getAdminDashboardBookingsByStatus,
  getAdminDashboardTopVouchers,
};
