import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const validateVoucher = (code) =>
  api.post(apiPath("/customer/vouchers/validate"), { code });
export const getCustomerVouchers = (customerId) =>
  api
    .get(
      apiPath(
        customerId
          ? `/customer/${customerId}/vouchers`
          : "/customer/loyalty/vouchers",
      ),
    )
    .then(unwrap);

export default {
  getCustomerVouchers,
  validateVoucher,
};
