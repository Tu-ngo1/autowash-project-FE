import api, { apiPath } from "./apiClient";

export const getCars = () => api.get(apiPath("/cars"));
export const createCar = (data) => api.post(apiPath("/cars"), data);
export const updateCar = (id, data) => api.put(apiPath(`/cars/${id}`), data);
export const deleteCar = (id) => api.delete(apiPath(`/cars/${id}`));

export default {
  getCars,
  createCar,
  updateCar,
  deleteCar,
};
