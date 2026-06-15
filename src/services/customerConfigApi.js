import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const getCustomerBookingConfig = () =>
  api.get(apiPath("/customer/booking-config")).then(unwrap);

export const getCustomerTierConfigs = () =>
  api.get(apiPath("/customer/tier-configs")).then(unwrap);

export default {
  getCustomerBookingConfig,
  getCustomerTierConfigs,
};
