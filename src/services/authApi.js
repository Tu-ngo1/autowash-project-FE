import api, { apiPath } from "./apiClient";

const unwrap = (payload) => payload?.data ?? payload;

export const TEST_ACCOUNTS = [
  {
    id: "test-admin",
    name: "Admin Test",
    email: "admin@autowash.com",
    password: "123456",
    role: "ADMIN",
    tier: "Admin",
  },
  {
    id: "test-staff",
    name: "Staff Test",
    email: "staff@autowash.com",
    password: "123456",
    role: "STAFF",
    tier: "Staff",
  },
  {
    id: "test-customer",
    name: "Customer Test",
    email: "customer@autowash.com",
    password: "123456",
    role: "CUSTOMER",
    tier: "Member",
    points: 1200,
  },
];

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

const toTestSession = (user) => ({
  token: `test-${user.role.toLowerCase()}-${Date.now()}`,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tier: user.tier,
    points: user.points || 0,
    vehicles: [],
  },
});

export async function login({ account, password }) {
  const email = account.trim();
  const testLoginEnabled =
    import.meta.env.VITE_ENABLE_TEST_LOGIN === "true";
  const testAccount = testLoginEnabled
    ? TEST_ACCOUNTS.find(
        (user) =>
          user.email.toLowerCase() === email.toLowerCase() &&
          user.password === password,
      )
    : null;

  if (testAccount) {
    return toTestSession(testAccount);
  }

  const response = await api.post(apiPath("/auth/login"), {
    email,
    password,
  });

  return normalizeAuthResponse(response.data);
}

export async function register({ name, email, password, otp }) {
  const response = await api.post(apiPath("/auth/register"), {
    name: name.trim(),
    fullName: name.trim(),
    email: email.trim(),
    password,
    otp: otp?.trim(),
  });

  return response.data;
}

export const sendRegistrationOtp = (email) =>
  api.post(apiPath("/auth/register/send-otp"), {
    email: email.trim(),
    purpose: "REGISTER",
  }).then((response) => response.data);

export const verifyRegistrationOtp = (email, otp) =>
  api.post(apiPath("/auth/register/verify-otp"), {
    email: email.trim(),
    otp: otp.trim(),
    purpose: "REGISTER",
  }).then((response) => response.data);
