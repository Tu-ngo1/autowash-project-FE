# Autowash Admin API Requirements

Tai lieu nay mo ta rieng cac API backend can tra ve cho giao dien Admin cua FE.

Base URL FE dang dung: `VITE_API_BASE_URL`

Tat ca API Admin nen yeu cau:

```http
Authorization: Bearer <accessToken>
```

Role hop le: `ADMIN`

## Quy uoc response chung

FE co the doc du lieu tu response dang:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Hoac tra truc tiep array/object. Tuy nhien backend nen thong nhat theo dang `data` de de bao tri.

Loi nen tra:

```json
{
  "success": false,
  "message": "Mo ta loi ngan gon",
  "errorCode": "ADMIN_ERROR_CODE"
}
```

## 1. Dashboard

### 1.1 Lay tong quan dashboard

Endpoint:

```http
GET /api/admin/analytics/dashboard
```

Response body:

```json
{
  "totalBookings": 128,
  "todayBookings": 12,
  "pendingBookings": 5,
  "completedBookings": 90,
  "cancelledBookings": 8,
  "totalCustomers": 72,
  "totalStaff": 6,
  "totalRevenue": 24500000,
  "todayRevenue": 1200000
}
```

Ghi chu:

- `totalRevenue`, `todayRevenue` nen la so VND, khong format chuoi.
- FE se tu format thanh `24.500.000d`.

### 1.2 Lay doanh thu theo ngay/thang

Endpoint:

```http
GET /api/admin/analytics/revenue?from=2026-06-01&to=2026-06-30
```

Response body:

```json
[
  {
    "date": "2026-06-01",
    "revenue": 1200000,
    "bookingCount": 8
  }
]
```

### 1.3 Lay so don theo trang thai

Endpoint:

```http
GET /api/admin/analytics/bookings-by-status
```

Response body:

```json
[
  {
    "status": "PENDING",
    "count": 5
  },
  {
    "status": "IN_PROGRESS",
    "count": 3
  },
  {
    "status": "COMPLETED",
    "count": 90
  },
  {
    "status": "CANCELLED",
    "count": 8
  }
]
```

## 2. Admin Bookings

### 2.1 Lay danh sach booking

Endpoint:

```http
GET /api/admin/bookings?page=1&limit=10&status=PENDING&search=51F&startDate=2026-06-01&endDate=2026-06-30
```

Tat ca query params deu optional.

Response body de xuat:

```json
{
  "items": [
    {
      "id": 104,
      "bookingCode": "BK-260612-001",
      "customerId": 12,
      "customerName": "Nguyen Minh Anh",
      "customerPhone": "0909123456",
      "licensePlate": "51F-123.45",
      "vehicleBrand": "Toyota",
      "vehicleModel": "Vios",
      "vehicleSize": "MEDIUM",
      "services": [
        {
          "serviceId": 1,
          "serviceName": "Rua tieu chuan",
          "isMainService": true,
          "price": 120000,
          "durationMinutes": 45
        },
        {
          "serviceId": 5,
          "serviceName": "Hut bui noi that",
          "isMainService": false,
          "price": 60000,
          "durationMinutes": 20
        }
      ],
      "bookingDate": "2026-06-12",
      "startTime": "10:00",
      "endTime": "11:05",
      "paymentMethod": "CASH",
      "paymentStatus": "UNPAID",
      "status": "PENDING",
      "totalPrice": 180000,
      "discountAmount": 0,
      "finalPrice": 180000,
      "voucherCode": null,
      "createdAt": "2026-06-11T09:45:00",
      "updatedAt": "2026-06-11T09:45:00"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalItems": 1,
  "totalPages": 1
}
```

Field quan trong:

- `finalPrice`: tong tien cuoi cung Admin hien thi. Nen tra field nay ro rang.
- `totalPrice`: tong tien truoc giam gia.
- `discountAmount`: so tien giam.
- `services[].isMainService`: dung de tach dich vu chinh/phu neu can hien thi chi tiet.
- `vehicleSize`: `SMALL | MEDIUM | LARGE`.

Trang thai booking FE dang ho tro:

```text
PENDING
IN_PROGRESS
COMPLETED
CANCELLED
```

### 2.2 Cap nhat trang thai booking

Endpoint:

```http
PUT /api/admin/bookings/{id}/status
```

Request body:

```json
{
  "status": "IN_PROGRESS"
}
```

Response body:

```json
{
  "id": 104,
  "status": "IN_PROGRESS",
  "updatedAt": "2026-06-12T10:05:00"
}
```

### 2.3 Xoa booking

Endpoint:

```http
DELETE /api/admin/bookings/{id}
```

Quy tac:

- Booking `COMPLETED` khong duoc xoa.
- Backend nen tra loi 400 neu Admin co tinh xoa booking da hoan thanh.

Response khi thanh cong:

```json
{
  "success": true,
  "message": "Deleted booking successfully"
}
```

## 3. Admin Users

### 3.1 Lay danh sach user

Endpoint:

```http
GET /api/admin/users?role=CUSTOMER&status=ACTIVE&search=nguyen
```

Query params optional:

- `role`: `CUSTOMER | STAFF | ADMIN`
- `status`: `ACTIVE | LOCKED`
- `search`: tim theo ten, email, phone.

Response body:

```json
[
  {
    "id": 12,
    "fullName": "Nguyen Minh Anh",
    "username": "minhanh",
    "email": "minhanh@example.com",
    "phone": "0909123456",
    "role": "CUSTOMER",
    "isActive": true,
    "tier": "MEMBER",
    "points": 120,
    "washCount": 3,
    "totalSpent": 540000,
    "vehicles": [
      {
        "id": 1,
        "licensePlate": "51F-123.45",
        "brand": "Toyota",
        "modelName": "Vios",
        "vehicleSize": "MEDIUM",
        "isDefault": true
      }
    ],
    "createdAt": "2026-06-01T09:00:00",
    "updatedAt": "2026-06-12T09:00:00"
  }
]
```

Ghi chu:

- Customer can sap xep tier theo thu tu: `MEMBER`, `SILVER`, `GOLD`, `PLATINUM`.
- `MEMBER` la hang mac dinh khi dang ky, khong can diem de len hang Member.
- `vehicles` nen tra kem de Admin xem nhanh thong tin xe.

### 3.2 Tao user/staff

Endpoint:

```http
POST /api/admin/users
```

Request body:

```json
{
  "fullName": "Tran Quoc Bao",
  "username": "baotran",
  "email": "bao@example.com",
  "phone": "0911222333",
  "password": "123456",
  "role": "STAFF"
}
```

Response body:

```json
{
  "id": 21,
  "fullName": "Tran Quoc Bao",
  "username": "baotran",
  "email": "bao@example.com",
  "phone": "0911222333",
  "role": "STAFF",
  "isActive": true,
  "createdAt": "2026-06-12T09:00:00"
}
```

### 3.3 Cap nhat user

Endpoint:

```http
PUT /api/admin/users/{id}
```

Request body:

```json
{
  "fullName": "Nguyen Minh Anh",
  "email": "minhanh@example.com",
  "phone": "0909123456",
  "role": "CUSTOMER",
  "isActive": true
}
```

### 3.4 Khoa/mo khoa user

Endpoint:

```http
PUT /api/admin/users/{id}/lock
```

```http
PUT /api/admin/users/{id}/unlock
```

Response body:

```json
{
  "id": 12,
  "isActive": false
}
```

## 4. Admin Services

### 4.1 Lay danh sach dich vu

Endpoint:

```http
GET /api/admin/services
```

Response body:

```json
[
  {
    "id": 1,
    "serviceName": "Rua tieu chuan",
    "description": "Rua ngoai that co ban",
    "isMainService": true,
    "isActive": true,
    "servicePrices": [
      {
        "id": 101,
        "vehicleSize": "SMALL",
        "price": 120000,
        "durationMinutes": 45,
        "isActive": true
      },
      {
        "id": 102,
        "vehicleSize": "MEDIUM",
        "price": 150000,
        "durationMinutes": 55,
        "isActive": true
      },
      {
        "id": 103,
        "vehicleSize": "LARGE",
        "price": 180000,
        "durationMinutes": 65,
        "isActive": true
      }
    ],
    "createdAt": "2026-06-01T09:00:00",
    "updatedAt": "2026-06-12T09:00:00"
  }
]
```

Field quan trong:

- `isMainService`: `true` la dich vu chinh, `false` la dich vu phu.
- `servicePrices[].vehicleSize`: `SMALL | MEDIUM | LARGE`.
- `servicePrices[].price`: so VND.
- `servicePrices[].durationMinutes`: thoi gian lam dich vu.

### 4.2 Tao dich vu

Endpoint:

```http
POST /api/admin/services
```

Request body:

```json
{
  "serviceName": "Rua cao cap",
  "description": "Rua xe ket hop phu bong nhanh",
  "isMainService": true,
  "isActive": true,
  "servicePrices": [
    {
      "vehicleSize": "SMALL",
      "price": 220000,
      "durationMinutes": 70
    },
    {
      "vehicleSize": "MEDIUM",
      "price": 260000,
      "durationMinutes": 80
    },
    {
      "vehicleSize": "LARGE",
      "price": 300000,
      "durationMinutes": 90
    }
  ]
}
```

### 4.3 Cap nhat dich vu

Endpoint:

```http
PUT /api/admin/services/{id}
```

Request body giong `POST /api/admin/services`.

### 4.4 Bat/tat dich vu

Endpoint:

```http
PATCH /api/admin/services/{id}/status
```

Request body:

