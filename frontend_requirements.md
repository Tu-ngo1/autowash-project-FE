# Yêu cầu Tích hợp Frontend (FE Requirements)

Để hỗ trợ luồng thanh toán Ví (`WALLET`) và Cổng thanh toán trực tuyến (`PAYOS`) mới hoàn thành ở Backend, đội ngũ Frontend cần thực hiện các thay đổi và bổ sung sau đây.

---

## 1. Cập nhật Luồng Đặt lịch (Booking Creation Flow)

Khi gửi Request tạo lịch hẹn đến API:
* **Endpoint:** `POST /api/customer/bookings` (hoặc endpoint tạo booking hiện tại)
* **Request Body:** Đảm bảo trường `paymentMethod` có thể nhận các giá trị:
  - `"CASH"` (Tiền mặt)
  - `"WALLET"` (Ví điện tử)
  - `"PAYOS"` (Thanh toán online qua PayOS)

### Xử lý kết quả trả về từ Backend (Response DTO):
Backend sẽ trả về `BookingResponse` có cấu trúc:
```json
{
  "id": 12,
  "bookingCode": "BK-123456",
  "paymentMethod": "PAYOS",
  "paymentStatus": "PENDING",
  "totalPrice": 200000,
  "finalPrice": 180000,
  "checkoutUrl": "https://pay.payos.vn/web/c5bffbef-..." 
}
```

**Logic FE cần xử lý sau khi nhận Response:**
1. **Nếu `paymentMethod === 'WALLET'` hoặc `'CASH'`**:
   - Không có `checkoutUrl`.
   - Hiển thị thông báo đặt lịch thành công.
   - Chuyển hướng người dùng về trang **Lịch sử đặt lịch** (`/my-bookings`).
2. **Nếu `paymentMethod === 'PAYOS'`**:
   - Backend sẽ trả về link thanh toán trong trường `checkoutUrl`.
   - FE cần kiểm tra: `if (response.checkoutUrl)`.
   - **Chuyển hướng trình duyệt** của người dùng sang link này:
     ```javascript
     window.location.href = response.checkoutUrl;
     // Hoặc mở tab mới nếu muốn giữ trang ứng dụng
     ```

---

## 2. Tạo các Trang Chờ chuyển hướng (Redirect Landing Pages)

Sau khi khách hàng thực hiện thanh toán trên giao diện cổng ngân hàng của PayOS, hệ thống PayOS sẽ tự động chuyển hướng người dùng quay trở lại trang Web của bạn. FE cần bổ sung 2 route sau:

### A. Trang Thanh toán Thành công
* **URL Route:** `/payment-success`
* **Nhiệm vụ:**
  - Hiển thị giao diện "Thanh toán thành công" trực quan, đẹp mắt.
  - Hiển thị các thông tin xác nhận đặt lịch.
  - Có nút chuyển hướng người dùng sang trang **Lịch sử đặt lịch** hoặc **Trang chủ**.

### B. Trang Thanh toán Thất bại / Hủy bỏ
* **URL Route:** `/payment-failed`
* **Nhiệm vụ:**
  - Hiển thị giao diện cảnh báo "Thanh toán không thành công" hoặc "Giao dịch đã bị hủy bỏ".
  - Có nút hướng dẫn khách hàng đặt lịch lại hoặc liên hệ hotline hỗ trợ.

---

## 3. Tích hợp API Cấu hình đặt lịch theo Hạng thành viên (Tùy chọn nâng cao)

Nếu FE muốn cấu hình động khung giờ đặt lịch và giới hạn ngày đặt lịch trước theo hạng thành viên (như Bạc, Vàng, Bạch kim):
* **Endpoint:** `GET /api/customer/booking-config`
* **Response DTO:**
  ```json
  {
    "businessHours": {
      "startTime": "08:00",
      "endTime": "18:00"
    },
    "slotDurationMinutes": 60,
    "tierRules": [
      { "tierLevel": "MEMBER", "discountPercent": 0.0, "advanceBookingDays": 7 },
      { "tierLevel": "SILVER", "discountPercent": 5.0, "advanceBookingDays": 10 },
      { "tierLevel": "GOLD", "discountPercent": 10.0, "advanceBookingDays": 14 },
      { "tierLevel": "PLATINUM", "discountPercent": 15.0, "advanceBookingDays": 30 }
    ]
  }
  ```
* **Nhiệm vụ phía FE:**
  - Giới hạn khoảng chọn ngày trên DatePicker dựa vào `advanceBookingDays` tương ứng với hạng của User đang đăng nhập.
  - Chỉ cho phép chọn giờ nằm trong khoảng `businessHours` (`startTime` - `endTime`).
