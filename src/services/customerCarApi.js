import api, { apiPath } from "./apiClient";

const customerCarsPath = (path = "") =>
  apiPath(`/customer/cars${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const getMyCars = () => api.get(customerCarsPath());
export const createCar = (data) => api.post(customerCarsPath(), data);
export const updateCar = (id, data) => api.put(customerCarsPath(id), data);
export const deleteCar = (id) => api.delete(customerCarsPath(id));

export default {
  getMyCars,
  createCar,
  updateCar,
  deleteCar,
};
