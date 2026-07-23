import { formatLicensePlate } from "../../utils/licensePlate";

const inputBase =
  "w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition disabled:cursor-not-allowed disabled:opacity-55 read-only:cursor-not-allowed read-only:opacity-70";

export default function VehicleFormFields({
  brandLabel = "Hãng xe",
  brands = [],
  className = "",
  disabled = false,
  fieldClassName = "",
  inputClassName = "",
  labelClassName = "",
  locked = false,
  modelLabel = "Mẫu xe",
  models = [],
  onChange,
  platePlaceholder = "50A-123456",
  readOnly = false,
  value,
}) {
  const form = value || {
    licensePlate: "",
    vehicleBrand: "",
    vehicleModelId: "",
    vehicleModelName: "",
    vehicleSize: "",
  };
  const isReadOnly = readOnly || locked;

  const emit = (patch) => onChange?.({ ...form, ...patch });
  const handleBrandChange = (brand) => {
    emit({
      vehicleBrand: brand,
      vehicleModelId: "",
      vehicleModelName: "",
      vehicleSize: "",
    });
  };
  const handleModelChange = (modelId) => {
    const selectedModel = models.find(
      (model) => String(model.id) === String(modelId),
    );
    emit({
      vehicleModelId: modelId,
      vehicleBrand: selectedModel?.brand || form.vehicleBrand,
      vehicleModelName: selectedModel?.modelName || "",
      vehicleSize: selectedModel?.vehicleSize || "",
    });
  };
  const currentModels = models.filter(
    (model) => model.brand === form.vehicleBrand,
  );

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      <label className={`block sm:col-span-2 ${fieldClassName}`}>
        <span className={labelClassName}>Biển số xe</span>
        <input
          readOnly={isReadOnly}
          disabled={disabled}
          value={formatLicensePlate(form.licensePlate)}
          onChange={(event) =>
            emit({ licensePlate: formatLicensePlate(event.target.value) })
          }
          placeholder={platePlaceholder}
          className={`${inputBase} uppercase tracking-wider ${inputClassName}`}
        />
      </label>

      <label className={`block ${fieldClassName}`}>
        <span className={labelClassName}>{brandLabel}</span>
        {isReadOnly ? (
          <input
            readOnly
            value={form.vehicleBrand || "-"}
            className={`${inputBase} ${inputClassName}`}
          />
        ) : (
          <select
            disabled={disabled || brands.length === 0}
            value={form.vehicleBrand}
            onChange={(event) => handleBrandChange(event.target.value)}
            className={`${inputBase} ${inputClassName}`}
          >
            <option value="">Chọn hãng xe</option>
            {form.vehicleBrand && !brands.includes(form.vehicleBrand) && (
              <option value={form.vehicleBrand}>{form.vehicleBrand}</option>
            )}
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className={`block ${fieldClassName}`}>
        <span className={labelClassName}>{modelLabel}</span>
        {isReadOnly ? (
          <input
            readOnly
            value={form.vehicleModelName || "-"}
            className={`${inputBase} ${inputClassName}`}
          />
        ) : (
          <select
            disabled={disabled || !form.vehicleBrand || currentModels.length === 0}
            value={form.vehicleModelId}
            onChange={(event) => handleModelChange(event.target.value)}
            className={`${inputBase} ${inputClassName}`}
          >
            <option value="">Chọn mẫu xe</option>
            {form.vehicleModelId &&
              form.vehicleModelName &&
              !currentModels.some(
                (model) => String(model.id) === String(form.vehicleModelId),
              ) && (
                <option value={form.vehicleModelId}>
                  {form.vehicleModelName}
                </option>
              )}
            {currentModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.modelName}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className={`block sm:col-span-2 ${fieldClassName}`}>
        <span className={labelClassName}>Kích thước xe</span>
        <input
          readOnly
          value={form.vehicleSize || ""}
          placeholder="Tự fill theo mẫu xe"
          className={`${inputBase} uppercase ${inputClassName}`}
        />
      </label>
    </div>
  );
}
