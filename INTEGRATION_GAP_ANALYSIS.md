# CapReview — Integration Gap Analysis (Cập nhật)

> Tài liệu này liệt kê các vấn đề **còn lại** cần xử lý ở phía **BE** và các tính năng
> nâng cao chưa implement. Tất cả các task FE & BE cơ bản đã hoàn thành.

---

## 1. Tổng quan — FE đã hoàn thành ✅

| Hạng mục | Trạng thái |
|---|---|
| Axios client + JWT interceptor + error handler | ✅ Hoàn thành |
| DTO mappers (camelCase BE ↔ snake_case FE) | ✅ Hoàn thành |
| Tất cả API functions (login, CRUD, composite queries) | ✅ Hoàn thành |
| File `.env` với `VITE_API_BASE_URL=http://localhost:8080` | ✅ Hoàn thành |
| Bỏ field `password` khỏi FE `User` type | ✅ Hoàn thành |
| 7 hooks mới (`useStudentGroup`, `useActiveSemester`, `useAllUsers`, `useGroupRegistrations`, `useReviewerRegistrations`, `useSemesters`, `useGroups`) | ✅ Hoàn thành |
| Refactor **tất cả** trang — bỏ hoàn toàn mock import | ✅ Hoàn thành |
| Thay thế hardcode `useRounds(1)` → `useActiveSemester()` (8 trang) | ✅ Hoàn thành |
| Trang **Quản lý Semester** (CRUD) | ✅ Hoàn thành — `ManageSemesters.tsx` |
| Trang **Quản lý Group** (CRUD + thành viên) | ✅ Hoàn thành — `ManageGroups.tsx` |
| Cập nhật router + sidebar nav | ✅ Hoàn thành |
| Xoá file thừa không sử dụng (6 files) | ✅ Hoàn thành |
| Fix 401 interceptor (không logout khi login fail) | ✅ Hoàn thành |
| TypeScript build — 0 errors | ✅ Hoàn thành |

---

## 2. Naming Convention (FE ↔ BE) — Đã xử lý ✅

Mapper layer (`src/lib/api/mappers.ts`) đã xử lý toàn bộ:
- Enum/Status: FE `UPPER_SNAKE` ↔ BE `PascalCase`
- Field names: FE `snake_case` ↔ BE `camelCase`

---

## 3. GAPs giữa BE API Response và FE Types — Đã xử lý ✅

| # | FE Field / Type | BE Response | Trạng thái |
|---|---|---|---|
| G1 | `Slot.current_group_count` | BE trả `currentGroupCount` trong `SlotDto` | ✅ Đã xử lý — FE mapper đọc trực tiếp từ DTO |
| G2 | `Slot.created_by` | BE trả `createdBy` trong `SlotDto` | ✅ Đã xử lý — FE mapper đọc trực tiếp từ DTO |
| G3 | `ReviewRoundDto.reviewDateFrom/To` | BE trả `reviewDateFrom`, `reviewDateTo` trong GET response | ✅ Đã xử lý — FE DTO field không còn optional |
| G4 | `ReviewerSlotConfig.updated_at` | BE trả `updatedAt` trong `ReviewerSlotConfigDto` | ✅ Đã xử lý — FE mapper đọc trực tiếp từ DTO |
| G5 | `LoginResponse.userId` | BE trả `userId` trong login response | ✅ Đã xử lý — FE ưu tiên `data.userId`, fallback JWT claims |

---

## 4. BE endpoint tối ưu — Đã bổ sung ✅

| # | Tính năng | Cách FE xử lý | Trạng thái |
|---|---|---|---|
| O1 | `getSlotsForRound()` (SlotWithDetails) | Gọi composite query (round + slot regs + group/user details) | ✅ BE trả `currentGroupCount` trong `SlotDto`, giảm computation phía FE |
| O2 | `getModeratorDashboardData()` | Composite query gọi nhiều requests | ⏳ Chưa có endpoint tổng hợp — FE vẫn dùng composite query |
| O3 | Tìm nhóm theo student ID | Dùng `GET /api/GroupMembers/student/{studentId}` | ✅ Đã cập nhật — `useStudentGroup` gọi endpoint mới thay vì fetch tất cả |
| O4 | `getRoundsForSemester()` | Dùng `GET /api/ReviewRounds/semester/{semesterId}` | ✅ Đã cập nhật — không cần fetch all + filter client-side |
| O5 | Check "round có slot chưa" | Phải fetch tất cả slots cho round | ⏳ Chưa có `GET /api/Slots/count?roundId=X` — không critical |

---

## 5. Tính năng nâng cao chưa implement

