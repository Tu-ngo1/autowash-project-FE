export const compactLicensePlate = (value = "") =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const formatLicensePlate = (value = "") => {
  const raw = compactLicensePlate(value).slice(0, 10);
  const prefixMatch = raw.match(/^(\d{0,2})([A-Z]{0,2})(\d{0,6})/);
  if (!prefixMatch) return raw;

  const [, province, series, number] = prefixMatch;
  const head = `${province}${series}`;
  if (!number) return head;
  return `${head}-${number}`;
};

export const isValidVietnamLicensePlate = (value = "") =>
  /^\d{2}[A-Z]{1,2}\d{5,6}$/.test(compactLicensePlate(value));

export const getPlateFrom = (...values) => {
  const raw = values.find((value) => value !== undefined && value !== null && value !== "");
  return formatLicensePlate(raw || "");
};
