import api, { apiPath } from "./apiClient";

const staffDashboardPath = (path) =>
  apiPath(`/staff/dashboard/${String(path).replace(/^\/+/, "")}`);

const legacyStaffPath = (path) =>
  apiPath(`/staff/${String(path).replace(/^\/+/, "")}`);

const fallbackOnNotFound = async (primaryRequest, fallbackRequest) => {
  try {
    return await primaryRequest();
  } catch (err) {
    if (err?.response?.status !== 404) throw err;
    return fallbackRequest();
  }
};

export const getPendingAppointments = () =>
  fallbackOnNotFound(
    () => api.get(staffDashboardPath("pending")),
    () => api.get(legacyStaffPath("pending")),
  );

export const confirmPendingAppointment = (id) =>
  fallbackOnNotFound(
    () => api.post(staffDashboardPath(`pending/${id}/confirm`)),
    () => api.post(legacyStaffPath(`pending/confirm/${id}`)),
  );

export default {
  getPendingAppointments,
  confirmPendingAppointment,
};
