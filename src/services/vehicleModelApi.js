import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

const DEFAULT_VEHICLE_MODELS = [
  { id: 1, brand: "Toyota", modelName: "Vios", vehicleSize: "SMALL" },
  { id: 2, brand: "Toyota", modelName: "Camry", vehicleSize: "MEDIUM" },
  { id: 3, brand: "Toyota", modelName: "Corolla Cross", vehicleSize: "MEDIUM" },
  { id: 4, brand: "Toyota", modelName: "Fortuner", vehicleSize: "LARGE" },
  { id: 5, brand: "Honda", modelName: "City", vehicleSize: "SMALL" },
  { id: 6, brand: "Honda", modelName: "Civic", vehicleSize: "MEDIUM" },
  { id: 7, brand: "Honda", modelName: "CR-V", vehicleSize: "MEDIUM" },
  { id: 8, brand: "Hyundai", modelName: "Accent", vehicleSize: "SMALL" },
  { id: 9, brand: "Hyundai", modelName: "Elantra", vehicleSize: "MEDIUM" },
  { id: 10, brand: "Hyundai", modelName: "SantaFe", vehicleSize: "LARGE" },
  { id: 11, brand: "Kia", modelName: "Morning", vehicleSize: "SMALL" },
  { id: 12, brand: "Kia", modelName: "K3 / Cerato", vehicleSize: "MEDIUM" },
  { id: 13, brand: "Kia", modelName: "Sorento", vehicleSize: "LARGE" },
  { id: 14, brand: "Mazda", modelName: "Mazda 2", vehicleSize: "SMALL" },
  { id: 15, brand: "Mazda", modelName: "Mazda 3", vehicleSize: "MEDIUM" },
  { id: 16, brand: "Mazda", modelName: "CX-5", vehicleSize: "MEDIUM" },
  { id: 17, brand: "Ford", modelName: "Ranger", vehicleSize: "LARGE" },
  { id: 18, brand: "Ford", modelName: "Everest", vehicleSize: "LARGE" },
  { id: 19, brand: "VinFast", modelName: "Fadil", vehicleSize: "SMALL" },
  { id: 20, brand: "VinFast", modelName: "VF8", vehicleSize: "LARGE" },
];

export const getVehicleModels = async () => {
  try {
    const res = await api.get(apiPath("/customer/vehicle-models")).then(unwrap);
    if (Array.isArray(res) && res.length > 0) {
      return res;
    }
  } catch (error) {
    console.warn("Failed to fetch vehicle models from backend, using fallback list:", error);
  }
  return DEFAULT_VEHICLE_MODELS;
};

export default {
  getVehicleModels,
};
