import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data ?? response;

const normalizeSearchText = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

const getCustomerSearchValues = (customer = {}) => {
  const vehicles = [
    ...(Array.isArray(customer.registeredVehicles)
      ? customer.registeredVehicles
      : []),
    ...(Array.isArray(customer.vehicles) ? customer.vehicles : []),
    ...(Array.isArray(customer.cars) ? customer.cars : []),
  ];

  return [
    customer.phone,
    customer.customerPhone,
    customer.licensePlate,
    customer.plate,
    customer.vehicleLicensePlate,
    customer.name,
    customer.fullName,
    ...vehicles.flatMap((vehicle) => [
      vehicle.licensePlate,
      vehicle.plate,
      vehicle.vehicleLicensePlate,
    ]),
  ]
    .filter(Boolean)
    .map(normalizeSearchText);
};

export const searchWalkInCustomer = (query) =>
  api
    .get(apiPath("/staff/customers"))
    .then(unwrap)
    .then((payload) => {
      const customers = Array.isArray(payload)
        ? payload
        : payload?.customers || payload?.content || payload?.data || [];
      const normalizedQuery = normalizeSearchText(query);

      return (
        customers.find((customer) =>
          getCustomerSearchValues(customer).some(
            (value) =>
              value === normalizedQuery ||
              value.includes(normalizedQuery) ||
              normalizedQuery.includes(value),
          ),
        ) || null
      );
    });

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
