import api, { apiPath } from "./apiClient";

const LOCAL_USERS_KEY = "autowash_local_users";

const TEST_ACCOUNTS = [
  {
    id: "test-admin",
    name: "Admin Test",
    email: "admin@autowash.com",
    phone: "0900000001",
    password: "123456",
    role: "ADMIN",
    tier: "Admin",
  },
  {
    id: "test-staff",
    name: "Staff Test",
    email: "staff@autowash.com",
    phone: "0900000002",
    password: "123456",
    role: "STAFF",
    tier: "Staff",
  },
  {
    id: "test-customer",
    name: "Customer Test",
    email: "customer@autowash.com",
    phone: "0900000003",
    password: "123456",
    role: "CUSTOMER",
    tier: "Member",
  },
];

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

const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
  } catch {
    return [];
  }
};

const setLocalUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const toAuthSession = (user) => ({
  token: `local-${user.role.toLowerCase()}-${Date.now()}`,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    tier: user.tier || (user.role === "ADMIN" ? "Admin" : "Member"),
    points: user.points || 0,
    vehicles: user.vehicles || [],
    walletBalance: user.walletBalance || 0,
  },
});

const findLocalAccount = (account, password) => {
  const normalizedAccount = account.trim().toLowerCase();
  return [...TEST_ACCOUNTS, ...getLocalUsers()].find(
    (user) =>
      user.password === password &&
      [user.email, user.phone, user.account, user.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === normalizedAccount),
  );
};

const shouldUseLocalAuth = (err) => {
  const status = err?.response?.status;
  return !status || status === 404 || status >= 500;
};

export async function login({ account, password }) {
  const trimmedAccount = account.trim();
  try {
    const response = await api.post(apiPath("/auth/login"), {
      account: trimmedAccount,
      username: trimmedAccount,
      email: trimmedAccount,
      phone: trimmedAccount,
      password,
    });
    return normalizeAuthResponse(response.data);
  } catch (err) {
    if (!shouldUseLocalAuth(err)) throw err;
    const localUser = findLocalAccount(trimmedAccount, password);
    if (!localUser) {
      throw new Error("Tài khoản hoặc mật khẩu không đúng.");
    }
    return toAuthSession(localUser);
  }
}

export async function register({ name, email, phone, password, otp }) {
  const normalized = {
    id: `local-customer-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    password,
    role: "CUSTOMER",
    tier: "Member",
    points: 0,
    vehicles: [],
    walletBalance: 0,
  };

  try {
    const response = await api.post(apiPath("/auth/register"), {
      name: normalized.name,
      fullName: normalized.name,
      email: normalized.email,
      phone: normalized.phone,
      phoneNumber: normalized.phone,
      password: normalized.password,
      otp: otp?.trim(),
      code: otp?.trim(),
      role: normalized.role,
    });
    return response.data;
  } catch (err) {
    if (!shouldUseLocalAuth(err)) throw err;
    const users = getLocalUsers();
    const duplicated = [...TEST_ACCOUNTS, ...users].some(
      (user) => user.email === normalized.email || user.phone === normalized.phone,
    );
    if (duplicated) {
      throw new Error("Email hoặc số điện thoại đã tồn tại.");
    }
    setLocalUsers([...users, normalized]);
    return { message: "Đăng ký thành công.", user: normalized };
  }
}

export async function sendRegistrationOtp(email) {
  const normalizedEmail = email.trim();
  const payload = {
    email: normalizedEmail,
    purpose: "REGISTER",
    type: "REGISTER",
  };

  const endpoints = [
    "/auth/send-otp",
    "/auth/register/send-otp",
    "/auth/otp/send",
  ];

  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await api.post(apiPath(endpoint), payload);
      return response.data;
    } catch (err) {
      lastError = err;
      if (err?.response?.status && err.response.status !== 404) throw err;
    }
  }

  if (!shouldUseLocalAuth(lastError)) throw lastError;
  sessionStorage.setItem(`autowash_register_otp:${normalizedEmail}`, "123456");
  return {
    message: `Mã OTP đã được gửi tới ${normalizedEmail}. Vui lòng kiểm tra hộp thư.`,
  };
}

export async function verifyRegistrationOtp(email, otp) {
  const normalizedEmail = email.trim();
  const normalizedOtp = otp.trim();
  const payload = {
    email: normalizedEmail,
    otp: normalizedOtp,
    code: normalizedOtp,
    purpose: "REGISTER",
    type: "REGISTER",
  };

  const endpoints = [
    "/auth/verify-otp",
    "/auth/register/verify-otp",
    "/auth/otp/verify",
  ];

  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await api.post(apiPath(endpoint), payload);
      return response.data;
    } catch (err) {
      lastError = err;
      if (err?.response?.status && err.response.status !== 404) throw err;
    }
  }

  if (!shouldUseLocalAuth(lastError)) throw lastError;
  const expected = sessionStorage.getItem(
    `autowash_register_otp:${normalizedEmail}`,
  );
  if (expected !== normalizedOtp) {
    throw new Error("Mã OTP không đúng hoặc đã hết hạn.");
  }
  return { message: "Xác thực OTP thành công." };
}

export const testAccounts = TEST_ACCOUNTS.map(({ password, ...user }) => ({
  ...user,
  password,
}));
