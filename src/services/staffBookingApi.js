import api, { apiPath } from "./apiClient";

const staffBookingsPath = (path = "") =>
  apiPath(`/staff/bookings${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const checkInBookingByQr = (qrContent) =>
  api.post(staffBookingsPath("check-in"), null, {
        params: { qrContent },
      });

export const updateStaffBookingStatus = (id, status) =>
  api.put(staffBookingsPath(`${id}/status`), { status });
export const requestCancelBooking = (id, reason) =>
  api.post(staffBookingsPath(`${id}/cancel-request`), { reason });
export const addServicesToBooking = (bookingId, serviceIds) =>
  api.post(staffBookingsPath(`${bookingId}/add-services`), { serviceIds });

export const getWashedBookings = () =>
  api.get(apiPath("/staff/washed"));

export const checkoutBooking = (id, paymentMethod = "CASH") =>
  api.post(staffBookingsPath(`${id}/checkout`), null, {
    params: { paymentMethod },
  });

export default {
  checkInBookingByQr,
  updateStaffBookingStatus,
  requestCancelBooking,
  addServicesToBooking,
  getWashedBookings,
  checkoutBooking,
};
