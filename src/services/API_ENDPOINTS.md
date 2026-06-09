# AutoWash Frontend API Map

All paths are prefixed by `VITE_API_BASE_URL` and `/api`.

## Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/register/send-otp`
- `POST /api/auth/register/verify-otp`

## Customer

### Customer Dashboard

File: `customerDashboardApi.js`

- `GET /api/customer/bookings/my`
- `GET /api/customer/loyalty`

### Customer Booking

File: `customerBookingApi.js`

- `GET /api/customer/profile`
- `PUT /api/customer/profile`
- `GET /api/customer/bookings/data`
- `GET /api/customer/bookings/my`
- `POST /api/customer/bookings`
- `PUT /api/customer/bookings/:id`
- `PATCH /api/customer/bookings/:id/status`

### Customer Rewards

File: `customerLoyaltyApi.js`, `customerVoucherApi.js`

- `GET /api/customer/loyalty`
- `GET /api/customer/loyalty/vouchers`
- `POST /api/customer/loyalty/redeem`
- `POST /api/customer/vouchers/validate`

### Customer History

File: `customerHistoryApi.js`

- `GET /api/customer/bookings/my`

### Customer Profile

File: `customerProfileApi.js`

- `GET /api/customer/profile`
- `PUT /api/customer/profile`
- `GET /api/customer/bookings/my`
- `GET /api/customer/loyalty`

## Staff

### Staff Dashboard

File: `staffDashboardApi.js`

- `GET /api/staff/dashboard/pending`
- `POST /api/staff/dashboard/pending/:id/confirm`

Legacy fallback while backend migrates:

- `GET /api/staff/pending`
- `POST /api/staff/pending/confirm/:id`

### Staff Queue

File: `staffQueueApi.js`

- `GET /api/staff/queue`
- `GET /api/staff/bays`
- `POST /api/staff/bays/:bayId/assign`
- `POST /api/staff/bays/:bayId/complete`

### Staff Customers

File: `staffCustomerApi.js`

- `GET /api/staff/customers`
- `POST /api/staff/customers`

## Admin

### Admin Dashboard

File: `adminDashboardApi.js`

- `GET /api/admin/analytics/dashboard`
- `GET /api/admin/analytics/revenue`
- `GET /api/admin/bookings`

### Admin Bookings

File: `adminBookingApi.js`

- `GET /api/admin/bookings`
- `GET /api/admin/bookings/:id`
- `PUT /api/admin/bookings/:id/status`
- `DELETE /api/admin/bookings/:id`

### Admin Users

File: `adminUserApi.js`

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `PATCH /api/admin/users/:id/points`
- `POST /api/admin/users/:id/vehicles`
- `DELETE /api/admin/users/:id/vehicles/:vehicleId`

### Admin Services

File: `adminServiceApi.js`

- `GET /api/admin/services`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`
- `PATCH /api/admin/services/:id/status`

### Admin Promotions

File: `adminPromotionApi.js`

- `GET /api/admin/tiers`
- `PUT /api/admin/tiers/:id`
- `GET /api/admin/vouchers`
- `POST /api/admin/vouchers`
- `PUT /api/admin/vouchers/:id`
- `DELETE /api/admin/vouchers/:id`
- `PATCH /api/admin/vouchers/:id/status`
