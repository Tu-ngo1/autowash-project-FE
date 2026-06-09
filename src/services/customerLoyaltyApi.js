import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const getMyLoyalty = async () =>
  unwrap(await api.get(apiPath("/customer/loyalty")));
export const getLoyaltyVouchers = async () =>
  unwrap(await api.get(apiPath("/customer/loyalty/vouchers")));
export const redeemVoucher = (voucherId) =>
  api.post(apiPath("/customer/loyalty/redeem"), { voucherId }).then(unwrap);

export default {
  getMyLoyalty,
  getLoyaltyVouchers,
  redeemVoucher,
};
