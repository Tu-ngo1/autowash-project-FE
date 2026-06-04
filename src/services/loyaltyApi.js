import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const getMyLoyalty = async () => unwrap(await api.get(apiPath("/loyalty/me")));
export const getLoyaltyVouchers = async () =>
  unwrap(await api.get(apiPath("/loyalty/vouchers")));
export const redeemVoucher = (voucherId) =>
  api.post(apiPath("/loyalty/redeem"), { voucherId }).then(unwrap);

export default {
  getMyLoyalty,
  getLoyaltyVouchers,
  redeemVoucher,
};
