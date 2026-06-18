# AutoWash FE API Contract

All FE requests use `VITE_API_BASE_URL` plus `/api`.

## BE Implemented Now

These endpoints exist in the current BE repo and FE should not rename them.

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`

### Customer

- `GET /api/customer/me`
- `GET /api/customer/profile`
- `PUT /api/customer/profile`

### Admin Analytics

- `GET /api/admin/bookings`
- `GET /api/admin/analytics/bookings-by-status`
- `GET /api/admin/analytics/top-used-vouchers`

## Customer API Needed By FE

These endpoints are intentionally named and used by FE, but the current BE repo does not expose them yet.

### Registration OTP

File: `authApi.js`

- `POST /api/auth/register/send-otp`
- `POST /api/auth/register/verify-otp`

### Booking Config

File: `customerConfigApi.js`

`GET /api/customer/booking-config`

Expected response:

```json
{
  "businessHours": {
    "startTime": "08:00",
    "endTime": "18:00"
  },
  "slotDurationMinutes": 60,
  "tierRules": [
    {
      "tierLevel": "MEMBER",
      "discountPercent": 0,
      "advanceBookingDays": 7
    }
  ]
}
```

### Tier Configs

File: `customerConfigApi.js`

`GET /api/customer/tier-configs`

Expected response:

```json
[
  {
    "id": 1,
    "tierLevel": "MEMBER",
    "label": "Thành viên",
    "minPoints": 0
  }
]
```

### Vehicle Models

File: `vehicleModelApi.js`

`GET /api/customer/vehicle-models`

Expected response from BE table `vehicle_models`:

```json
[
  {
    "id": 1,
    "brand": "Kia",
    "modelName": "Morning",
    "vehicleSize": "SMALL",
    "active": true
  }
]
```

### Booking Data

File: `customerBookingApi.js`

`GET /api/customer/bookings/data`

Expected response:

```json
{
  "vehicles": [
    {
      "id": 1,
      "plate": "51A-12345",
      "brand": "Kia",
      "modelName": "Morning",
      "vehicleModelId": 1,
      "vehicleSize": "SMALL"
    }
  ],
  "services": [
    {
      "id": 1,
      "name": "Rửa xe cơ bản",
      "description": "Rửa ngoài xe",
      "price": 80000
    }
  ],
  "timeSlots": [
    {
      "startTime": "08:00",
      "available": true
    }
  ]
}
```

### Customer Bookings

File: `customerBookingApi.js`

- `GET /api/customer/bookings/my`
- `POST /api/customer/bookings`
- `PUT /api/customer/bookings/:id`
- `PATCH /api/customer/bookings/:id/status`

Create booking request:

```json
{
  "plate": "51A-12345",
  "serviceId": 1,
  "date": "2026-06-12",
  "time": "08:00",
  "startTime": "08:00",
  "endTime": "09:00",
  "durationMinutes": 60,
  "paymentMethod": "PAYOS",
  "voucherCode": "SALE10",
  "price": 72000
}
```

### Loyalty And Vouchers

File: `customerLoyaltyApi.js`, `customerVoucherApi.js`

- `GET /api/customer/loyalty`
- `GET /api/customer/loyalty/vouchers`
- `GET /api/customer/:customerId/vouchers`
- `POST /api/customer/loyalty/redeem`
- `POST /api/customer/vouchers/validate`

Customer voucher response:

```json
[
  {
    "id": 1,
    "promotionId": 2,
    "voucherCode": "SALE10",
    "campaignName": "Giảm 10%",
    "discountAmount": null,
    "discountPercent": 10,
    "maxDiscountAmount": 30000,
    "status": "AVAILABLE",
    "redeemedAt": "2026-06-12T10:00:00",
    "usedAt": null,
    "expiredAt": "2026-07-12T23:59:59"
  }
]
```

Validate voucher request:

```json
{
  "code": "SALE10"
}
```

Validate voucher response:

```json
{
  "valid": true,
  "discountAmount": null,
  "discountPercent": 10,
  "maxDiscountAmount": 30000,
  "voucher": {
    "id": 1,
    "voucherCode": "SALE10"
  }
}
```

### Customer Reviews

File: `customerReviewApi.js`

- `GET /api/customer/reviews/my`
- `POST /api/customer/reviews`
- `PUT /api/customer/reviews/:id`

Create review request:

```json
{
  "bookingId": 12,
  "rating": 5,
  "comment": "Nhận xét của khách hàng"
}
```

Review response:

```json
{
  "id": 1,
  "bookingId": 12,
  "rating": 5,
  "comment": "Nhận xét của khách hàng",
  "createdAt": "2026-06-14T10:30:00"
}
```

## Admin API Needed By Existing FE

Current BE only exposes admin analytics and booking list. These endpoints are still used by admin pages and need BE support later:

Admin pages do not hardcode demo data. If an endpoint returns an empty list or
fails, the related table/chart shows an empty state. BE should return real DB
data using the shapes below.

- `GET /api/admin/analytics/dashboard`
- `GET /api/admin/analytics/revenue`
- `GET /api/admin/bookings/:id`
- `PUT /api/admin/bookings/:id/status`
- `DELETE /api/admin/bookings/:id`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `PATCH /api/admin/users/:id/points`
- `POST /api/admin/users/:id/vehicles`
- `DELETE /api/admin/users/:id/vehicles/:vehicleId`
- `GET /api/admin/services`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`
- `PATCH /api/admin/services/:id/status`

