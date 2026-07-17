export const compactLicensePlate = (value = "") =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const formatLicensePlate = (value = "") =>
  compactLicensePlate(value).slice(0, 9);

export const isValidVietnamLicensePlate = (value = "") =>
  /^\d{2}[A-Z]{1,2}\d{4,5}$/.test(formatLicensePlate(value));

export const getPlateFrom = (...values) => {
  const raw = values.find((value) => value !== undefined && value !== null && value !== "");
  return formatLicensePlate(raw || "");
};
