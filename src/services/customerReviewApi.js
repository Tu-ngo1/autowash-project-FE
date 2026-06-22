import api, { apiPath } from "./apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const getMyReviews = () =>
  api.get(apiPath("/customer/reviews/my")).then(unwrap);

export const createReview = (data) =>
  api.post(apiPath("/customer/reviews"), data).then(unwrap);

export const updateReview = (id, data) =>
  api.put(apiPath(`/customer/reviews/${id}`), data).then(unwrap);

export default {
  getMyReviews,
  createReview,
  updateReview,
};
