import { getMyBookings } from "./customerBookingApi";
import { getMyLoyalty } from "./customerLoyaltyApi";
import { getProfile, updateProfile } from "./customerUserApi";

export const getCustomerProfile = getProfile;
export const updateCustomerProfile = updateProfile;
export const getCustomerProfileBookings = getMyBookings;
export const getCustomerProfileLoyalty = getMyLoyalty;

export default {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerProfileBookings,
  getCustomerProfileLoyalty,
};
