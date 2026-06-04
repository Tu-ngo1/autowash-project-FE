import api, { apiPath } from "./apiClient";

export const createPayment = (data) => api.post(apiPath("/payments"), data);
export const getPayment = (id) => api.get(apiPath(`/payments/${id}`));
export const getTransactions = () => api.get(apiPath("/payments/transactions"));

export default {
  createPayment,
  getPayment,
  getTransactions,
};
