# Bản Đồ Trường Dữ Liệu API (API Response Fields Map)

Tài liệu này tổng hợp cấu trúc phản hồi dữ liệu (Response JSON Structure) mà phía Frontend mong đợi từ các API của Backend. Nhờ việc tuân thủ các trường này, Backend có thể đảm bảo dữ liệu hiển thị chính xác trên toàn bộ giao diện (Customer, Staff, Admin) mà không gặp lỗi JavaScript undefined/null.

---

## 1. Xác thực tài khoản & Phân quyền (Authentication)

### 📌 Đăng nhập (`POST /api/auth/login`)

Frontend mong đợi một đối tượng chứa `token` và thông tin chi tiết của `user`:

```json
{
  "token": "string (JWT Token)",
  "user": {
    "id": "string",
    "name": "string (Họ tên hiển thị)",
    "email": "string",
    "phone": "string (Số điện thoại)",
    "role": "string (ADMIN | STAFF | CUSTOMER)",
    "tier": "string (Member | Silver | Gold | Platinum)",
    "points": 1200,
    "vehicles": [],
    "walletBalance": 0
  }
}
```

_Lưu ý xử lý của Frontend (Fallback):_

- Nhận diện token qua các trường: `token`, `accessToken`, `jwt`, `access_token`, `authToken`.
- Nhận diện user qua các trường: `user`, `account`, `customer`, hoặc toàn bộ đối tượng phản hồi.
- Nhận diện name qua: `name`, `fullName`, `username`.
- Nhận diện phone qua: `phone`, `phoneNumber`.

### 📌 Đăng ký (`POST /api/auth/register`)

Thông thường trả về trạng thái thành công hoặc thông tin user mới đăng ký:

```json
{
  "message": "Đăng ký thành công.",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

---

## 2. Phân hệ Khách hàng (Customer Module)

### 📌 Dashboard Khách hàng (`GET /api/customer/bookings/my` và `GET /api/customer/loyalty`)

#### Danh sách đặt lịch (`GET /api/customer/bookings/my` hoặc `unwrap` trả về mảng trực tiếp / `{ bookings: [...] }`)

Mỗi lượt đặt lịch trong mảng cần có cấu trúc:

```json
{
  "id": "string (ID đặt lịch)",
  "plate": "string (Biển số xe, VD: 51A-123.45)",
  "service": "string (Tên gói dịch vụ, VD: Gói Standard)",
  "serviceName": "string (Dự phòng cho service)",
  "status": "string (PENDING | RECEIVED | WASHING | DRYING | COMPLETED | CANCELLED)",
  "date": "string (Định dạng ngày YYYY-MM-DD hoặc ISO)",
  "time": "string (Khung giờ bắt đầu, VD: 08:00)",
  "price": 250000,
  "bayName": "string (Tên khoang rửa, VD: Khoang Rửa 1)",
  "bayCode": "string (Mã khoang)",
  "bay": "string (Dự phòng cho tên khoang)"
}
```

#### Điểm tích lũy & Hạng thành viên (`GET /api/customer/loyalty`)

```json
{
  "points": 1200,
  "redeemablePoints": 1200,
  "tier": "string (Member | Silver | Gold | Platinum)",
  "vouchers": []
}
```

---

### 📌 Đặt lịch rửa xe (`GET /api/customer/bookings/data`)

Trả về dữ liệu cấu hình để khách hàng chọn lựa:

```json
{
  "vehicles": [
    {
      "id": "string",
      "plate": "string",
      "name": "string (VD: Toyota Vios)",
      "label": "string",
      "size": "string (SMALL | MEDIUM | LARGE | XLARGE)",
      "vehicleSize": "string",
      "type": "string"
    }
  ],
  "services": [
    {
      "id": "string",
      "name": "string (Tên gói)",
      "label": "string",
      "price": 150000,
      "description": "string (Mô tả dịch vụ)",
      "popular": true
    }
  ],
  "timeSlots": [
    {
      "slot": "string (Khung giờ bắt đầu, VD: 08:00)",
      "time": "string",
      "startTime": "string",
      "available": true
    }
  ]
}
```

#### Tạo đặt lịch mới (`POST /api/customer/bookings`)

_Request Body gửi lên:_

```json
{
  "plate": "string",
  "serviceId": "string",
  "date": "string (YYYY-MM-DD)",
  "time": "string (VD: 08:00)",
  "startTime": "string (VD: 08:00)",
  "endTime": "string (VD: 09:00)",
  "durationMinutes": 60,
  "paymentMethod": "string (PAYOS | CASH)",
  "voucherCode": "string (nếu có)",
  "price": 235000
}
```

---

### 📌 Kiểm tra Voucher (`POST /api/customer/vouchers/validate`)

_Request Body:_ `{ "code": "VOUCHER10K" }`
_Response:_

```json
{
  "valid": true,
  "value": 10000
}
```

---

### 📌 Voucher Ưu đãi (`GET /api/customer/loyalty/vouchers`)

Trả về danh sách các voucher có thể dùng điểm để đổi:

```json
[
  {
    "id": "string",
    "voucherId": "string",
    "code": "string",
    "name": "string (Tên voucher)",
    "title": "string",
    "description": "string",
    "desc": "string",
    "pointCost": 200,
    "pointsCost": 200,
    "points": 200,
    "icon": "string (Tên icon material design, VD: local_car_wash)",
    "isActive": true
  }
]
```

---

### 📌 Thông tin cá nhân (`GET /api/customer/profile`)

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "branch": "string",
  "city": "string",
  "tier": "string",
  "points": 1200,
  "rankPoints": 1500,
  "nextTierTarget": 3000,
  "progress": 50,
  "washes": 5,
  "vehicles": []
}
```

