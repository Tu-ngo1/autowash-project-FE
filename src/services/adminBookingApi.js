import api, { apiPath } from "./apiClient";

export const getAdminBookings = (params) =>
  api.get(apiPath("/admin/bookings"), { params });
export const getAdminBooking = (id) => api.get(apiPath(`/admin/bookings/${id}`));
export const updateAdminBookingStatus = (id, status) =>
  api.put(apiPath(`/admin/bookings/${id}/status`), { status });
export const deleteAdminBooking = (id) =>
  api.delete(apiPath(`/admin/bookings/${id}`));

export default {
  getAdminBookings,
  getAdminBooking,
  updateAdminBookingStatus,
  deleteAdminBooking,
};
