import api, { apiPath } from "./apiClient";

const staffBookingsPath = (path = "") =>
  apiPath(`/staff/bookings${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const checkInBookingByQr = (qrContent) =>
  api.post(staffBookingsPath("check-in"), null, {
    params: { qrContent },
  });

export const updateStaffBookingStatus = (id, status) =>
  api.put(staffBookingsPath(`${id}/status`), { status });

export default {
  checkInBookingByQr,
  updateStaffBookingStatus,
};