| # | Tính năng | Mô tả | Phía | Ưu tiên |
|---|---|---|---|---|
| F1 | **GVHD Dashboard** | GVHD hiện redirect về `/reviewer/dashboard`. Cần trang/tab riêng hiển thị nhóm đang hướng dẫn & lịch review. | FE | Trung bình |
| F4 | **Trang quản lý User** (Moderator) | CRUD User. FE chưa có. | FE | Trung bình |
| F5 | **SignalR realtime** cho slot status | `/hubs/slots` endpoint. Khi 1 nhóm đăng ký, các client khác thấy slot cập nhật realtime. | FE + BE | Trung bình |
| F6 | **Notification tự động** khi nhóm đăng ký/huỷ slot | Gửi Notification cho các thành viên nhóm. | BE (server-side) | Thấp |
| F7 | **Hủy đăng ký — GV Review** | FE reviewer calendar có cancel nhưng cần kiểm tra UX + validation (round CLOSED / slot LOCKED). | FE | Thấp |
| F8 | **Student Calendar filter** | Hiển thị lịch cũ chưa rõ. Nên có filter theo round/status. | FE | Thấp |
| F9 | **Constraint C2 tooltip** | GV Review không review đề tài GVHD của mình. Cần tooltip giải thích tại sao slot bị disabled. | FE | Thấp |

---

## 6. API endpoints từ BE chưa được sử dụng ở FE

| Endpoint | Lý do chưa dùng |
|---|---|
| `POST /api/Users` | Chưa có trang quản lý User (F4) |
| `PUT /api/Users/{id}` | Chưa có trang chỉnh sửa profile |
| `DELETE /api/Users/{id}` | Chưa có trang quản lý User (F4) |
| `GET /api/Users/count` | Chưa cần |
| `GET /api/Semesters/count` | Chưa cần |
| `GET /api/Groups/count` | Chưa cần |
| `DELETE /api/Notifications/{id}` | Chưa có UI xoá notification |

---

## 7. Vấn đề kỹ thuật còn lại

| # | Vấn đề | Chi tiết | Trạng thái |
|---|---|---|---|
| T1 | **CORS** | BE đã cấu hình CORS cho `http://localhost:5173` | ✅ Đã xử lý |
| T3 | **JWT expiry & refresh** | FE chưa handle token hết hạn (ngoài 401 → logout). | ⏳ Chưa implement refresh token flow |
| T4 | **Pagination** | FE hiện set `pageSize=100-500` để lấy tất cả. Với data lớn sẽ chậm. | ⏳ Chưa implement proper pagination UI |
| T5 | **N+1 query trong `getSlotsForRound`** | Cần nhiều HTTP requests cho N slots. | ⏳ Chờ BE endpoint tổng hợp `GET /api/Slots/round/{roundId}/details` |
| T6 | **Race condition đăng ký slot** | 2 user cùng đăng ký lúc có 1 chỗ trống. | ✅ BE đã xử lý transaction lock. FE hiển thị lỗi từ BE response. |

---

## 8. Checklist triển khai — BE đã hoàn thành ✅

- [x] **BE**: Trả thêm `reviewDateFrom`, `reviewDateTo` trong `ReviewRoundDto` response (G3 — CRITICAL) → **FE đã cập nhật mapper**
- [x] **BE**: Trả thêm `userId` trong login response (G5) → **FE đã cập nhật `loginApi()`**
- [x] **BE**: Trả `currentGroupCount` trong `SlotDto` (G1) → **FE đã cập nhật `SlotDto` & `mapSlot()`**
- [x] **BE**: Trả `createdBy` trong `SlotDto` (G2) → **FE đã cập nhật `SlotDto` & `mapSlot()`**
- [x] **BE**: Trả `updatedAt` trong `ReviewerSlotConfigDto` (G4) → **FE đã cập nhật `mapReviewerConfig()`**
- [x] **BE**: Endpoint `GET /api/GroupMembers/student/{studentId}` (O3) → **FE đã cập nhật `useStudentGroup` hook**
- [x] **BE**: Endpoint `GET /api/ReviewRounds/semester/{semesterId}` (O4) → **FE đã cập nhật `getRoundsForSemester()`**
- [x] **BE**: Transaction lock cho đăng ký slot (T6)

---

## 9. Cấu trúc file API hiện tại

```
src/lib/api/
├── client.ts       ← Axios instance, JWT interceptor, error handling
├── mappers.ts      ← DTO interfaces + mapper functions (BE camelCase ↔ FE snake_case)
└── index.ts        ← Tất cả API functions (login, CRUD, composite queries)

src/hooks/
├── useActiveSemester.ts
├── useAllUsers.ts
├── useDashboard.ts
├── useGroupRegistrations.ts
├── useGroups.ts
├── useNotifications.ts
├── useOnClickOutside.ts
├── usePageTitle.ts
├── useReviewer.ts
├── useReviewerRegistrations.ts
├── useRounds.ts
├── useSemesters.ts
├── useSlots.ts
└── useStudentGroup.ts
```

Tất cả hooks và pages import từ `@/lib/api`. Mock layer (`src/lib/mock/`) chỉ giữ làm reference.
