import api, { apiPath } from "./apiClient";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response ?? {};
const customerCarsPath = (path = "") =>
  apiPath(`/customer/cars${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const normalizeCustomerCar = (car = {}) => {
  const licensePlate = car.licensePlate || car.plate || "";
  const vehicleSize = String(
    car.vehicleSize || car.vehicle_size || car.size || car.type || "",
  ).toUpperCase();
  const modelName = car.modelName || car.model_name || car.model || car.name || "";

  return {
    ...car,
    id: car.id || car._id || licensePlate,
    plate: licensePlate,
    licensePlate,
    vehicleSize,
    vehicle_size: vehicleSize,
    size: vehicleSize,
    vehicleModelId: car.vehicleModelId || car.vehicle_model_id || car.modelId,
    modelId: car.modelId || car.vehicleModelId || car.vehicle_model_id,
    modelName,
    model_name: modelName,
    brand: car.brand || "",
    label: `${car.brand || ""} ${modelName}`.trim() || vehicleSize || licensePlate,
  };
};

export const normalizeCustomerCars = (payload) => {
  const data = unwrap(payload);
  const cars = Array.isArray(data)
    ? data
    : data.cars || data.vehicles || data.items || [];
  return cars.map(normalizeCustomerCar);
};

export const getMyCars = () =>
  api.get(customerCarsPath()).then((response) => normalizeCustomerCars(response));

export const addMyCar = (car) =>
  api
    .post(customerCarsPath(), {
      licensePlate: car.licensePlate || car.plate,
      vehicleSize: car.vehicleSize || car.size,
      vehicleModelId: car.vehicleModelId || car.modelId,
    })
    .then((response) => normalizeCustomerCar(unwrap(response)));

export const updateMyCar = (id, car) =>
  api
    .put(customerCarsPath(id), {
      licensePlate: car.licensePlate || car.plate,
      vehicleSize: car.vehicleSize || car.size,
      vehicleModelId: car.vehicleModelId || car.modelId,
    })
    .then((response) => normalizeCustomerCar(unwrap(response)));

export const deleteMyCar = (id) =>
  api.delete(customerCarsPath(id));

export default {
  getMyCars,
  addMyCar,
  updateMyCar,
  deleteMyCar,
};
