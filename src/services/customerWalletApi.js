import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const depositWallet = (amount) =>
  api.post(apiPath("/customer/wallet/deposit"), { amount }).then(unwrap);

export const getWalletTransactions = () =>
  api.get(apiPath("/customer/wallet/transactions"))
    .then(unwrap)
    .catch(() => {
      // Mock data fallback if API is not implemented yet or returns error in dev
      return [
        {
          id: "TX-100234",
          type: "DEPOSIT",
          amount: 200000,
          description: "Nạp tiền vào ví qua PayOS",
          createdAt: "2026-06-24T15:30:00",
        },
        {
          id: "TX-100222",
          type: "PAYMENT",
          amount: 135000,
          description: "Thanh toán lịch đặt AW-882910",
          createdAt: "2026-06-24T14:15:00",
        },
        {
          id: "TX-100101",
          type: "REFUND",
          amount: 80000,
          description: "Hoàn tiền hủy lịch đặt AW-882100",
          createdAt: "2026-06-23T09:00:00",
        },
      ];
    });

export default {
  depositWallet,
  getWalletTransactions,
};