```json
{
  "isActive": true
}
```

## 5. Admin Promotions & Tiers

### 5.1 Lay danh sach tier

Endpoint:

```http
GET /api/admin/tiers
```

Response body:

```json
[
  {
    "id": 1,
    "tierName": "MEMBER",
    "minPoints": 0,
    "discountPercent": 0,
    "customerCount": 42,
    "isActive": true
  },
  {
    "id": 2,
    "tierName": "SILVER",
    "minPoints": 500,
    "discountPercent": 5,
    "customerCount": 18,
    "isActive": true
  },
  {
    "id": 3,
    "tierName": "GOLD",
    "minPoints": 1000,
    "discountPercent": 10,
    "customerCount": 9,
    "isActive": true
  },
  {
    "id": 4,
    "tierName": "PLATINUM",
    "minPoints": 2000,
    "discountPercent": 15,
    "customerCount": 3,
    "isActive": true
  }
]
```

Quy tac:

- Thu tu tier: `MEMBER`, `SILVER`, `GOLD`, `PLATINUM`.
- `MEMBER.minPoints` luon la `0`.
- `customerCount` la tong customer hien dang thuoc tier do.

### 5.2 Cap nhat tier

Endpoint:

```http
PUT /api/admin/tiers/{id}
```

Request body:

```json
{
  "minPoints": 500,
  "discountPercent": 5,
  "isActive": true
}
```

Ghi chu:

- Voi tier `MEMBER`, backend nen bo qua `minPoints` hoac ep ve `0`.

### 5.3 Lay danh sach voucher/campaign

Endpoint:

```http
GET /api/admin/vouchers?status=ACTIVE&targetTier=GOLD
```

Query params optional.

Response body:

```json
[
  {
    "id": 1,
    "voucherCode": "PROMO10",
    "campaignName": "Grand Opening 10% Off",
    "description": "Giam 10% cho tat ca hang",
    "pointCost": 50,
    "targetTier": "ALL",
    "discountType": "PERCENT",
    "discountPercent": 10,
    "discountAmount": null,
    "maxDiscountAmount": 50000,
    "quantity": 100,
    "usedCount": 12,
    "isActive": true,
    "status": "ACTIVE",
    "startAt": "2026-06-12T09:00:00",
    "endAt": "2026-09-30T23:59:59",
    "createdAt": "2026-06-01T09:00:00",
    "updatedAt": "2026-06-12T09:00:00"
  }
]
```

Field quan trong:

- `voucherCode`: ma voucher.
- `campaignName`: ten chien dich hien thi.
- `pointCost`: so diem can doi.
- `targetTier`: `ALL | MEMBER | SILVER | GOLD | PLATINUM`.
- `discountType`: `PERCENT | AMOUNT`.
- `isActive`: FE dung cho nut bat/tat.
- `startAt`, `endAt`: nen tra ISO datetime de FE format lai.

### 5.4 Tao voucher/campaign

Endpoint:

```http
POST /api/admin/vouchers
```

Request body:

```json
{
  "voucherCode": "GOLD50K",
  "campaignName": "Gold Tier Voucher 50k",
  "description": "Giam 50.000d cho khach hang Gold tro len",
  "pointCost": 200,
  "targetTier": "GOLD",
  "discountType": "AMOUNT",
  "discountAmount": 50000,
  "discountPercent": null,
  "maxDiscountAmount": null,
  "quantity": 100,
  "isActive": true,
  "startAt": "2026-06-12T09:00:00",
  "endAt": "2026-09-30T23:59:59"
}
```

### 5.5 Cap nhat voucher/campaign

Endpoint:

```http
PUT /api/admin/vouchers/{id}
```

Request body giong `POST /api/admin/vouchers`.

### 5.6 Bat/tat voucher/campaign

Endpoint:

```http
PATCH /api/admin/vouchers/{id}/status
```

Request body:

```json
{
  "isActive": false
}
```

Response body:

```json
{
  "id": 1,
  "isActive": false,
  "status": "INACTIVE"
}
```

## 6. Cac gia tri enum FE dang can

### Booking status

```text
PENDING
IN_PROGRESS
COMPLETED
CANCELLED
```

### Payment method

```text
CASH
CARD
MOMO
VNPAY
PAYOS
```

### Payment status

```text
UNPAID
PAID
FAILED
REFUNDED
```

### Vehicle size

```text
SMALL
MEDIUM
LARGE
```

### User role

```text
CUSTOMER
STAFF
ADMIN
```

### Customer tier

```text
MEMBER
SILVER
GOLD
PLATINUM
```

## 7. Ghi chu cho FE Admin

FE Admin khong dung mock data va khong hard code danh sach booking, user, service, tier hoac voucher.

Tat ca du lieu hien thi phai lay tu API backend. Khi API tra ve mang rong, FE hien trang thai rong thay vi tu chen du lieu mau.
