import api, { apiPath } from "./apiClient";

const customerBookingsPath = (path = "") =>
  apiPath(`/customer/bookings${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const getBookingData = () => api.get(customerBookingsPath("data"));
export const getMyBookings = () => api.get(customerBookingsPath("my"));
export const createBooking = (data) => api.post(customerBookingsPath(), data);
export const updateBooking = (id, data) =>
  api.put(customerBookingsPath(id), data);
export const updateBookingStatus = (id, status) =>
  api.patch(customerBookingsPath(`${id}/status`), { status });

export default {
  getBookingData,
  getMyBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
};
