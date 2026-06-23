import api, { apiPath } from "./apiClient";

const unwrap = (payload) => payload?.data ?? payload;

const normalizeRole = (role) => {
  const normalized = String(role || "CUSTOMER").toUpperCase();
  if (normalized.includes("ADMIN")) return "ADMIN";
  if (normalized.includes("STAFF")) return "STAFF";
  return "CUSTOMER";
};

const getToken = (payload) =>
  payload?.token ||
  payload?.accessToken ||
  payload?.jwt ||
  payload?.access_token ||
  payload?.authToken;

const normalizeAuthResponse = (payload) => {
  const data = unwrap(payload);
  const user = data?.user || data?.account || data?.customer || data;
  const role = normalizeRole(user?.role || data?.role);
  const token = getToken(data) || getToken(user);

  if (!token) {
    throw new Error("Không nhận được token đăng nhập từ hệ thống.");
  }

  return {
    token,
    user: {
      id: user?.id || user?._id || data?.id,
      name:
        user?.name ||
        user?.fullName ||
        user?.username ||
        (role === "ADMIN" ? "Admin" : role === "STAFF" ? "Staff" : "Khách hàng"),
      email: user?.email || data?.email,
      phone: user?.phone || user?.phoneNumber || data?.phone,
      role,
      tier: user?.tier || data?.tier || (role === "ADMIN" ? "Admin" : "Member"),
      points: user?.points || data?.points,
      vehicles: user?.vehicles || data?.vehicles,
      walletBalance: user?.walletBalance || data?.walletBalance,
    },
  };
};

export async function login({ account, password }) {
  const usernameOrPhone = account.trim();
  const response = await api.post(apiPath("/auth/login"), {
    usernameOrPhone,
    password,
  });

  return normalizeAuthResponse(response.data);
}

export async function register({
  name,
  fullName,
  phone = "",
  username,
  email,
  password,
  otp,
  licensePlate = "",
  role = "CUSTOMER",
}) {
  const normalizedEmail = email.trim();
  const normalizedName = (fullName || name || "").trim();
  const response = await api.post(apiPath("/auth/register"), {
    fullName: normalizedName,
    email: normalizedEmail,
    phone: phone.trim(),
    username: username?.trim() || normalizedEmail,
    password,
    otp: otp?.trim(),
    licensePlate: licensePlate.trim(),
    role,
  });

  return normalizeAuthResponse(response.data);
}

export const sendRegistrationOtp = (email) =>
  api.post(apiPath("/auth/register/send-otp"), {
    email: email.trim(),
  }).then((response) => response.data);

export const verifyRegistrationOtp = (email, otp) =>
  api.post(apiPath("/auth/register/verify-otp"), {
    email: email.trim(),
    otp: otp.trim(),
  }).then((response) => response.data);