---

## 3. Phân hệ Nhân viên (Staff Module)

### 📌 Tiếp nhận xe (`GET /api/staff/dashboard/pending` hoặc `/api/staff/pending`)

Trả về danh sách các xe đã đặt hẹn và chuẩn bị check-in hôm nay:

```json
[
  {
    "id": "string",
    "_id": "string",
    "plate": "string (Biển số xe)",
    "tier": "string (Member | Silver | Gold | Platinum)",
    "time": "string (Giờ hẹn, VD: 09:00)",
    "scanned": false,

    "customerName": "string",
    "fullName": "string",
    "name": "string",

    "phone": "string",
    "customerPhone": "string",
    "phoneNumber": "string",

    "serviceName": "string",
    "service": "string",
    "packageName": "string",
    "washPackage": "string"
  }
]
```

---

### 📌 Hàng đợi & Điều phối khoang (`GET /api/staff/queue` và `GET /api/staff/bays`)

#### Danh sách hàng đợi (`GET /api/staff/queue`)

```json
[
  {
    "id": "string",
    "_id": "string",
    "plate": "string",
    "checkinTime": "string (VD: 08:45)",
    "time": "string",
    "tier": "string"
  }
]
```

#### Trạng thái khoang rửa (`GET /api/staff/bays`)

```json
[
  {
    "id": "string",
    "_id": "string",
    "name": "string (VD: Khoang Rửa 1)",
    "type": "string (VD: Khoang tiêu chuẩn)",
    "status": "string (active | empty)",
    "currentCar": {
      "plate": "string",
      "progress": 75
    }
  }
]
```

---

### 📌 Khách hàng tại quầy (`GET /api/staff/customers`)

Danh sách hiển thị cho nhân viên (có phân trang):

```json
[
  {
    "id": "string",
    "_id": "string",
    "name": "string",
    "phone": "string",
    "plate": "string",
    "tier": "string",
    "points": 500
  }
]
```

---

## 4. Phân hệ Quản trị (Admin Module)

### 📌 Phân tích Dashboard (`GET /api/admin/analytics/dashboard`)

```json
{
  "totalRevenue": 150000000,
  "revenue": 150000000,
  "totalSales": 150000000,

  "washCount": 450,
  "totalWashes": 450,
  "bookingCount": 450,

  "newCustomers": 120,
  "customerCount": 120,
  "customers": 120,

  "pendingBookings": 12,
  "pending": 12,
  "waitingBookings": 12,

  "serviceRatios": [
    {
      "name": "Gói Tiêu chuẩn",
      "label": "Gói Tiêu chuẩn",
      "value": 150,
      "count": 150
    }
  ]
}
```

---

### 📌 Doanh thu theo biểu đồ (`GET /api/admin/analytics/revenue?range=7d`)

```json
{
  "items": [
    {
      "label": "01/06",
      "day": "01/06",
      "date": "01/06",
      "revenue": 12500000,
      "value": 12500000
    }
  ]
}
```

---

### 📌 Quản lý Đặt lịch (`GET /api/admin/bookings`) // đã done cái này

```json
{
  "bookings": [
    {
      "id": "string",
      "bookingId": "string",
      "customerName": "string",
      "customer": "string",
      "name": "string",
      "plate": "string",
      "paymentMethod": "string",
      "method": "string",
      "status": "string (PENDING | RECEIVED | WASHING | DRYING | COMPLETED | CANCELLED)",
      "price": 250000,
      "totalPrice": 250000,
      "amount": 250000
    }
  ]
}
```

---

### 📌 Quản lý Users/Khách hàng (`GET /api/admin/users`)

```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "avatar": "string (URL hình ảnh)", //k có cái này
    "role": "string (CUSTOMER | STAFF | ADMIN)",
    "tier": "string (Member | Silver | Gold | Platinum)",
    "rankPoints": 1500,
    "redeemPoints": 1200,
    "status": "string (ACTIVE | BANNED | INACTIVE)",
    "vehicles": [
      {
        "id": "string",
        "plate": "string",
        "model": "string"
      }
    ] //k đưa ra list, đưa thẳng về số lượng xe carCount
  }
]
```
