# Phân Tích Chi Tiết ERD & User Flow

## PHẦN 1: ERD (Entity Relationship Diagram)

### 1.1 Danh sách Entities & Attributes

---

#### 👤 USER
```
User
├── user_id (PK)
├── full_name
├── email (UNIQUE)
├── password_hash
├── role (ENUM: STUDENT, GV_REVIEW, GVHD, MODERATOR)
├── created_at
└── updated_at
```

---

#### 👥 GROUP (Nhóm sinh viên)
```
Group
├── group_id (PK)
├── group_name
├── project_title
├── semester_id (FK → Semester)
├── gvhd_id (FK → User) ← chỉ GVHD mới được assign
├── created_at
└── updated_at
```

---

#### 🔗 GROUP_MEMBER (Sinh viên thuộc nhóm nào)
```
GroupMember
├── member_id (PK)
├── group_id (FK → Group)
├── student_id (FK → User)
└── joined_at
```
> Tách bảng này để 1 user có thể thuộc đúng 1 nhóm mỗi kỳ, dễ validate.

---

#### 📅 SEMESTER (Học kỳ)
```
Semester
├── semester_id (PK)
├── semester_name (vd: "HK1 2024-2025")
├── start_date
├── end_date
├── is_active (BOOLEAN)
└── created_at
```

---

#### 🔁 REVIEW_ROUND (Lần review trong kỳ — có 3 lần)
```
ReviewRound
├── round_id (PK)
├── semester_id (FK → Semester)
├── round_number (1, 2, 3)
├── round_name (vd: "Review 1")
├── registration_open_at
├── registration_close_at
├── review_date_from
├── review_date_to
└── status (ENUM: UPCOMING, OPEN, CLOSED, COMPLETED)
```

---

#### 🗓️ SLOT (Khung giờ review)
```
Slot
├── slot_id (PK)
├── round_id (FK → ReviewRound)
├── start_time (DATETIME)
├── end_time (DATETIME)
├── room (phòng học/link meet)
├── max_groups (DEFAULT 3)
├── current_group_count (computed hoặc trigger)
├── min_reviewers (từ config Moderator)
├── max_reviewers (từ config Moderator)
├── status (ENUM: OPEN, FULL, LOCKED, CANCELLED)
└── created_by (FK → User / Moderator)
```

---

#### 📋 GROUP_SLOT_REGISTRATION (Nhóm đăng ký slot)
```
GroupSlotRegistration
├── registration_id (PK)
├── group_id (FK → Group)
├── slot_id (FK → Slot)
├── registered_at
├── registered_by (FK → User) ← người bấm đăng ký trong nhóm
└── status (ENUM: REGISTERED, CANCELLED)
```
> **Unique constraint:** (group_id, slot_id) — 1 nhóm không đăng ký 1 slot 2 lần

---

#### 📋 REVIEWER_SLOT_REGISTRATION (GV Review đăng ký slot)
```
ReviewerSlotRegistration
├── reviewer_registration_id (PK)
├── reviewer_id (FK → User)
├── slot_id (FK → Slot)
├── registered_at
└── status (ENUM: REGISTERED, CANCELLED)
```
> **Unique constraint:** (reviewer_id, slot_id)

---

#### ⚙️ REVIEWER_SLOT_CONFIG (Moderator cấu hình min/max cho từng round)
```
ReviewerSlotConfig
├── config_id (PK)
├── round_id (FK → ReviewRound)
├── min_slots (số slot tối thiểu GV Review phải tham gia)
├── max_slots (số slot tối đa GV Review được tham gia)
└── updated_by (FK → User / Moderator)
```

---

#### 🔔 NOTIFICATION
```
Notification
├── notification_id (PK)
├── user_id (FK → User) ← người nhận
├── title
├── message
├── type (ENUM: REMINDER, ALERT, INFO)
├── is_read (BOOLEAN)
└── created_at
```

---

### 1.2 Sơ Đồ ERD (Dạng Text)

