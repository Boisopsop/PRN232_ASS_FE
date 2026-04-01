# CapReview — Integration Gap Analysis (Cập nhật)

> Tài liệu này liệt kê các vấn đề **còn lại** cần xử lý ở phía **BE** và các tính năng
> nâng cao chưa implement. Tất cả các task FE cơ bản đã hoàn thành.

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

## 3. GAPs giữa BE API Response và FE Types (cần BE xử lý)

| # | FE Field / Type | BE Response | Gap | Gợi ý |
|---|---|---|---|---|
| G1 | `Slot.current_group_count` | **Không có** trong `SlotDto` | FE đang tính từ `GroupSlotRegistrations` | BE nên thêm `currentGroupCount` vào `SlotDto` để giảm round-trip |
| G2 | `Slot.created_by` | **Không có** trong `SlotDto` response | FE gán = 0 | BE nên trả `createdBy` trong response |
| G3 | `ReviewRoundDto.reviewDateFrom/To` | **Không có** trong response shape (chỉ có trong POST body) | FE gán = `''` nếu thiếu | **[CRITICAL]** BE cần trả `reviewDateFrom`, `reviewDateTo` trong GET response |
| G4 | `ReviewerSlotConfig.updated_at` | **Không có** trong `ReviewerSlotConfigDto` | FE gán = `''` | BE nên trả `updatedAt` |
| G5 | `LoginResponse.userId` | **Không có** — chỉ trả `token`, `fullName`, `email`, `role`, `expiresAt` | FE decode JWT để lấy userId | BE nên trả thêm `userId` trong login response |

---

## 4. BE thiếu endpoint tối ưu

| # | Tính năng | Cách FE xử lý hiện tại | BE nên bổ sung |
|---|---|---|---|
| O1 | `getSlotsForRound()` (SlotWithDetails) | Gọi **1 + N×2 + M** requests (round + slot regs + group/user details) | Endpoint `GET /api/Slots/round/{roundId}/details` trả về slot kèm `registeredGroups[]` và `registeredReviewers[]` |
| O2 | `getModeratorDashboardData()` | Composite query gọi ~10-20 requests | Endpoint dashboard tổng hợp `GET /api/Dashboard/round/{roundId}` |
| O3 | Tìm nhóm theo student ID | Fetch tất cả GroupMembers rồi filter | Endpoint `GET /api/GroupMembers/student/{studentId}` trả về GroupMember (hoặc Group luôn) |
| O4 | `getRoundsForSemester()` | Fetch tất cả rounds rồi filter client-side | Endpoint `GET /api/ReviewRounds/semester/{semesterId}` |
| O5 | Check "round có slot chưa" | Phải fetch tất cả slots cho round | Có thể dùng `GET /api/Slots/count?roundId=X` |

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

## 7. Vấn đề kỹ thuật còn lại (BE)

| # | Vấn đề | Chi tiết | Giải pháp |
|---|---|---|---|
| T1 | **CORS** | FE (port 5173) gọi BE (port 8080). BE cần cấu hình CORS. | BE thêm `AllowSpecificOrigins` policy với `http://localhost:5173` |
| T3 | **JWT expiry & refresh** | FE chưa handle token hết hạn (ngoài 401 → logout). | Thêm logic check `expiresAt` trước request, hoặc implement refresh token flow. |
| T4 | **Pagination** | FE hiện set `pageSize=100-500` để lấy tất cả. Với data lớn sẽ chậm. | Implement proper pagination UI (table pagination component). |
| T5 | **N+1 query trong `getSlotsForRound`** | Cần ~(1 + 2N + M) HTTP requests cho N slots. | BE tạo endpoint tổng hợp (xem O1 ở mục 4). |
| T6 | **Race condition đăng ký slot** | 2 user cùng đăng ký lúc có 1 chỗ trống. | BE xử lý transaction lock. FE hiển thị lỗi từ BE response. |

---

## 8. Checklist triển khai — chỉ còn BE

- [ ] **BE**: Trả thêm `reviewDateFrom`, `reviewDateTo` trong `ReviewRoundDto` response (G3 — CRITICAL)
- [ ] **BE**: Trả thêm `userId` trong login response (G5)
- [ ] **BE**: Trả `currentGroupCount` trong `SlotDto` (G1)
- [ ] **BE**: Trả `createdBy` trong `SlotDto` (G2)
- [ ] **BE**: Trả `updatedAt` trong `ReviewerSlotConfigDto` (G4)
- [ ] **BE**: Endpoint `GET /api/Slots/round/{roundId}/details` tổng hợp (O1)
- [ ] **BE**: Endpoint `GET /api/GroupMembers/student/{studentId}` (O3)
- [ ] **BE**: Endpoint `GET /api/ReviewRounds/semester/{semesterId}` (O4)
- [ ] **BE**: Transaction lock cho đăng ký slot (T6)

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
