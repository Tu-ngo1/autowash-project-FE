export const VEHICLE_SIZE_OPTIONS = [
  {
    value: "SMALL",
    label: "SMALL",
    description: "4-5 chỗ",
    icon: "directions_car",
  },
  {
    value: "MEDIUM",
    label: "MEDIUM",
    description: "CUV/SUV 5 chỗ",
    icon: "commute",
  },
  {
    value: "LARGE",
    label: "LARGE",
    description: "7 chỗ",
    icon: "airport_shuttle",
  },
  {
    value: "XLARGE",
    label: "XLARGE",
    description: "Bán tải, Van",
    icon: "local_shipping",
  },
];

export const getVehicleSizeOption = (value) =>
  VEHICLE_SIZE_OPTIONS.find((option) => option.value === value) ||
  VEHICLE_SIZE_OPTIONS[0];

export const getVehicleBrands = (vehicleModels) =>
  Array.from(new Set(vehicleModels.map((model) => model.brand))).sort((a, b) =>
    a.localeCompare(b),
  );

export const getVehicleModelById = (vehicleModels, id) =>
  vehicleModels.find((model) => String(model.id) === String(id));

export const getVehicleModelByName = (vehicleModels, brand, modelName) =>
  vehicleModels.find(
    (model) =>
      model.brand === brand &&
      String(model.modelName || "").toLowerCase() ===
        String(modelName || "").toLowerCase(),
  );

export const normalizeVehicleSize = (vehicle) => {
  const rawSize = String(
    vehicle?.size ||
      vehicle?.vehicleSize ||
      vehicle?.vehicle_size ||
      vehicle?.type ||
      "",
  ).toUpperCase();
  if (["SMALL", "MEDIUM", "LARGE", "XLARGE"].includes(rawSize)) return rawSize;
  if (String(vehicle?.type || "").includes("7")) return "LARGE";
  if (
    String(vehicle?.type || "")
      .toLowerCase()
      .includes("suv")
  ) {
    return "MEDIUM";
  }
  return "SMALL";
};

export const isActiveVehicleModel = (model) =>
  model?.isActive ?? model?.is_active ?? model?.active ?? true;
