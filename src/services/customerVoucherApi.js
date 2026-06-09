import api, { apiPath } from "./apiClient";

export const validateVoucher = (code) =>
  api.post(apiPath("/customer/vouchers/validate"), { code });

export default {
  validateVoucher,
};
