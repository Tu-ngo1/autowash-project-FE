# Báo Cáo Kiểm Tra Lỗi Đóng Góp (Contribution) Trên GitHub FE

## 📌 Tổng Quan Vấn Đề
Trong repository Frontend (`AutowashProject/frontend`), tài khoản GitHub của bạn `khang_FE` không hiển thị đóng góp (contribution) trên bảng xếp hạng tác giả hoặc trên biểu đồ đóng góp (Contribution Graph) của GitHub.

---

## 🔍 Kết Quả Phân Tích Lịch Sử Commit

Sau khi truy xuất lịch sử commit (`git log`) của dự án, tổng hợp tác giả như sau:

| Tác giả (Name) | Email trong Git | Số lượng Commits | Trạng thái |
| :--- | :--- | :---: | :--- |
| **Tu-ngo1** | `ngothanhtu8989@gmail.com` | 52 | ✅ Bình thường |
| **Ngô Thanh Tú** | `ngothanhtu8989@gmail.com` | 2 | ✅ Bình thường |
| **Le Minh Khang** | `minhkhangsamsunga20@gmail.com` | 12 | ⚠️ Cần verify email trên GitHub |
| **Minh Khang** | `minhkhangsamsunga20@gamil.com` | **26** | ❌ **Sai chính tả domain email (`gamil.com`)** |

---

## 🚨 3 Nguyên Nhân Chính

### 1. ❌ Nhập sai địa chỉ Email trong Git Config (`gamil.com`)
* Đã có **26 commit** của bạn Khang ghi nhận email là `minhkhangsamsunga20@gamil.com` (*viết sai chữ `gmail` thành `gamil`*).
* GitHub dùng **Email** làm khóa chính để ánh xạ commit với tài khoản người dùng. Vì email sai, GitHub không thể liên kết 26 commit này với tài khoản `khang_FE`.

### 2. 📧 Email `minhkhangsamsunga20@gmail.com` chưa được Verify trên GitHub
* Đối với 12 commit còn lại dùng đúng email `@gmail.com`, nếu tài khoản GitHub của Khang chưa add và xác minh (verify) email này trong **Settings -> Emails**, GitHub vẫn sẽ không tính đóng góp vào tài khoản.

### 3. 🌿 Quy định về Contribution Graph của GitHub
GitHub chỉ ghi nhận đóng góp (các ô màu xanh trên profile) khi:
* Commit nằm trên **nhánh mặc định** (thường là `main`) hoặc đã được merge vào `main`.
* Email tác giả trong commit trùng khớp với email đã được verified trên tài khoản GitHub.

---

## 🛠️ Hướng Dẫn Khắc Phục Chi Tiết

### Bước 1: Khắc phục cho các commit tương lai
Bạn Khang mở Terminal/PowerShell trên máy tính cá nhân và chạy 2 lệnh sau:

```bash
git config --global user.name "Le Minh Khang"
git config --global user.email "minhkhangsamsunga20@gmail.com"
```

---

### Bước 2: Xác minh Email trên tài khoản GitHub
1. Truy cập [GitHub Email Settings](https://github.com/settings/emails).
2. Kiểm tra xem email `minhkhangsamsunga20@gmail.com` đã xuất hiện và hiển thị nhãn **Verified** chưa.
3. Nếu chưa có, chọn **Add email**, nhập `minhkhangsamsunga20@gmail.com` và bấm liên kết xác minh được gửi về hộp thư.

💡 **Mẹo cứu 26 commit cũ nhanh nhất (Không cần sửa lịch sử Git):**
* Bạn Khang thử thêm cả email bị gõ sai `minhkhangsamsunga20@gamil.com` vào mục **Settings -> Emails** trên GitHub (nếu hệ thống cho phép). Sau khi kích hoạt thành công, GitHub sẽ tự động nhận diện và cộng 26 commit cũ vào profile của Khang.

---

### Bước 3 (Tùy chọn): Sửa lại email cho 26 commit cũ trong lịch sử Git
Nếu muốn cập nhật lại toàn bộ 26 commit cũ từ `gamil.com` sang `gmail.com` chuẩn:

Run script đổi author trên local repository:
```bash
git filter-branch -f --env-filter '
OLD_EMAIL="minhkhangsamsunga20@gamil.com"
CORRECT_NAME="Le Minh Khang"
CORRECT_EMAIL="minhkhangsamsunga20@gmail.com"
if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```

Sau khi sửa xong, đẩy lại lên GitHub:
```bash
git push origin --force --all
```
*(Lưu ý: Báo trước với các thành viên trong team trước khi thực hiện `push --force`).*
