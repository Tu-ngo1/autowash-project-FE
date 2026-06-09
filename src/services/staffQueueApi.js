import api, { apiPath } from "./apiClient";

const staffQueuePath = (path = "") =>
  apiPath(`/staff/queue${path ? `/${String(path).replace(/^\/+/, "")}` : ""}`);

export const getQueue = () => api.get(staffQueuePath());
export const getBays = () => api.get(apiPath("/staff/bays"));
export const assignBay = (bayId, data) =>
  api.post(apiPath(`/staff/bays/${bayId}/assign`), data);
export const completeBay = (bayId) =>
  api.post(apiPath(`/staff/bays/${bayId}/complete`));

export default {
  getQueue,
  getBays,
  assignBay,
  completeBay,
};
