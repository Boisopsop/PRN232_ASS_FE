# CapReview — Hệ thống Đăng ký Slot Review Đồ Án

## Tech Stack

- React 18 + TypeScript
- React Router v6
- TanStack React Query
- Zustand (state management)
- Tailwind CSS + Radix UI
- Framer Motion (animations)
- Zod (validation)
- React Hook Form
- Sonner (toast notifications)
- Lucide Icons
- Date-fns

---

## Đánh Giá: Web App vs ERD & User Flow

### ERD — Entities

| Entity | Trạng thái | Ghi chú |
|--------|-----------|---------|
| User | ✅ | Đủ 4 role: STUDENT, GV_REVIEW, GVHD, MODERATOR |
| Group | ✅ | Có `gvhd_id`, `project_title`, `semester_id` |
| GroupMember | ✅ | Tách bảng riêng đúng ERD |
| Semester | ✅ | Có `is_active`, ngày bắt đầu/kết thúc |
| ReviewRound | ✅ | Đủ 4 status, có cửa sổ đăng ký + review |
| Slot | ✅ | Có `max_groups`, `current_group_count`, `min/max_reviewers` |
| GroupSlotRegistration | ✅ | Status REGISTERED/CANCELLED |
| ReviewerSlotRegistration | ✅ | Status REGISTERED/CANCELLED |
| ReviewerSlotConfig | ✅ | `min_slots`, `max_slots` per round |
| Notification | ✅ | Type REMINDER/ALERT/INFO, `is_read` |

### Constraints — Ràng Buộc

| Constraint | ERD yêu cầu | Hiện trạng |
|------------|-------------|------------|
| **C1** — 1 slot tối đa 3 nhóm | Check `current_group_count < max_groups` | ✅ |
| **C2** — GV Review không review đề tài GVHD của mình | Check `gvhd_id ≠ reviewer_id` | ✅ Check cả FE + API |
| **C3** — Min/Max slot GV Review | Đếm registrations so với config | ✅ |
| **C4** — 1 nhóm không đăng ký 1 slot 2 lần | Unique (group_id, slot_id) | ✅ |
| **C5** — Chỉ đăng ký khi slot OPEN & round mở | Check status + thời gian | ✅ |
| **C6** — GVHD tự động có mặt, không đăng ký | Không có record cho GVHD | ✅ Read-only dashboard |

---

### User Flows

#### Flow 1: Moderator Tạo & Cấu Hình Slot ✅

- Chọn Semester đang hoạt động ✅
- Tạo Review Round (1/2/3) với Zod validation ✅
- Set status = UPCOMING mặc định ✅
- Cấu hình Min/Max Slot cho GV Review ✅
- Tạo Slot (đơn lẻ + bulk creation) ✅
- Publish Round (UPCOMING → OPEN) ✅

#### Flow 2: Sinh Viên Đăng Ký Slot ✅

- Xác định user thuộc Group nào ✅
- Chọn Round đang OPEN, disable UPCOMING ✅
- Hiển thị slot: thời gian, phòng, occupancy ✅
- Slot FULL → disabled ✅
- Slot LOCKED/CANCELLED → ẩn/disabled ✅
- Backend check: round đóng, slot đầy, trùng ✅
- Nhóm chỉ đăng ký 1 slot/round ✅
- Cập nhật current_group_count ✅

#### Flow 3: GV Review Đăng Ký Slot ✅

- Load slot + filter conflict GVHD ✅
- Backend double-check GVHD conflict ✅
- Check max_slots per round ✅
- Check trùng slot ✅
- Hiển thị "cần thêm X slot" / "đã đủ ✓" ✅

#### Flow 4: Moderator Dashboard Giám Sát ✅

- Bảng Slot Status (trống/chưa có GV/đầy đủ) ✅
- GV chưa đủ min_slots → highlight đỏ ✅
- Nhóm chưa đăng ký → highlight ✅
- Gửi reminder (ALL_STUDENT, ALL_REVIEWER, cá nhân) ✅
- Lock round / Chỉnh sửa slot ✅

#### Flow 5: Hủy Đăng Ký ✅

- Vào "Lịch của tôi" ✅
- Round CLOSED/COMPLETED → không cho hủy ✅
- Slot LOCKED → không cho hủy ✅
- Confirmation dialog ✅
- Update status = CANCELLED, giảm group count ✅
- Slot FULL → OPEN khi hủy ✅

---

### Mức Độ Tuân Thủ: ~90-95%

**Điểm thiếu/khác biệt nhỏ:**

1. **Notification tự động** — Flow yêu cầu gửi notification khi đăng ký/hủy slot, nhưng app chỉ show toast UI mà không tạo record Notification trong DB.
2. **Edge case "SV chưa có nhóm"** — Flow 2 yêu cầu hiển thị lỗi nếu sinh viên không thuộc nhóm nào, logic này chưa rõ ràng (mock data luôn có nhóm sẵn).
3. **Publish Round → thông báo tự động** — Khi publish round, flow nói gửi notification đến toàn bộ SV & GV, nhưng code chỉ đổi status mà không auto-generate notifications.

---

## Cấu Trúc Dự Án

```
src/
├── components/
│   ├── layout/          # AppLayout, Sidebar, TopBar, UserAvatar
│   ├── shared/          # SlotCard, RoundTimeline, StatusBadge, OccupancyBar...
│   └── ui/              # Radix UI primitives (button, dialog, card, table...)
├── hooks/               # useRounds, useSlots, useReviewer, useDashboard, useNotifications
├── lib/
│   ├── mock/            # Mock API + data (users, rounds, slots, registrations...)
│   ├── queryClient.ts
│   └── utils.ts
├── pages/
│   ├── auth/            # LoginPage
│   ├── moderator/       # Dashboard, ManageRounds, ManageSlots, ReviewerConfig, Notifications
│   ├── reviewer/        # Dashboard, SlotRegistration, MySchedule
│   ├── student/         # Dashboard, SlotRegistration, MySchedule
│   └── shared/          # HomePage, MySchedule (shared), NotFoundPage
├── router/              # Routes, ProtectedRoute, getRoleHomePath
├── stores/              # authStore (Zustand), uiStore
├── types/               # TypeScript interfaces
├── App.tsx
└── main.tsx
```

## Roles & Navigation

| Role | Pages |
|------|-------|
| **STUDENT** | Dashboard, Đăng ký Slot, Lịch của tôi |
| **GV_REVIEW** | Dashboard, Đăng ký Slot, Lịch của tôi |
| **GVHD** | Dashboard (read-only) |
| **MODERATOR** | Dashboard, Quản lý Round, Quản lý Slot, Cấu hình GV, Thông báo |

## Demo Accounts (Mock)

| Role | Email | Password |
|------|-------|----------|
| Student | student | 123456 |
| GV Review | reviewer | 123456 |
| GVHD | gvhd | 123456 |
| Moderator | moderator | 123456 |