```
Semester (1) ──────────── (N) ReviewRound
                                    │
                                    │ (1)
                                    │
                                   (N)
                                  Slot ◄──── ReviewerSlotConfig (1:1 với Round)
                                 /    \
                               (N)    (N)
                               /        \
        GroupSlotRegistration            ReviewerSlotRegistration
                │                                  │
               (N)                                (N)
                │                                  │
              Group                              User (role=GV_REVIEW)
             /     \
           (N)     (1)
            │       │
     GroupMember   User (role=GVHD)
            │
           (N)
            │
         User (role=STUDENT)
```

---

### 1.3 Các Ràng Buộc Quan Trọng (Constraints)

| Constraint | Mô tả | Xử lý ở đâu |
|---|---|---|
| **C1** | 1 slot tối đa 3 nhóm | Check `current_group_count < max_groups` trước INSERT |
| **C2** | GV Review không review đề tài GVHD của mình | JOIN Group → check `gvhd_id ≠ reviewer_id` |
| **C3** | Min/Max slot của GV Review | Đếm số ReviewerSlotRegistration theo round, so với config |
| **C4** | 1 nhóm không đăng ký 2 lần cùng slot | UNIQUE (group_id, slot_id) |
| **C5** | Chỉ đăng ký khi slot OPEN & round đang mở | Check status + thời gian registration |
| **C6** | GVHD tự động có mặt, không đăng ký | Không có record trong GroupSlotRegistration cho GVHD |

---

## PHẦN 2: USER FLOW CHI TIẾT

---

### 🔵 FLOW 1: Moderator Tạo & Cấu Hình Slot

```
[START]
    │
    ▼
Moderator đăng nhập
    │
    ▼
Vào trang "Quản lý Review Round"
    │
    ▼
Chọn Semester đang hoạt động
    │
    ▼
Tạo Review Round (Round 1/2/3)
├── Nhập tên, ngày mở đăng ký, ngày đóng, ngày review
└── Set status = UPCOMING
    │
    ▼
Cấu hình Min/Max Slot cho GV Review
├── Nhập min_slots, max_slots
└── Lưu vào ReviewerSlotConfig
    │
    ▼
Tạo các Slot trong Round
├── Nhập start_time, end_time, room
├── max_groups = 3 (mặc định)
└── status = OPEN (hoặc lên lịch tự động)
    │
    ▼
Publish Round → Thông báo đến toàn bộ SV & GV Review
    │
    ▼
[END]
```

---

### 🟢 FLOW 2: Sinh Viên Đăng Ký Slot

```
[START]
    │
    ▼
Sinh viên đăng nhập
    │
    ▼
Hệ thống xác định: user thuộc Group nào? (qua GroupMember)
    │
    ├── Không thuộc nhóm nào → Hiển thị thông báo lỗi [END]
    │
    ▼
Vào trang "Đăng ký Review"
    │
    ▼
Chọn Review Round (đang OPEN)
    │
    ▼
Xem danh sách Slot
├── Hiển thị: thời gian, phòng, số nhóm hiện tại/tối đa
├── Slot FULL (3/3) → disabled, không cho chọn
└── Slot LOCKED/CANCELLED → ẩn hoặc disabled
    │
    ▼
Chọn Slot muốn đăng ký
    │
    ▼
Hệ thống kiểm tra (Backend):
├── [FAIL] Round đã đóng đăng ký? → Thông báo lỗi
├── [FAIL] Slot đã đủ 3 nhóm? (race condition check) → Thông báo lỗi
├── [FAIL] Nhóm đã đăng ký slot này rồi? → Thông báo lỗi
└── [PASS] Tất cả OK
    │
    ▼
INSERT GroupSlotRegistration (status = REGISTERED)
    │
    ▼
Cập nhật current_group_count của Slot
    │
    ▼
Gửi Notification cho các thành viên nhóm
    │
    ▼
Hiển thị: "Đăng ký thành công!"
    │
    ▼
[END]
```

---

### 🟡 FLOW 3: GV Review Đăng Ký Slot

