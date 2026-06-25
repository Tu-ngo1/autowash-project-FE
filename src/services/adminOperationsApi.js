import api, { apiPath } from "./apiClient";

export const configureTomorrow = (data) =>
  api.post(apiPath("/admin/operations/config-tomorrow"), data);

export default {
  configureTomorrow,
};
