# Office Car Booking System — Thiết kế cập nhật (Email OTP + Railway)
# Office Car Booking System — Updated Design (Email OTP + Railway)

> **Phiên bản này thay thế thiết kế SMS/WeChat trước đó.**
> **This version replaces the earlier SMS/WeChat design.**

---

## 1. Tóm tắt các quyết định / Decisions summary

| Hạng mục / Item | Quyết định / Decision | Lý do / Reason |
|---|---|---|
| Đăng nhập / Login | Email OTP | Gần như miễn phí, đơn giản / Near-free, simple |
| Hosting | Railway (gói Hobby ~$5/tháng) | Chạy 24/7, không cần quản trị server / Always-on, no server admin |
| Gửi email / Email sending | Resend (3.000/tháng free) hoặc Brevo (300/ngày free) | Free tier đủ dùng nội bộ / Free tier covers internal use |
| Database | MySQL (Railway plugin) | Tích hợp sẵn / Built-in |
| Phân quyền / Roles | employee / admin / super_admin | Theo yêu cầu / As requested |
| Approval workflow | Có / Yes (Pending → Approved) | Theo yêu cầu / As requested |

**Chi phí ước tính / Estimated cost:** ~$5/tháng (Railway) + $0 email = **~$5/tháng total**.

---

## 2. Phân quyền 3 cấp / Three-tier roles

| Vai trò / Role | Đăng nhập / Login | Quyền / Permissions |
|---|---|---|
| Employee | Email OTP (1 yếu tố / 1-factor) | Đặt xe, xem & hủy booking của mình / Book, view & cancel own bookings |
| Admin | Email OTP | Quản lý xe & booking, duyệt, dashboard, export / Manage vehicles & bookings, approve, dashboard, export |
| Super Admin | Email OTP | Mọi quyền admin + thêm/xóa admin / All admin powers + add/remove admins |

**Cơ chế Super Admin / Super Admin mechanism:**
- Email của super admin được hardcode trong biến môi trường (`SUPER_ADMIN_EMAIL`), không sửa được qua giao diện.
- The super admin email is hardcoded in an environment variable (`SUPER_ADMIN_EMAIL`), not editable via UI.
- Super admin thêm admin bằng cách nhập email người đó → hệ thống đổi `role` thành `admin`.
- The super admin adds an admin by entering their email → the system changes their `role` to `admin`.
- Email không có trong hệ thống sẽ KHÔNG nhận được OTP — đây là lớp bảo vệ đầu tiên.
- Emails not in the system will NOT receive an OTP — this is the first line of defense.

---

## 3. Database — bảng cập nhật / Updated tables

So với thiết kế cũ, thay `phone` bằng `email` và thêm bảng `otp_codes`.
Compared to the old design, replace `phone` with `email` and add an `otp_codes` table.

```sql
-- users
user_id        INT PK AUTO_INCREMENT
email          VARCHAR(255) UNIQUE NOT NULL  -- dùng để gửi OTP / used to send OTP
name           VARCHAR(255)
department     VARCHAR(255)
role           ENUM('employee','admin','super_admin') DEFAULT 'employee'
is_active      BOOLEAN DEFAULT TRUE
created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- otp_codes
id             INT PK AUTO_INCREMENT
email          VARCHAR(255) NOT NULL
code_hash      VARCHAR(255) NOT NULL          -- LƯU HASH, không lưu OTP gốc / store HASH, not raw OTP
expires_at     TIMESTAMP NOT NULL             -- hết hạn 5 phút / 5-min expiry
attempts       INT DEFAULT 0                  -- đếm số lần thử sai / failed attempt count
used           BOOLEAN DEFAULT FALSE          -- dùng 1 lần / single-use
created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- vehicles (không đổi / unchanged)
vehicle_id     INT PK AUTO_INCREMENT
license_plate  VARCHAR(50)
vehicle_name   VARCHAR(255)
capacity       INT
driver_name    VARCHAR(255)
status         ENUM('active','maintenance') DEFAULT 'active'
notes          TEXT
created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- bookings (không đổi / unchanged)
booking_id      INT PK AUTO_INCREMENT
vehicle_id      INT FK
user_id         INT FK
destination     VARCHAR(255)
purpose         VARCHAR(255)
passenger_count INT
booking_date    DATE
slot_start      TIME
slot_end        TIME
status          ENUM('pending','approved','rejected','completed','cancelled') DEFAULT 'pending'
contact_number  VARCHAR(50)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

-- Chống đặt trùng / Prevent double-booking
ALTER TABLE bookings
  ADD CONSTRAINT uq_vehicle_slot
  UNIQUE (vehicle_id, booking_date, slot_start);
```

---

## 4. Luồng đăng nhập Email OTP / Email OTP login flow

```
1. Người dùng nhập email / User enters email
2. Server kiểm tra email có trong bảng users & is_active = true không
   Server checks email exists in users table & is_active = true
   → Nếu không / If not: trả lỗi chung "Nếu email hợp lệ, OTP đã được gửi"
     (không tiết lộ email có tồn tại hay không / don't reveal if email exists)
3. Sinh OTP 6 số, lưu HASH vào otp_codes, hết hạn sau 5 phút
   Generate 6-digit OTP, store HASH in otp_codes, 5-min expiry
4. Gửi email OTP qua Resend/Brevo
   Send OTP email via Resend/Brevo
5. Người dùng nhập OTP / User enters OTP
   → So sánh hash, kiểm tra chưa hết hạn & chưa dùng & attempts < 5
     Compare hash, check not expired & not used & attempts < 5
6. Đúng → đánh dấu used=true, cấp JWT chứa role
   Correct → mark used=true, issue JWT containing role
7. Frontend lưu JWT, điều hướng theo role
   Frontend stores JWT, routes by role
```

