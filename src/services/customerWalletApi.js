import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const depositWallet = (amount) =>
  api.post(apiPath("/customer/wallet/deposit"), { amount }).then(unwrap);

export const getWalletTransactions = () =>
  api.get(apiPath("/customer/wallet/transactions"))
    .then(unwrap)
    .catch(() => {
      // Trả về mảng rỗng khi API lỗi — không dùng mock data để tránh hiển thị dữ liệu giả
      return [];
    });

export const verifyWalletPayment = (orderCode) =>
  api.post(apiPath(`/customer/wallet/verify-payment/${orderCode}`)).then(unwrap);

export default {
  depositWallet,
  getWalletTransactions,
  verifyWalletPayment,
};
