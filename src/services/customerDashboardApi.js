import { getMyBookings } from "./customerBookingApi";
import { getMyLoyalty } from "./customerLoyaltyApi";

export const getCustomerDashboardBookings = getMyBookings;
export const getCustomerDashboardLoyalty = getMyLoyalty;

export default {
  getCustomerDashboardBookings,
  getCustomerDashboardLoyalty,
};