```
[START]
    │
    ▼
GV Review đăng nhập
    │
    ▼
Vào trang "Đăng ký Slot Review"
    │
    ▼
Chọn Review Round
    │
    ▼
Hệ thống load danh sách Slot với bộ lọc:
├── Lấy tất cả Group đăng ký trong slot đó
├── Lấy GVHD của từng Group
└── ❌ Ẩn/Disable slot nếu GV Review này là GVHD của ≥1 nhóm trong slot
    │
    ▼
Hiển thị Slot hợp lệ
    │
    ▼
GV Review chọn slot muốn đăng ký
    │
    ▼
Hệ thống kiểm tra (Backend):
├── [FAIL] Đã đạt max_slots cho round này? → Thông báo lỗi
├── [FAIL] Slot chứa nhóm mà GV này là GVHD? → Thông báo lỗi (double-check)
├── [FAIL] Đã đăng ký slot này rồi? → Thông báo lỗi
└── [PASS] Tất cả OK
    │
    ▼
INSERT ReviewerSlotRegistration (status = REGISTERED)
    │
    ▼
Kiểm tra: GV có đang dưới min_slots không?
├── Còn thiếu → Hiển thị reminder "Bạn cần đăng ký thêm X slot"
└── Đủ rồi → Hiển thị "Đã đủ slot yêu cầu ✓"
    │
    ▼
[END]
```

---

### 🟠 FLOW 4: Moderator Giám Sát Dashboard

```
[START]
    │
    ▼
Moderator vào Dashboard
    │
    ▼
Xem tổng quan theo Round:
    │
    ├── 📊 Bảng Slot Status
    │   ├── Slot nào còn trống (< 3 nhóm)
    │   ├── Slot nào chưa có GV Review
│   └── Slot nào đã đầy đủ ✓
    │
    ├── 📊 Bảng GV Review Status
    │   ├── GV nào chưa đủ min_slots → highlight đỏ ⚠️
    │   └── GV nào đã đủ/vượt max_slots
    │
    └── 📊 Bảng Nhóm SV Status
        ├── Nhóm nào chưa đăng ký slot nào → highlight đỏ ⚠️
        └── Nhóm nào đã đăng ký
    │
    ▼
Hành động có thể thực hiện:
├── Gửi reminder cho nhóm/GV chưa đăng ký
├── Lock round (đóng đăng ký sớm)
├── Chỉnh sửa slot (nếu chưa lock)
└── Xem chi tiết từng slot
    │
    ▼
[END]
```

---

### 🔴 FLOW 5: Hủy Đăng Ký (SV hoặc GV Review)

```
[START]
    │
    ▼
User vào trang "Lịch của tôi"
    │
    ▼
Chọn slot muốn hủy
    │
    ▼
Hệ thống kiểm tra:
├── [FAIL] Round đã CLOSED/COMPLETED? → Không cho hủy
├── [FAIL] Slot đã LOCKED? → Không cho hủy
└── [PASS] Còn trong thời gian cho phép
    │
    ▼
Xác nhận hủy (confirmation dialog)
    │
    ▼
UPDATE status = CANCELLED
    │
    ▼
Nếu là SV: giảm current_group_count của Slot
    │
    ▼
Slot status cập nhật lại nếu cần (FULL → OPEN)
    │
    ▼
Gửi Notification xác nhận hủy
    │
    ▼
[END]
```

---

## PHẦN 3: Tóm Tắt Độ Phức Tạp & Gợi Ý Phân Chia Task

| Module | Độ phức tạp | Gợi ý giao cho |
|---|---|---|
| Auth + Role | Thấp | 1 người (setup chung) |
| Moderator: CRUD Slot, Round, Config | Trung bình | 1 người |
| SV: Đăng ký Slot (có race condition) | Cao | 1 người senior nhất |
| GV Review: Đăng ký + conflict check | Cao | Ghép với module SV |
| Dashboard Moderator | Trung bình | Người làm Moderator module |
| Notification (in-app) | Thấp | Làm sau, ai rảnh làm |
