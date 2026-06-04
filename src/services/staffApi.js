import api, { apiPath } from "./apiClient";

export const getPendingAppointments = () => api.get(apiPath("/admin/pending"));
export const confirmPendingAppointment = (id) =>
  api.post(apiPath(`/admin/pending/confirm/${id}`));
export const getQueue = () => api.get(apiPath("/admin/queue"));
export const getBays = () => api.get(apiPath("/admin/bays"));
export const assignBay = (bayId, data) =>
  api.post(apiPath(`/admin/bays/${bayId}/assign`), data);
export const completeBay = (bayId) =>
  api.post(apiPath(`/admin/bays/${bayId}/complete`));
export const getStaffCustomers = (page) =>
  api.get(apiPath("/admin/customers"), { params: { page } });
export const createStaffCustomer = (data) =>
  api.post(apiPath("/admin/customers"), data);

export default {
  getPendingAppointments,
  confirmPendingAppointment,
  getQueue,
  getBays,
  assignBay,
  completeBay,
  getStaffCustomers,
  createStaffCustomer,
};
