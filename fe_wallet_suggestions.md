# Hướng Dẫn Tích Hợp Ví Điện Tử (Wallet) Cho Frontend (FE)

Tài liệu này hướng dẫn lập trình viên Frontend cách thiết kế giao diện (UI) và tích hợp các API của Ví điện tử vào các màn hình đặt lịch và quản lý tài khoản của khách hàng.

---

## 1. Hiển Thị Số Dư Ví (Wallet Balance Display)

### A. Vị trí hiển thị đề xuất
- **Header / Navigation Bar:** Hiển thị số dư ví (ví dụ: `150,000đ`) bên cạnh tên tài khoản/avatar ở góc trên bên phải để người dùng luôn biết số dư của mình.
- **Trang quản lý cá nhân (Profile Dashboard):** Thêm tab **"Ví của tôi" (My Wallet)** hiển thị số dư trực quan cùng nút **Nạp tiền** và **Lịch sử giao dịch**.

### B. Quản lý trạng thái (State Management)
- Tải thông tin số dư ví từ API khi người dùng đăng nhập thành công và lưu vào State toàn cục (`Redux`, `Zustand`, `Context API` cho React hoặc `Pinia` cho Vue).
- Cập nhật trực tiếp State này khi hoàn thành giao dịch Nạp tiền hoặc Thanh toán để số dư thay đổi đồng bộ trên toàn ứng dụng mà không cần tải lại trang.

### C. Giao diện Lịch sử giao dịch (Transaction History)
- Hiển thị danh sách giao dịch dưới dạng bảng gồm các cột: *Mã giao dịch*, *Loại giao dịch*, *Số tiền*, *Nội dung*, *Thời gian*.
- Quy định màu sắc trực quan cho cột Số tiền:
  - Màu xanh lá (`+`): Dành cho `DEPOSIT` (Nạp tiền) và `REFUND` (Hoàn tiền hủy lịch).
  - Màu đỏ (`-`): Dành cho `PAYMENT` (Thanh toán lịch đặt).

---

## 2. Tích Hợp Thanh Toán Bằng Ví Khi Đặt Lịch (Booking Payment Flow)

### A. Giao diện màn hình đặt lịch
- Tại bước chọn phương thức thanh toán, thêm radio button: **"Thanh toán bằng Ví Website"**.
- Hiển thị số dư hiện tại của khách hàng ngay dưới nhãn lựa chọn.

### B. Logic ràng buộc (Validation) ở FE
- **Trường hợp 1 (Số dư ví < Tổng tiền dịch vụ):**
  - Làm mờ (disable) tùy chọn "Thanh toán bằng Ví Website".
  - Hiển thị dòng cảnh báo màu đỏ bên dưới: *"Số dư ví không đủ để thanh toán. [Nạp thêm tiền vào ví]"* (với liên kết dẫn nhanh tới trang Nạp tiền).
- **Trường hợp 2 (Số dư ví >= Tổng tiền dịch vụ):**
  - Cho phép người dùng lựa chọn phương thức này.

### C. Quy trình gọi API
1. Khi khách hàng nhấn **"Xác nhận đặt lịch"**: Gửi yêu cầu đặt lịch với trường `paymentMethod: "WALLET"` trong body của request.
2. **Xử lý phản hồi từ Backend:**
   - Do thanh toán bằng ví được xử lý tức thì ở Backend, phản hồi trả về sẽ xác nhận thành công ngay lập tức (không trả về link thanh toán như PayOS).
   - FE chỉ cần chuyển hướng người dùng sang trang **"Đặt lịch thành công"** để hiển thị mã QR Code cho booking.

---

## 3. Quy Trình Nạp Tiền Vào Ví (Wallet Deposit Flow)

### A. Giao diện màn hình nạp tiền
- Thiết kế ô nhập số tiền mong muốn (ràng buộc giá trị tối thiểu `10,000đ`).
- Thiết kế lưới nút gợi ý số tiền nạp nhanh: `50.000đ`, `100.000đ`, `200.000đ`, `500.000đ` để người dùng chọn nhanh không cần gõ.
- Nút bấm **"Nạp tiền ngay"**.

### B. Luồng hoạt động (Activity Flow)
1. Người dùng chọn/nhập số tiền và nhấn **"Nạp tiền ngay"**.
2. FE gọi API nạp tiền của Backend: `POST /api/customer/wallet/deposit` kèm số tiền (`amount`).
3. Backend gọi PayOS sinh link thanh toán QR và trả về URL cho FE.
4. FE nhận URL và chuyển hướng người dùng sang trang thanh toán PayOS (hoặc mở cửa sổ Popup/Iframe).
5. Người dùng quét mã QR bằng App Ngân hàng và thực hiện chuyển khoản.
6. Sau khi thanh toán thành công, PayOS tự động chuyển hướng người dùng quay lại đường dẫn thành công của FE (ví dụ: `http://localhost:3000/wallet/success`).
7. Tại trang thành công, FE gọi lại API lấy thông tin số dư mới của ví và hiển thị thông báo: *"Nạp tiền thành công! Số dư mới của bạn là: X,XXX,XXXđ"*.
