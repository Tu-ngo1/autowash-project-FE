# Autowash FE API Contract

Tai lieu nay mo ta cac API ma Frontend dang goi, request FE gui len,
response BE can tra ve, va cac field FE dang normalize de UI chay on dinh.

Base URL:

```text
VITE_API_BASE_URL=http://localhost:8080
```

Tat ca endpoint ben duoi duoc goi qua prefix:

```text
/api
```

Vi du: `apiPath("/auth/login")` -> `/api/auth/login`.

## 1. Authentication

File FE: `src/services/authApi.js`

Khong yeu cau JWT token.

### 1.1 Login

`POST /api/auth/login`

Request body FE gui:

```json
{
  "email": "customer@autowash.com",
  "password": "123456"
}
```

Response BE:

```json
{
  "token": "jwt-token",
  "role": "CUSTOMER | STAFF | ADMIN",
  "dashboardUrl": "/dashboard"
}
```

FE normalize:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Khach hang",
    "email": "customer@autowash.com",
    "phone": "string",
    "role": "CUSTOMER",
    "tier": "Member",
    "points": 0,
    "walletBalance": 0
  }
}
```

Fallback FE accept:

- `token`, `accessToken`, `jwt`, `access_token`, `authToken`
- `user`, `account`, `customer`, hoac response root
- role co chua chuoi `ADMIN` -> `ADMIN`, `STAFF` -> `STAFF`, con lai `CUSTOMER`

### 1.2 Send Registration OTP

`POST /api/auth/register/send-otp`

Request body:

```json
{
  "email": "string"
}
```

Response body:

```json
{
  "message": "Ma OTP da duoc gui toi email cua ban."
}
```

### 1.3 Verify Registration OTP

`POST /api/auth/register/verify-otp`

Request body:

```json
{
  "email": "string",
  "otp": "string"
}
```

Response body:

```json
{
  "message": "Email da duoc xac thuc."
}
```

### 1.4 Register

`POST /api/auth/register`

Request body FE gui:

```json
{
  "fullName": "Nguyen Van A",
  "email": "customer@example.com",
  "phone": "",
  "username": "customer@example.com",
  "password": "123456",
  "otp": "123456",
  "licensePlate": "",
  "role": "CUSTOMER"
}
```

Response body:

```json
{
  "token": "jwt-token",
  "role": "CUSTOMER",
  "dashboardUrl": "/dashboard"
}
```

## 2. Customer Profile

Files FE:

- `src/services/customerUserApi.js`
- `src/services/customerProfileApi.js`
- `src/pages/customer/CustomerProfile.jsx`

Yeu cau JWT token cua Customer.

### 2.1 Get Customer Me

`GET /api/customer/me`

Response body:

```json
{
  "id": 1,
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "email": "customer@example.com",
  "username": "customer",
  "role": "CUSTOMER",
  "status": "ACTIVE"
}
```

### 2.2 Get Customer Profile

`GET /api/customer/profile`

Response body:

```json
{
  "id": 1,
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "email": "customer@example.com",
  "rewardPoints": 420,
  "tierPoints": 1500
}
```

FE mapping:

```text
fullName -> profile.name
rewardPoints -> profile.points
tierPoints -> profile.rankPoints
```

Fallback FE accept:

- `name` thay cho `fullName`
- `points` thay cho `rewardPoints`
- `rankPoints` thay cho `tierPoints`

### 2.3 Update Customer Profile

`PUT /api/customer/profile`

Request body FE gui:

```json
{
  "fullName": "Nguyen Van A"
}
```

Response body:

```json
{
  "id": 1,
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "email": "customer@example.com",
  "username": "customer",
  "role": "CUSTOMER",
  "status": "ACTIVE"
}
```

## 3. Customer Cars

File FE: `src/services/customerCarApi.js`

Yeu cau JWT token cua Customer.

### 3.1 Get My Cars

`GET /api/customer/cars`

Response body BE:

```json
[
  {
    "id": 1,
    "licensePlate": "51F-123.45",
    "vehicleSize": "SMALL | MEDIUM | LARGE",
    "vehicleModelId": 1,
    "brand": "Toyota",
    "modelName": "Vios"
  }
]
```

FE normalize moi car thanh:

```json
{
  "id": 1,
  "plate": "51F-123.45",
  "licensePlate": "51F-123.45",
  "vehicleSize": "SMALL",
  "vehicle_size": "SMALL",
  "size": "SMALL",
  "vehicleModelId": 1,
  "modelId": 1,
  "modelName": "Vios",
  "model_name": "Vios",
  "brand": "Toyota",
  "label": "Toyota Vios"
}
```

Fallback FE accept:

- `plate` thay cho `licensePlate`
- `vehicle_size`, `size`, `type` thay cho `vehicleSize`
- `vehicle_model_id`, `modelId` thay cho `vehicleModelId`
- `model_name`, `model`, `name` thay cho `modelName`

### 3.2 Add My Car

`POST /api/customer/cars`

Request body FE gui:

```json
{
  "licensePlate": "51F-123.45",
  "vehicleSize": "SMALL",
  "vehicleModelId": 1
}
```

Response body: `CarResponse`, giong muc 3.1.

### 3.3 Update My Car

`PUT /api/customer/cars/{id}`

Request body FE gui:

```json
{
  "licensePlate": "51F-123.45",
  "vehicleSize": "SMALL",
  "vehicleModelId": 1
}
```

Response body: `CarResponse`, giong muc 3.1.

### 3.4 Delete My Car

`DELETE /api/customer/cars/{id}`

Response:

```text
Car deleted successfully
```

## 4. Vehicle Models

File FE: `src/services/vehicleModelApi.js`

### 4.1 Get Vehicle Models

`GET /api/customer/vehicle-models`

Response body BE:

```json
[
  {
    "id": 1,
    "brand": "Toyota",
    "modelName": "Vios",
    "vehicleSize": "SMALL",
    "active": true,
    "createdAt": "2026-06-19T10:00:00",
    "updatedAt": "2026-06-19T10:00:00"
  }
]
```

FE also accepts snake_case:

```json
{
  "id": 1,
  "brand": "Toyota",
  "model_name": "Vios",
  "vehicle_size": "SMALL",
  "is_active": true
}
```

FE chi hien model khi:

```text
isActive ?? is_active ?? active ?? true
```

la `true`.

## 5. Customer Booking

Files FE:

- `src/services/customerBookingApi.js`
- `src/pages/customer/CustomerBooking.jsx`
- `src/pages/customer/CustomerHistory.jsx`
- `src/pages/customer/CustomerDashboard.jsx`
- `src/pages/customer/CustomerProfile.jsx`

### 5.1 Get Booking Data

`GET /api/customer/bookings/data`

FE dung endpoint nay de lay services, time slots, business hours va tier rules
cho man Booking.

Expected response:

```json
{
  "services": [
    {
      "id": 1,
      "name": "Rua xe co ban",
      "label": "Rua xe co ban",
      "description": "Rua ngoai xe",
      "price": 120000,
      "durationMinutes": 60,
      "popular": true
    }
  ],
  "timeSlots": [
    {
      "time": "08:00",
      "available": true
    }
  ],
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

Note:

- Spec BE user gui gan day chua co endpoint nay.
- Neu BE khong co endpoint nay thi Booking page khong co service/time slot de dat lich.
- Cars tren Booking duoc lay rieng tu `GET /api/customer/cars`.

### 5.2 Create Booking

`POST /api/customer/bookings`

Request body FE gui theo spec BE:

```json
{
  "vehicleId": 1,
  "scheduledStartTime": "2026-06-20T14:30:00",
  "serviceIds": [1],
  "customerNote": ""
}
```

### 5.3 Get My Bookings

`GET /api/customer/bookings/my`

Response body BE:

```json
[
  {
    "id": 1,
    "bookingCode": "BK-001",
    "customerName": "Nguyen Van A",
    "phone": "0901234567",
    "vehicleId": 1,
    "vehicleLicensePlate": "51F-123.45",
    "scheduledStartTime": "2026-06-20T14:30:00",
    "expectedEndTime": "2026-06-20T15:30:00",
    "status": "PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED",
    "services": ["Rua xe co ban"],
    "paymentMethod": "CASH",
    "paymentStatus": "UNPAID",
    "totalPrice": 150000,
    "bayNumber": 1,
    "late": false,
    "customerNote": "string",
    "details": [
      {
        "id": 1,
        "serviceId": 1,
        "serviceName": "Rua xe co ban",
        "actualPrice": 150000,
        "actualDurationMinutes": 60
      }
    ]
  }
]
```

FE normalize booking thanh:

```json
{
  "plate": "51F-123.45",
  "vehicleLicensePlate": "51F-123.45",
  "date": "2026-06-20T14:30:00",
  "time": "14:30",
  "service": "Rua xe co ban",
  "serviceName": "Rua xe co ban",
  "price": 150000,
  "totalPrice": 150000,
  "scheduledStartTime": "2026-06-20T14:30:00"
}
```

Fallback FE accept:

- `plate` thay cho `vehicleLicensePlate`
- `dateTime` thay cho `scheduledStartTime`
- `service` thay cho `services`
- `price` thay cho `totalPrice`

### 5.4 Update Booking

`PUT /api/customer/bookings/{id}`

Request body: FE gui object `data` nguyen ban.

### 5.5 Update Booking Status

`PATCH /api/customer/bookings/{id}/status`

Request body:

```json
{
  "status": "PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED"
}
```

### 5.6 Cancel Booking

`POST /api/customer/bookings/{id}/cancel`

Response:

```text
Huy lich thanh cong
```

### 5.7 Get Booking QR

`GET /api/customer/bookings/{id}/qr`

Response body:

```json
{
  "bookingCode": "BK-001",
  "qrContent": "string"
}
```

## 6. Customer Loyalty And Vouchers

Files FE:

- `src/services/customerLoyaltyApi.js`
- `src/services/customerVoucherApi.js`
- `src/pages/customer/CustomerLoyalty.jsx`
- `src/pages/customer/CustomerBooking.jsx`

### 6.1 Get My Loyalty

`GET /api/customer/loyalty`

Expected response:

```json
{
  "tier": "Gold",
  "points": 1500,
  "tierPoints": 1500,
  "redeemablePoints": 420,
  "rewardPoints": 420,
  "nextTierTarget": 2000,
  "progress": 75,
  "vouchers": []
}
```

FE uses:

- `tier`
- `points`
- `redeemablePoints`
- `nextTierTarget`
- `progress`
- `vouchers`

### 6.2 Get Loyalty Vouchers

`GET /api/customer/loyalty/vouchers`

Expected response:

```json
[
  {
    "id": 1,
    "voucherId": 1,
    "code": "GOLD10",
    "voucherCode": "GOLD10",
    "name": "Gold 10%",
    "title": "Gold 10%",
    "description": "Giam 10%",
    "pointCost": 120,
    "pointsRequired": 120,
    "discountPercent": 10,
    "discountAmount": 0,
    "status": "AVAILABLE"
  }
]
```

Fallback FE accept:

- `pointsCost`, `points`, `pointsRequired` for cost
- `title` for name
- `desc` for description

### 6.3 Redeem Voucher

`POST /api/customer/loyalty/redeem`

Request body:

```json
{
  "voucherId": 1
}
```

### 6.4 Get Customer Vouchers

`GET /api/customer/{customerId}/vouchers`

or fallback:

`GET /api/customer/loyalty/vouchers`

FE uses this on Booking page.

### 6.5 Validate Voucher

`POST /api/customer/vouchers/validate`

Request body:

```json
{
  "code": "GOLD10"
}
```

Response body:

```json
{
  "valid": true,
  "discountPercent": 10,
  "discountAmount": 0,
  "maxDiscountAmount": 100000
}
```

## 7. Customer Reviews

File FE: `src/services/customerReviewApi.js`

### 7.1 Get My Reviews

`GET /api/customer/reviews/my`

Expected response:

```json
[
  {
    "id": 1,
    "bookingId": 1,
    "rating": 5,
    "comment": "Dich vu tot",
    "createdAt": "2026-06-19T10:00:00"
  }
]
```

### 7.2 Create Review

`POST /api/customer/reviews`

Request body:

```json
{
  "bookingId": 1,
  "rating": 5,
  "comment": "Dich vu tot"
}
```

### 7.3 Update Review

`PUT /api/customer/reviews/{id}`

Request body:

```json
{
  "rating": 5,
  "comment": "Dich vu tot"
}
```

## 8. Customer Config

File FE: `src/services/customerConfigApi.js`

### 8.1 Get Booking Config

`GET /api/customer/booking-config`

Response body:

```json
{
  "businessHours": {
    "startTime": "08:00",
    "endTime": "18:00"
  },
  "slotDurationMinutes": 60,
  "tierRules": []
}
```

### 8.2 Get Tier Configs

`GET /api/customer/tier-configs`

Response body:

```json
[
  {
    "id": 1,
    "tierLevel": "MEMBER",
    "label": "Member",
    "minPoints": 0
  }
]
```

## 9. Admin Analytics

Files FE:

- `src/services/adminAnalyticsApi.js`
- `src/services/adminDashboardApi.js`

Yeu cau JWT token cua Admin.

### 9.1 Dashboard Analytics

`GET /api/admin/analytics/dashboard`

Response body:

```json
{
  "totalRevenue": 15000000,
  "revenue": 15000000,
  "totalSales": 15000000,
  "washCount": 25,
  "totalWashes": 25,
  "bookingCount": 25,
  "newCustomers": 10,
  "customerCount": 10,
  "customers": 10,
  "pendingBookings": 3,
  "pending": 3,
  "waitingBookings": 3,
  "serviceRatios": [
    {
      "name": "Rua xe nhanh",
      "label": "Rua xe nhanh",
      "value": 15,
      "count": 15
    }
  ]
}
```

### 9.2 Revenue Analytics

`GET /api/admin/analytics/revenue`

Query params:

```text
period=DAY | WEEK | MONTH
```

Response body:

```json
[
  {
    "label": "19/06",
    "revenue": 1200000
  }
]
```

### 9.3 Bookings By Status

`GET /api/admin/analytics/bookings-by-status`

Response body:

```json
[
  {
    "status": "PENDING",
    "total": 3
  }
]
```

### 9.4 Top Used Vouchers

`GET /api/admin/analytics/top-used-vouchers`

Response body:

```json
[
  {
    "promotionId": 1,
    "voucherCode": "SALE50",
    "campaignName": "Chao He",
    "discountAmount": 50000,
    "discountPercent": 10,
    "maxDiscountAmount": 100000,
    "usedCount": 5
  }
]
```

## 10. Admin Bookings

File FE: `src/services/adminBookingApi.js`

### 10.1 Get Admin Bookings

`GET /api/admin/bookings`

Query params FE may send:

```text
status=PENDING
search=51F
startDate=2026-06-01
endDate=2026-06-15
page=1
limit=10
```

Response body:

```json
[
  {
    "id": 1,
    "bookingCode": "BK-001",
    "customerName": "Nguyen Van A",
    "phone": "0901234567",
    "vehicleLicensePlate": "51F-123.45",
    "scheduledStartTime": "2026-06-20T14:30:00",
    "status": "PENDING",
    "services": ["Rua xe co ban"],
    "paymentMethod": "CASH",
    "paymentStatus": "UNPAID",
    "totalPrice": 150000,
    "bayNumber": 1,
    "late": false
  }
]
```

FE normalizes admin bookings in `src/utils/adminDto.js`.

### 10.2 Get Admin Booking

`GET /api/admin/bookings/{id}`

### 10.3 Update Admin Booking Status

`PUT /api/admin/bookings/{id}/status`

Request body:

```json
{
  "status": "PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED"
}
```

### 10.4 Delete Admin Booking

`DELETE /api/admin/bookings/{id}`

UI note:

```text
COMPLETED bookings do not show delete button in AdminBookingsTable.
```

## 11. Admin Tiers And Vouchers

File FE: `src/services/adminPromotionApi.js`

### 11.1 Get Admin Tiers

`GET /api/admin/tiers`

Response body:

```json
[
  {
    "id": "SILVER",
    "name": "Silver",
    "description": "Uu dai hang Bac",
    "pointsRequired": 100,
    "discountPercent": 5,
    "customerCount": 2
  }
]
```

FE accepts:

- `customerCount`
- fallback `totalCustomers`, `customersCount`

### 11.2 Update Admin Tier

`PUT /api/admin/tiers/{id}`

Request body:

```json
{
  "pointsRequired": 100,
  "discountPercent": 5
}
```

### 11.3 Get Admin Vouchers

`GET /api/admin/vouchers`

Response body:

```json
[
  {
    "id": 1,
    "name": "Voucher",
    "code": "SALE50",
    "pointsRequired": 50,
    "tier": "SILVER | GOLD | PLATINUM | MEMBER",
    "startDate": "2026-06-01T00:00:00",
    "endDate": "2026-06-30T23:59:59",
    "isActive": true,
    "discountType": "PERCENTAGE | FLAT",
    "discountValue": 10
  }
]
```

### 11.4 Create Admin Voucher

`POST /api/admin/vouchers`

### 11.5 Update Admin Voucher

`PUT /api/admin/vouchers/{id}`

### 11.6 Delete Admin Voucher

`DELETE /api/admin/vouchers/{id}`

### 11.7 Update Voucher Status

`PATCH /api/admin/vouchers/{id}/status`

Request body:

```json
{
  "isActive": true
}
```

## 12. Admin Users

File FE: `src/services/adminUserApi.js`

### 12.1 Get Admin Users

`GET /api/admin/users`

Query params: FE may pass filter/page params.

### 12.2 Get Admin User

`GET /api/admin/users/{id}`

### 12.3 Create Admin User

`POST /api/admin/users`

### 12.4 Update Admin User

`PUT /api/admin/users/{id}`

### 12.5 Lock Admin User

`PUT /api/admin/users/{id}/lock`

### 12.6 Unlock Admin User

`PUT /api/admin/users/{id}/unlock`

### 12.7 Create Staff

`POST /api/admin/staff`

Request body:

```json
{
  "fullName": "Staff Name",
  "phone": "0901234567",
  "email": "staff@example.com",
  "username": "staff",
  "password": "123456"
}
```

### 12.8 Update User Points

`PATCH /api/admin/users/{id}/points`

### 12.9 Add User Vehicle

`POST /api/admin/users/{id}/vehicles`

### 12.10 Delete User Vehicle

`DELETE /api/admin/users/{id}/vehicles/{vehicleId}`

## 13. Admin Services

File FE: `src/services/adminServiceApi.js`

### 13.1 Get Admin Services

`GET /api/admin/services`

### 13.2 Create Admin Service

`POST /api/admin/services`

### 13.3 Update Admin Service

`PUT /api/admin/services/{id}`

### 13.4 Delete Admin Service

`DELETE /api/admin/services/{id}`

### 13.5 Update Admin Service Status

`PATCH /api/admin/services/{id}/status`

Request body:

```json
{
  "status": "ACTIVE | INACTIVE"
}
```

## 14. Staff Bookings

File FE: `src/services/staffBookingApi.js`

### 14.1 Check In Booking By QR

`POST /api/staff/bookings/check-in`

Query params:

```text
qrContent=string
```

Response body: `BookingResponse`.

### 14.2 Update Staff Booking Status

`PUT /api/staff/bookings/{id}/status`

Request body:

```json
{
  "status": "PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED"
}
```

Response body: `BookingResponse`.

## 15. Staff Legacy/Extra APIs Used By FE

These endpoints are still used by staff screens but are not in the latest BE
spec sent by the team. Keep or replace after BE confirms final staff module.

### 15.1 Staff Dashboard Pending

Files FE: `src/services/staffDashboardApi.js`

Primary:

```text
GET /api/staff/dashboard/pending
POST /api/staff/dashboard/pending/{id}/confirm
```

Fallback:

```text
GET /api/staff/pending
POST /api/staff/pending/confirm/{id}
```

### 15.2 Staff Queue And Bays

File FE: `src/services/staffQueueApi.js`

```text
GET /api/staff/queue
GET /api/staff/bays
POST /api/staff/bays/{bayId}/assign
POST /api/staff/bays/{bayId}/complete
```

### 15.3 Staff Customers

File FE: `src/services/staffCustomerApi.js`

```text
GET /api/staff/customers
POST /api/staff/customers
```

## 16. Mock Login Note

Files FE:

- `src/services/LoginServices.js`
- `src/services/mockAuthApi.js`

FE currently keeps mock login only:

```env
VITE_ENABLE_MOCK_AUTH=true
```

When enabled:

```text
admin@autowash.com / 123456
staff@autowash.com / 123456
customer@autowash.com / 123456
```

Customer mock login does not provide mock customer data. Customer pages call
real APIs and only normalize real BE responses.
