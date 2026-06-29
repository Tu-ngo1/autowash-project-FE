import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data ?? response;

export const searchWalkInCustomer = (query) =>
  api
    .get(apiPath("/staff/customers/search"), { params: { query } })
    .then(unwrap);

export const getWalkInBookingData = (carSize) =>
  api
    .get(apiPath("/staff/bookings/walk-in/data"), {
      params: carSize ? { carSize } : {},
    })
    .then(unwrap);

export const createWalkInBooking = (payload) =>
  api.post(apiPath("/staff/bookings/walk-in"), payload).then(unwrap);

export default {
  searchWalkInCustomer,
  getWalkInBookingData,
  createWalkInBooking,
};
