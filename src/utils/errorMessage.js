const TECHNICAL_ERROR_PATTERNS = [
  /request failed/i,
  /status code/i,
  /\b4\d\d\b/,
  /\b5\d\d\b/,
  /network error/i,
  /timeout/i,
  /axios/i,
];

const isTechnicalMessage = (message = "") =>
  TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));

export const getFriendlyErrorMessage = (
  error,
  fallback = "Có lỗi xảy ra. Vui lòng thử lại sau.",
) => {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  if (!backendMessage || isTechnicalMessage(String(backendMessage))) {
    return fallback;
  }

  return String(backendMessage);
};
