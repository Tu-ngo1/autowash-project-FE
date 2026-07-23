export const compactLicensePlate = (value = "") =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const formatLicensePlate = (value = "") => {
  const raw = compactLicensePlate(value);
  const province = raw.slice(0, 2);
  const rest = raw.slice(2);
  const series = rest.match(/^[A-Z]{0,2}/)?.[0] || "";
  const serial = rest.slice(series.length).replace(/\D/g, "").slice(0, 6);

  if (!province) return "";
  if (province.length < 2) return province;
  if (!series) return province;

  const plateHead = `${province}${series}`;
  return serial ? `${plateHead}-${serial}` : plateHead;
};

export const isValidVietnamLicensePlate = (value = "") =>
  /^\d{2}[A-Z]{1,2}\d{5,6}$/.test(compactLicensePlate(value));

export const getPlateFrom = (...values) => {
  const raw = values.find((value) => value !== undefined && value !== null && value !== "");
  return formatLicensePlate(raw || "");
};
