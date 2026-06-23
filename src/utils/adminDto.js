const unwrapPayload = (response, fallback = {}) =>
  response?.data?.data ?? response?.data ?? fallback;

export const asArrayPayload = (response, keys = []) => {
  const payload = unwrapPayload(response, []);
  if (Array.isArray(payload)) return payload;
  const allKeys = [...keys, "content"];
  for (const key of allKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

export const splitDateTime = (value) => {
  if (!value) return { date: "", time: "" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const [date = "", time = ""] = String(value).split(/[T ]/);
    return { date, time: time.slice(0, 5) };
  }
  return {
    date: parsed.toLocaleDateString("vi-VN"),
    time: parsed.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export const normalizeAdminBooking = (booking = {}) => {
  const scheduled = booking.scheduledStartTime ?? booking.dateTime;
  const { date, time } = splitDateTime(scheduled);
  const services = Array.isArray(booking.services)
    ? booking.services
        .map((service) =>
          typeof service === "string"
            ? service
            : service?.name || service?.serviceName || service?.label,
        )
        .filter(Boolean)
    : booking.service
      ? [booking.service]
      : [];

  const rawTotalPrice = booking.totalPrice ?? booking.total ?? booking.price ?? booking.amount ?? 0;
  const rawFinalPrice = booking.finalPrice ?? booking.final_price ?? rawTotalPrice;
  const rawCustomerPhone =
    booking.customerPhone ?? booking.phone ?? booking.customer?.phone ?? "";
  const rawCustomerName =
    booking.customerName ??
    booking.customer?.fullName ??
    booking.customer?.name ??
    booking.user?.fullName ??
    booking.user?.name ??
    "";
  const rawCustomerEmail =
    booking.customerEmail ??
    booking.customer?.email ??
    booking.user?.email ??
    "";
  const rawPlate =
    booking.vehicleLicensePlate ??
    booking.plate ??
    booking.licensePlate ??
    booking.vehicle?.licensePlate ??
    booking.vehicle?.plate ??
    "";
  const rawVehicleModel =
    booking.vehicleModel ??
    booking.vehicle?.modelName ??
    booking.vehicle?.model ??
    [booking.vehicle?.brand, booking.vehicle?.modelName].filter(Boolean).join(" ");
  const rawTier = booking.tierLevel ?? booking.tier ?? booking.customer?.tier ?? "MEMBER";

  return {
    ...booking,
    id: booking.id ?? booking.bookingId,
    bookingId: booking.bookingId ?? booking.id,
    code: booking.bookingCode ?? booking.code,
    bookingCode: booking.bookingCode ?? booking.code,
    customerName: rawCustomerName,
    customerPhone: rawCustomerPhone,
    customerEmail: rawCustomerEmail,
    phone: rawCustomerPhone,
    plate: rawPlate,
    vehicleLicensePlate: rawPlate,
    vehicleModel: rawVehicleModel || "-",
    date: booking.date ?? date,
    time: booking.time ?? time,
    service: booking.service ?? services.join(", "),
    services,
    total: rawFinalPrice,
    totalPrice: rawTotalPrice,
    finalPrice: rawFinalPrice,
    discount: booking.discount ?? 0,
    tier: rawTier,
    tierLevel: rawTier,
    paymentMethod: booking.paymentMethod ?? booking.method,
    paymentStatus: booking.paymentStatus ?? booking.payStatus,
    scheduledStartTime: scheduled,
  };
};

export const normalizeAdminCustomer = (customer = {}) => ({
  ...customer,
  id: customer.id ?? customer.userId,
  name: customer.name ?? customer.fullName ?? "",
  fullName: customer.fullName ?? customer.name ?? "",
  tier: customer.tier ?? customer.tierLevel ?? "MEMBER",
  tierLevel: customer.tierLevel ?? customer.tier ?? "MEMBER",
  rankPoints: customer.rankPoints ?? customer.tierPoints ?? 0,
  tierPoints: customer.tierPoints ?? customer.rankPoints ?? 0,
  redeemPoints: customer.redeemPoints ?? customer.rewardPoints ?? 0,
  rewardPoints: customer.rewardPoints ?? customer.redeemPoints ?? 0,
  carsCount: customer.carsCount ?? customer.carCount ?? 0,
  carCount: customer.carCount ?? customer.carsCount ?? 0,
  bookingsCount: customer.bookingsCount ?? customer.bookingCount ?? 0,
  bookingCount: customer.bookingCount ?? customer.bookingsCount ?? 0,
});

export const normalizeTopVoucher = (voucher = {}) => ({
  ...voucher,
  id: voucher.id ?? voucher.promotionId,
  code: voucher.code ?? voucher.voucherCode,
  name: voucher.name ?? voucher.campaignName ?? voucher.voucherCode ?? "Voucher",
  discount:
    voucher.discountAmount ??
    voucher.discountPercent ??
    voucher.maxDiscountAmount ??
    0,
  usedCount: voucher.usedCount ?? voucher.usageCount ?? 0,
});
