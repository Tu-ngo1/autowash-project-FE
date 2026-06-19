import api, { apiPath } from "./apiClient";

const customerBookingsPath = (path = "") =>
  apiPath(`/customer/bookings${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

const normalizeBooking = (booking = {}) => {
  const scheduledStartTime = booking.scheduledStartTime || booking.dateTime || "";
  const serviceNames = Array.isArray(booking.services)
    ? booking.services
    : booking.service
      ? [booking.service]
      : [];

  return {
    ...booking,
    plate: booking.vehicleLicensePlate || booking.plate || "",
    vehicleLicensePlate: booking.vehicleLicensePlate || booking.plate || "",
    date: booking.date || scheduledStartTime,
    time:
      booking.time ||
      (scheduledStartTime.includes("T")
        ? scheduledStartTime.split("T")[1]?.slice(0, 5)
        : ""),
    service: booking.service || serviceNames.join(", "),
    serviceName: booking.serviceName || serviceNames.join(", "),
    price: booking.price ?? booking.totalPrice ?? 0,
    totalPrice: booking.totalPrice ?? booking.price ?? 0,
    scheduledStartTime,
  };
};

const normalizeBookingResponse = (response) => {
  const raw = response?.data?.data ?? response?.data ?? response;
  const bookings = Array.isArray(raw)
    ? raw
    : raw?.bookings || raw?.items || [];
  return {
    ...response,
    data: bookings.map(normalizeBooking),
  };
};

export const getBookingData = () => api.get(customerBookingsPath("data"));
export const getMyBookings = () =>
  api.get(customerBookingsPath("my")).then(normalizeBookingResponse);
export const createBooking = (data) =>
  api.post(customerBookingsPath(), {
    vehicleId: data.vehicleId,
    scheduledStartTime: data.scheduledStartTime,
    serviceIds: data.serviceIds || [data.serviceId].filter(Boolean),
    customerNote: data.customerNote || "",
  });
export const updateBooking = (id, data) =>
  api.put(customerBookingsPath(id), data);
export const updateBookingStatus = (id, status) =>
  api.patch(customerBookingsPath(`${id}/status`), { status });
export const cancelBooking = (id) =>
  api.post(customerBookingsPath(`${id}/cancel`));
export const getBookingQr = (id) =>
  api.get(customerBookingsPath(`${id}/qr`));

export default {
  getBookingData,
  getMyBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingQr,
};