**Quy tắc bảo mật / Security rules:**
- Lưu hash của OTP (dùng bcrypt hoặc SHA-256), không lưu OTP gốc.
  Store OTP hash (bcrypt or SHA-256), never the raw OTP.
- Giới hạn gửi OTP: tối đa 5 lần / email / giờ (rate limit) để tránh spam email.
  Rate-limit OTP sending: max 5 per email per hour to prevent email spam.
- OTP hết hạn 5 phút, dùng 1 lần.
  OTP expires in 5 min, single-use.
- Khóa sau 5 lần nhập sai, bắt gửi lại OTP mới.
  Lock after 5 wrong attempts, force requesting a new OTP.
- Thông báo lỗi chung khi email không tồn tại (chống dò email).
  Generic error when email doesn't exist (prevents email enumeration).

---

## 5. API — endpoint đăng nhập / Login endpoints

### POST `/api/v1/auth/request-otp`
Gửi OTP đến email / Send OTP to email.

Request:
```json
{ "email": "user@company.com" }
```
Response 200 (luôn trả về như nhau dù email có tồn tại hay không / always same response):
```json
{ "message": "Nếu email hợp lệ, mã OTP đã được gửi. / If the email is valid, an OTP has been sent." }
```

### POST `/api/v1/auth/verify-otp`
Xác thực OTP & cấp JWT / Verify OTP & issue JWT.

Request:
```json
{ "email": "user@company.com", "code": "123456" }
```
Response 200:
```json
{
  "token": "eyJ...",
  "user": { "user_id": 5, "name": "Nguyen Van A", "role": "employee" }
}
```
Response 401:
```json
{ "error": "INVALID_OTP", "message": "Mã sai hoặc đã hết hạn. / Invalid or expired code." }
```

### POST `/api/v1/admin/users` (chỉ super_admin / super_admin only)
Thêm admin mới / Add a new admin.

Request:
```json
{ "email": "newadmin@company.com", "name": "Tran Thi B", "role": "admin", "department": "Operations" }
```
Response 201: user object.

> Các endpoint khác (vehicles, bookings, dashboard, export) giữ nguyên như API spec trước, chỉ khác cơ chế auth.
> Other endpoints (vehicles, bookings, dashboard, export) stay as in the previous API spec; only the auth mechanism differs.

---

## 6. Triển khai trên Railway / Deploying on Railway

### Các bước / Steps

```
1. Tạo tài khoản Railway, kết nối GitHub repo
   Create a Railway account, connect your GitHub repo

2. Tạo project mới, thêm 2 service từ repo:
   Create a new project, add 2 services from the repo:
   - Backend (Node.js/Express)
   - Frontend (React — build tĩnh / static build)

3. Thêm plugin MySQL (1 click)
   Add the MySQL plugin (1 click)
   → Railway tự tạo biến DATABASE_URL / Railway auto-creates DATABASE_URL

4. Cấu hình biến môi trường / Set environment variables:
   - DATABASE_URL          (tự động / automatic)
   - JWT_SECRET            (chuỗi ngẫu nhiên dài / long random string)
   - SUPER_ADMIN_EMAIL     (email của bạn / your email)
   - RESEND_API_KEY        (lấy từ Resend / from Resend)
   - EMAIL_FROM            (vd / e.g. noreply@yourdomain.com)

5. Chạy migration tạo bảng (lần đầu / first time)
   Run migrations to create tables (first time)

6. Railway cấp URL công khai có HTTPS sẵn
   Railway gives a public URL with HTTPS included

7. (Tùy chọn / Optional) Gắn custom domain
   (Optional) Attach a custom domain
```

### Lưu ý quan trọng / Important notes

- Gói Hobby ($5/tháng) giữ app chạy 24/7 — không bị "ngủ" như bản free của Render.
  The Hobby plan ($5/mo) keeps the app running 24/7 — it doesn't "sleep" like Render's free tier.
- Để gửi email tin cậy, cấu hình SPF/DKIM cho domain trong Resend/Brevo.
  For reliable email delivery, configure SPF/DKIM for your domain in Resend/Brevo.
- KHÔNG dùng Gmail SMTP để gửi email app — bị giới hạn và dễ vào spam.
  Do NOT use Gmail SMTP for app email — it's rate-limited and lands in spam.
- Bật backup tự động cho MySQL trong Railway.
  Enable automatic MySQL backups in Railway.

---

## 7. Gói NPM gợi ý / Suggested NPM packages

```
Backend:
  express, mysql2, jsonwebtoken, bcrypt,
  express-rate-limit, express-validator,
  resend (hoặc / or @getbrevo/brevo),
  exceljs, dotenv, cors, helmet

Frontend:
  react, react-router-dom, antd, axios,
  @ant-design/charts (hoặc / or recharts), dayjs
```

---

## 8. Việc cần làm tiếp / Next steps

- [ ] Tạo tài khoản Railway & Resend / Create Railway & Resend accounts
- [ ] Xác minh domain trong Resend (SPF/DKIM) / Verify domain in Resend
- [ ] Khởi tạo repo + migration / Init repo + migrations
- [ ] Code luồng OTP trước / Build the OTP flow first
- [ ] Sau đó code booking, dashboard, export / Then booking, dashboard, export
