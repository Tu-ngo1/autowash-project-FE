import axios from "axios";
import { clearAuth, getToken, isTokenExpired } from "../utils/auth";

export const apiPath = (path) =>
  `/api/${String(path).replace(/^\/?(api\/)?/, "")}`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (isTokenExpired(token)) {
      clearAuth();
      if (window.location.pathname !== "/" && !window.location.pathname.includes("/login")) {
        window.location.href = "/";
      }
      return Promise.reject(new axios.Cancel("Token expired"));
    }
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      clearAuth();
      if (window.location.pathname !== "/" && !window.location.pathname.includes("/login")) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
