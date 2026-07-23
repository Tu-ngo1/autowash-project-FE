import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data ?? response;

const normalizeSearchText = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

const unwrapList = (payload, keys = []) => {
  const data = payload?.data?.data ?? payload?.data ?? payload ?? {};
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

const matchesQuery = (values, normalizedQuery) =>
  values
    .filter(Boolean)
    .map(normalizeSearchText)
    .some(
      (value) =>
        value === normalizedQuery ||
        value.includes(normalizedQuery) ||
        normalizedQuery.includes(value),
    );

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

const getBookingSearchValues = (booking = {}) => [
  booking.phone,
  booking.customerPhone,
  booking.customer?.phone,
  booking.customerName,
  booking.customer?.fullName,
  booking.customer?.name,
  booking.licensePlate,
  booking.plate,
  booking.vehicleLicensePlate,
  booking.vehicle?.licensePlate,
  booking.vehicle?.plate,
];

const normalizeQueueBookingAsCustomer = (booking = {}) => {
  const vehicle = booking.vehicle || {};
  const customer = booking.customer || {};
  const licensePlate =
    booking.licensePlate ||
    booking.plate ||
    booking.vehicleLicensePlate ||
    vehicle.licensePlate ||
    vehicle.plate ||
    "";

  return {
    ...customer,
    id: customer.id || booking.customerId || booking.userId,
    name: customer.fullName || customer.name || booking.customerName || "",
    fullName: customer.fullName || customer.name || booking.customerName || "",
    phone: customer.phone || booking.customerPhone || booking.phone || "",
    tier: booking.tier || booking.tierLevel || customer.tier || customer.tierLevel || "Member",
    licensePlate,
    vehicleLicensePlate: licensePlate,
    vehicleModelId:
      booking.vehicleModelId ||
      vehicle.vehicleModelId ||
      vehicle.modelId ||
      "",
    brand: booking.brand || vehicle.brand || "",
    modelName:
      booking.modelName ||
      booking.vehicleModelName ||
      vehicle.modelName ||
      vehicle.model ||
      "",
    vehicleSize:
      booking.vehicleSize ||
      booking.carSize ||
      vehicle.vehicleSize ||
      vehicle.size ||
      "",
    registeredVehicles: [
      {
        ...vehicle,
        id: vehicle.id || booking.vehicleId || licensePlate,
        licensePlate,
        plate: licensePlate,
        vehicleModelId:
          booking.vehicleModelId ||
          vehicle.vehicleModelId ||
          vehicle.modelId ||
          "",
        brand: booking.brand || vehicle.brand || "",
        modelName:
          booking.modelName ||
          booking.vehicleModelName ||
          vehicle.modelName ||
          vehicle.model ||
          "",
        vehicleSize:
          booking.vehicleSize ||
          booking.carSize ||
          vehicle.vehicleSize ||
          vehicle.size ||
          "",
      },
    ].filter((item) => item.licensePlate),
  };
};

export const searchWalkInCustomer = (query) =>
  api
    .get(apiPath("/staff/customers/search"), { params: { query } })
    .then(unwrap)
    .then(async (payload) => {
      const directCustomer =
        payload && !Array.isArray(payload) && Object.keys(payload).length
          ? payload
          : null;
      if (directCustomer?.registeredVehicles || directCustomer?.fullName || directCustomer?.phone) {
        return directCustomer;
      }

      const customers = unwrapList(payload, ["customers", "content", "data", "items"]);
      const normalizedQuery = normalizeSearchText(query);

      const customerMatch = customers.find((customer) =>
        matchesQuery(getCustomerSearchValues(customer), normalizedQuery),
      );
      if (customerMatch) return customerMatch;

      const queuePayload = await api.get(apiPath("/staff/queue")).then(unwrap).catch(() => null);
      const queue = unwrapList(queuePayload, ["items", "queue", "bookings"]);
      const queueMatch = queue.find((booking) =>
        matchesQuery(getBookingSearchValues(booking), normalizedQuery),
      );

      return queueMatch ? normalizeQueueBookingAsCustomer(queueMatch) : null;
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