Admin booking list should support query params from FE:

```http
GET /api/admin/bookings?page=1&limit=10&status=PENDING&search=51F&startDate=2026-06-01&endDate=2026-06-15
```

Preferred booking list response:

```json
{
  "bookings": [
    {
      "id": 1001,
      "bookingCode": "BK-260615-001",
      "customerName": "Nguyen Minh Anh",
      "customerPhone": "0901234567",
      "customerEmail": "minhanh@example.com",
      "vehicleLicensePlate": "51F-123.45",
      "vehicleModel": "Toyota Vios",
      "tierLevel": "GOLD",
      "services": ["Rửa tiêu chuẩn"],
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "paymentMethod": "CASH",
      "scheduledStartTime": "2026-06-15T09:00:00",
      "totalPrice": 180000
    }
  ],
  "total": 1
}
```

Admin users response should return users/customers/staff in one list:

```json
{
  "users": [
    {
      "id": 201,
      "name": "Nguyen Minh Anh",
      "email": "minhanh@example.com",
      "phone": "0901234567",
      "role": "CUSTOMER",
      "tier": "GOLD",
      "status": "ACTIVE",
      "tierPoints": 1280,
      "rewardPoints": 420,
      "carCount": 2,
      "bookingCount": 14,
      "createdAt": "2026-05-18T08:30:00",
      "vehicles": [
        {
          "id": 1,
          "brand": "Toyota",
          "model": "Vios",
          "plate": "51F-123.45",
          "licensePlate": "51F-123.45"
        }
      ]
    }
  ]
}
```

Admin service response should support both the old flat shape and the new price matrix shape. Preferred response:

```json
[
  {
    "id": 1,
    "name": "Standard Wash",
    "description": "Rửa xe tiêu chuẩn",
    "status": "ACTIVE",
    "rating": 4.8,
    "totalRevenue": 850000,
    "servicePrices": [
      {
        "id": 11,
        "vehicleSize": "SMALL",
        "vehicleLabel": "Small (Sedan)",
        "price": 150000,
        "duration": 20,
        "active": true
      }
    ]
  }
]
```

Create/update service request:

```json
{
  "name": "Standard Wash",
  "description": "Rửa xe tiêu chuẩn",
  "status": "ACTIVE",
  "servicePrices": [
    {
      "vehicleSize": "SMALL",
      "price": 150000,
      "duration": 20,
      "active": true
    },
    {
      "vehicleSize": "MEDIUM",
      "price": 200000,
      "duration": 30,
      "active": true
    },
    {
      "vehicleSize": "LARGE",
      "price": 250000,
      "duration": 40,
      "active": true
    }
  ]
}
```
- `GET /api/admin/tiers`
- `PUT /api/admin/tiers/:id`
- `GET /api/admin/vouchers`
- `POST /api/admin/vouchers`
- `PUT /api/admin/vouchers/:id`
- `DELETE /api/admin/vouchers/:id`
- `PATCH /api/admin/vouchers/:id/status`

Admin tier response should include the number of customers currently in each tier
so the Promotions & Tiers page can display it without making an additional users
request.

Preferred `GET /api/admin/tiers` response:

```json
[
  {
    "id": 1,
    "name": "MEMBER",
    "description": "Khách hàng mới",
    "pointsRequired": 0,
    "discountPercent": 0,
    "customerCount": 18
  },
  {
    "id": 2,
    "name": "SILVER",
    "description": "Khách hàng thân thiết",
    "pointsRequired": 500,
    "discountPercent": 5,
    "customerCount": 9
  },
  {
    "id": 3,
    "name": "GOLD",
    "description": "Khách hàng ưu tiên",
    "pointsRequired": 1000,
    "discountPercent": 10,
    "customerCount": 4
  },
  {
    "id": 4,
    "name": "PLATINUM",
    "description": "Khách hàng cao cấp",
    "pointsRequired": 2000,
    "discountPercent": 15,
    "customerCount": 1
  }
]
```

FE also accepts `totalCustomers` or `customersCount` as fallback field names, but
`customerCount` is the preferred field.

`PUT /api/admin/tiers/:id` request:

```json
{
  "pointsRequired": 1000,
  "discountPercent": 10
}
```

## Staff API Needed By Existing FE

Current BE has an empty `StaffController`. These endpoints are used by FE and need BE support later:

- `GET /api/staff/dashboard/pending`
- `POST /api/staff/dashboard/pending/:id/confirm`
- `GET /api/staff/pending`
- `POST /api/staff/pending/confirm/:id`
- `GET /api/staff/queue`
- `GET /api/staff/bays`
- `POST /api/staff/bays/:bayId/assign`
- `POST /api/staff/bays/:bayId/complete`
- `GET /api/staff/customers`
- `POST /api/staff/customers`
