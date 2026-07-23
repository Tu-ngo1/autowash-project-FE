export const TOKEN_KEY = "token";
export const USER_KEY = "user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth({ token, user }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function updateUser(updates) {
  const current = getUser() || {};
  const next = { ...current, ...updates };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  return next;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (payload && payload.exp) {
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch {
    return true;
  }
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired(token)) {
    clearAuth();
    return false;
  }
  return true;
}

export function getUserRole() {
  return getUser()?.role || null;
}

export function getUserTier() {
  return getUser()?.tier || "Member";
}

export function getUserName() {
  return getUser()?.name || "Khách hàng";
}

export function getUserWalletBalance() {
  return getUser()?.walletBalance || 0;
}
