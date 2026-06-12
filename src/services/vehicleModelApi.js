import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const getVehicleModels = () =>
  api.get(apiPath("/customer/vehicle-models")).then(unwrap);

export default {
  getVehicleModels,
};
