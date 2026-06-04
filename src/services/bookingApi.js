import api, { apiPath } from "./apiClient";

export const getBookingData = () => api.get(apiPath("/bookings/data"));
export const getMyBookings = () => api.get(apiPath("/bookings/my"));
export const getAdminBookings = (params) =>
  api.get(apiPath("/admin/bookings"), { params });
export const getAdminBooking = (id) => api.get(apiPath(`/admin/bookings/${id}`));
export const createBooking = (data) => api.post(apiPath("/bookings"), data);
export const updateBooking = (id, data) =>
  api.put(apiPath(`/bookings/${id}`), data);
export const updateBookingStatus = (id, status) =>
  api.patch(apiPath(`/bookings/${id}/status`), { status });
export const updateAdminBookingStatus = (id, status) =>
  api.put(apiPath(`/admin/bookings/${id}/status`), { status });

export default {
  getBookingData,
  getMyBookings,
  getAdminBookings,
  getAdminBooking,
  createBooking,
  updateBooking,
  updateBookingStatus,
  updateAdminBookingStatus,
};
