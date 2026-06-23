import { login as apiLogin } from "./authApi";

export const login = async ({ account, password }) => {
  return apiLogin({ account, password });
};

export default {
  login,
};
