export const unwrapPayload = (payload, fallback = {}) =>
  payload?.data?.data ?? payload?.data ?? payload ?? fallback;

export const unwrapList = (payload, keys = []) => {
  const data = unwrapPayload(payload, {});
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

export const getNewestValue = (item = {}) => {
  const raw =
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at ||
    item.redeemedAt ||
    item.usedAt ||
    item.arrivedAt ||
    item.registeredAt ||
    item.joinedAt ||
    item.scheduledStartTime ||
    item.dateTime ||
    item.date ||
    item.startTime ||
    item.startDate ||
    "";
  const time = new Date(raw).getTime();
  return Number.isNaN(time)
    ? Number(
        item.id ||
          item.bookingId ||
          item.transactionId ||
          item.promotionId ||
          item.serviceId ||
          item.washServiceId ||
          item.userId ||
          0,
      )
    : time;
};

export const sortNewestFirst = (items = []) =>
  [...items].sort((a, b) => {
    const newestDiff = getNewestValue(b) - getNewestValue(a);
    if (newestDiff !== 0) return newestDiff;
    return (
      Number(
        b?.id ||
          b?.bookingId ||
          b?.transactionId ||
          b?.promotionId ||
          b?.serviceId ||
          b?.washServiceId ||
          b?.userId ||
          0,
      ) -
      Number(
        a?.id ||
          a?.bookingId ||
          a?.transactionId ||
          a?.promotionId ||
          a?.serviceId ||
          a?.washServiceId ||
          a?.userId ||
          0,
      )
    );
  });

export const mergeUniqueBy = (items = [], getKey) => {
  const result = [];
  const seen = new Set();
  items.filter(Boolean).forEach((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
};
