---
name: githubRepoAutowash
description: Quy trình tự động commit và đẩy code GitHub cho dự án AutoWash Pro (FE từ tu_FE -> main, BE từ tu_BE -> clone_main). Sử dụng skill này mỗi khi người dùng yêu cầu đẩy code lên GitHub.
---

# GitHub Code Deployment cho AutoWash Project (`githubRepoAutowash`)

Skill này định nghĩa quy trình chuẩn để kiểm tra, commit, push và merge code cho hai repository chính của hệ thống AutoWash:
- **Frontend (FE)**: `autowash-project-FE` (nhánh `tu_FE` -> merge vào `main`)
- **Backend (BE)**: `autowash-project-BE` (nhánh `tu_BE` -> merge vào `clone_main`)

---

## 1. Quy trình Đẩy Code Frontend (FE)
**Thư mục làm việc**: `frontend/`

### Các lệnh thực hiện:
```bash
# 1. Commit và push nhánh phát triển tu_FE
git checkout tu_FE
git add .
git commit -m "feat/fix: <nội dung commit>"
git push origin tu_FE

# 2. Merge vào nhánh main và push lên remote main
git checkout main
git pull origin main
git merge tu_FE
git push origin main

# 3. Đồng bộ lại tu_FE với main và quay về tu_FE
git checkout tu_FE
git merge main
git push origin tu_FE
```

---

## 2. Quy trình Đẩy Code Backend (BE)
**Thư mục làm việc**: `backend/`

### Các lệnh thực hiện:
```bash
# 1. Commit và push nhánh phát triển tu_BE
git checkout tu_BE
git add .
git commit -m "feat/fix: <nội dung commit>"
git push origin tu_BE

# 2. Merge vào nhánh clone_main và push lên remote clone_main
git checkout clone_main
git pull origin clone_main
git merge tu_BE
git push origin clone_main

# 3. Đồng bộ lại tu_BE với clone_main và quay về tu_BE
git checkout tu_BE
git merge clone_main
git push origin tu_BE
```
