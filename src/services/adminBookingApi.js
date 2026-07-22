import api, { apiPath } from "./apiClient";

export const getAdminBookings = (params) =>
  api.get(apiPath("/admin/bookings"), { params });
export const getAdminBooking = (id) =>
  api.get(apiPath(`/admin/bookings/${id}`));
export const updateAdminBookingStatus = (id, status, note = "") =>
  api.put(apiPath(`/admin/bookings/${id}/status`), { status, note });
export const deleteAdminBooking = (id) =>
  api.delete(apiPath(`/admin/bookings/${id}`));
export const approveCancelRequest = (id, adminNote = "") =>
  api.post(apiPath(`/admin/bookings/${id}/cancel-request/approve`), {
    adminNote,
  });
export const rejectCancelRequest = (id, adminNote = "") =>
  api.post(apiPath(`/admin/bookings/${id}/cancel-request/reject`), {
    adminNote,
  });

export default {
  getAdminBookings,
  getAdminBooking,
  updateAdminBookingStatus,
  deleteAdminBooking,
  approveCancelRequest,
  rejectCancelRequest,
};
