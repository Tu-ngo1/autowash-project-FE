import api, { apiPath } from "./apiClient";

const staffCustomersPath = (path = "") =>
  apiPath(`/staff/customers${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const getStaffCustomers = (page) =>
  api.get(staffCustomersPath(), { params: { page } });
export const createStaffCustomer = (data) =>
  api.post(staffCustomersPath(), data);

export default {
  getStaffCustomers,
  createStaffCustomer,
};
