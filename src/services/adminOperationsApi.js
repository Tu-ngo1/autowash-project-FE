import api, { apiPath } from "./apiClient";

export const getTomorrowConfig = () =>
  api.get(apiPath("/admin/operations/config-tomorrow"));

export const configureTomorrow = (data) =>
  api.post(apiPath("/admin/operations/config-tomorrow"), data);

export default {
  getTomorrowConfig,
  configureTomorrow,
};
