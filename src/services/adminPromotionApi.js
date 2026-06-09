import api, { apiPath } from "./apiClient";

export const getTiers = () => api.get(apiPath("/admin/tiers"));
export const updateTier = (id, data) =>
  api.put(apiPath(`/admin/tiers/${id}`), data);
export const getVouchers = () => api.get(apiPath("/admin/vouchers"));
export const createVoucher = (data) =>
  api.post(apiPath("/admin/vouchers"), data);
export const updateVoucher = (id, data) =>
  api.put(apiPath(`/admin/vouchers/${id}`), data);
export const deleteVoucher = (id) =>
  api.delete(apiPath(`/admin/vouchers/${id}`));
export const updateVoucherStatus = (id, isActive) =>
  api.patch(apiPath(`/admin/vouchers/${id}/status`), { isActive });

export default {
  getTiers,
  updateTier,
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  updateVoucherStatus,
};
