import api, { apiPath } from "./apiClient";
import { getUserRole } from "../utils/auth";

const unwrap = (response) => response.data?.data ?? response.data;

const roleVehicleModelPaths = {
  ADMIN: ["/admin/vehicle-models", "/customer/vehicle-models"],
  STAFF: ["/staff/vehicle-models", "/customer/vehicle-models"],
  CUSTOMER: ["/customer/vehicle-models"],
};

const isMissingOrForbidden = (error) =>
  [403, 404, 405].includes(Number(error?.response?.status));

export const getVehicleModels = async () => {
  const role = String(getUserRole() || "CUSTOMER").toUpperCase();
  const paths = roleVehicleModelPaths[role] || roleVehicleModelPaths.CUSTOMER;

  for (const path of paths) {
    try {
      return await api.get(apiPath(path)).then(unwrap);
    } catch (error) {
      if (!isMissingOrForbidden(error) || path === paths[paths.length - 1]) {
        if (isMissingOrForbidden(error)) return [];
        throw error;
      }
    }
  }

  return [];
};

export default {
  getVehicleModels,
};
