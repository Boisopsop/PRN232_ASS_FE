# ReviewSlotManager Backend API Reference

Tai lieu nay de FE co the mock API nhanh theo dung contract hien tai cua BE.

## 1) Base URL va quy uoc chung

- Base URL local (thuong dung): `https://localhost:<port>`
- Prefix API: `/api`
- Content-Type request: `application/json`
- Pagination mac dinh (neu endpoint co): `pageSize=20&pageNumber=1`
- Error response format (tu middleware):

```json
{
  "error": "Noi dung loi",
  "status": 400
}
```

## 2) Danh sach enum/string quan trong

### User Role
- `Student`
- `GvReview`
- `Gvhd`
- `Moderator`

### Review Round Status
- `Upcoming`
- `Open`
- `Closed`
- `Completed`

### Slot Status
- `Open`
- `Full`
- `Locked`
- `Cancelled`

### Registration Status
- `Registered`
- `Cancelled`

### Notification Type
- `Reminder`
- `Alert`
- `Info`

---

## 3) Auth APIs

### POST `/api/Auth/login`
Dang nhap bang email/password, tra ve JWT.

Request body:
```json
{
  "email": "student1@fpt.edu.vn",
  "password": "123456"
}
```

Response `200`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "fullName": "Nguyen Van A",
  "email": "student1@fpt.edu.vn",
  "role": "Student",
  "expiresAt": "2026-03-31T14:00:00Z"
}
```

---

## 4) Users APIs

### GET `/api/Users?pageSize=20&pageNumber=1`
Lay danh sach user.

### GET `/api/Users/{id}`
Lay chi tiet user theo id.

### GET `/api/Users/count`
Dem tong so user.

Response `200`:
```json
{ "count": 25 }
```

### POST `/api/Users`
Tao user moi.

Request body:
```json
{
  "fullName": "Tran Thi B",
  "email": "b@fpt.edu.vn",
  "password": "123456",
  "role": "Student"
}
```

### PUT `/api/Users/{id}`
Cap nhat user.

Request body:
```json
{
  "fullName": "Tran Thi B Updated",
  "email": "b@fpt.edu.vn",
  "role": "Student"
}
```

### DELETE `/api/Users/{id}`
Xoa user.

UserDto response shape:
```json
{
  "userId": 1,
  "fullName": "Tran Thi B",
  "email": "b@fpt.edu.vn",
  "role": "Student",
  "createdAt": "2026-03-31T10:00:00Z",
  "updatedAt": "2026-03-31T10:00:00Z"
}
```

---

## 5) Semesters APIs

### GET `/api/Semesters?pageSize=20&pageNumber=1`
### GET `/api/Semesters/{id}`
### GET `/api/Semesters/count`
### GET `/api/Semesters/active`

`/active` tra semester dang active, co the `404` neu khong co.

### POST `/api/Semesters`
Request body:
```json
{
  "semesterName": "HK1 2026-2027",
  "startDate": "2026-09-01T00:00:00Z",
  "endDate": "2027-01-15T00:00:00Z",
  "isActive": true
}
```

### PUT `/api/Semesters/{id}`
Request body giong `POST`.

### DELETE `/api/Semesters/{id}`

SemesterDto response shape:
```json
{
  "semesterId": 1,
  "semesterName": "HK1 2026-2027",
  "startDate": "2026-09-01T00:00:00Z",
  "endDate": "2027-01-15T00:00:00Z",
  "isActive": true,
  "createdAt": "2026-03-31T10:00:00Z"
}
```

---

## 6) Groups APIs

### GET `/api/Groups?pageSize=20&pageNumber=1`
### GET `/api/Groups/{id}`
### GET `/api/Groups/count`
### GET `/api/Groups/semester/{semesterId}`

### POST `/api/Groups`
Request body:
```json
{
  "groupName": "SE1701_G1",
  "projectTitle": "Review Slot Manager",
  "semesterId": 1,
  "gvhdId": 3
}
```

### PUT `/api/Groups/{id}`
Request body:
```json
{
  "groupName": "SE1701_G1",
  "projectTitle": "Review Slot Manager v2",
  "gvhdId": 3
}
```

### DELETE `/api/Groups/{id}`

GroupDto response shape:
```json
{
  "groupId": 10,
  "groupName": "SE1701_G1",
  "projectTitle": "Review Slot Manager",
  "semesterId": 1,
  "gvhdId": 3,
  "createdAt": "2026-03-31T10:00:00Z",
  "updatedAt": "2026-03-31T10:00:00Z"
}
```

---

## 7) GroupMembers APIs

### GET `/api/GroupMembers?pageSize=20&pageNumber=1`
### GET `/api/GroupMembers/{id}`
### GET `/api/GroupMembers/count`
### GET `/api/GroupMembers/group/{groupId}`

### POST `/api/GroupMembers`
Request body:
```json
{
  "groupId": 10,
  "studentId": 21
}
```

### DELETE `/api/GroupMembers/{id}`

GroupMemberDto response shape:
```json
{
  "memberId": 100,
  "groupId": 10,
  "studentId": 21,
  "joinedAt": "2026-03-31T10:00:00Z"
}
```

---

## 8) ReviewRounds APIs

### GET `/api/ReviewRounds?pageSize=20&pageNumber=1`
### GET `/api/ReviewRounds/{id}`
### GET `/api/ReviewRounds/open`

### POST `/api/ReviewRounds`
Request body:
```json
{
  "semesterId": 1,
  "roundNumber": 1,
  "roundName": "Review 1",
  "registrationOpenAt": "2026-10-01T00:00:00Z",
  "registrationCloseAt": "2026-10-10T23:59:59Z",
  "reviewDateFrom": "2026-10-15T08:00:00Z",
  "reviewDateTo": "2026-10-20T17:00:00Z"
}
```

### PUT `/api/ReviewRounds/{id}`
Request body:
```json
{
  "roundName": "Review 1 - Updated",
  "registrationOpenAt": "2026-10-01T00:00:00Z",
  "registrationCloseAt": "2026-10-12T23:59:59Z",
  "reviewDateFrom": "2026-10-16T08:00:00Z",
  "reviewDateTo": "2026-10-21T17:00:00Z",
  "status": "Open"
}
```

### DELETE `/api/ReviewRounds/{id}`

ReviewRoundDto response shape:
```json
{
  "roundId": 5,
  "semesterId": 1,
  "roundNumber": 1,
  "roundName": "Review 1",
  "registrationOpenAt": "2026-10-01T00:00:00Z",
  "registrationCloseAt": "2026-10-10T23:59:59Z",
  "status": "Open"
}
```

---

## 9) Slots APIs

### GET `/api/Slots?pageSize=20&pageNumber=1`
### GET `/api/Slots/{id}`
### GET `/api/Slots/round/{roundId}`
Lay cac slot theo round (bao gom status `Open`/`Full`).

### POST `/api/Slots`
Request body:
```json
{
  "roundId": 5,
  "startTime": "2026-10-15T08:00:00Z",
  "endTime": "2026-10-15T10:00:00Z",
  "room": "BE-201",
  "maxGroups": 3,
  "minReviewers": 1,
  "maxReviewers": 3,
  "createdBy": 4
}
```

### PUT `/api/Slots/{id}`
Request body:
```json
{
  "startTime": "2026-10-15T08:30:00Z",
  "endTime": "2026-10-15T10:30:00Z",
  "room": "BE-202",
  "maxGroups": 3,
  "minReviewers": 1,
  "maxReviewers": 3,
  "status": "Open"
}
```

### DELETE `/api/Slots/{id}`

SlotDto response shape:
```json
{
  "slotId": 12,
  "roundId": 5,
  "startTime": "2026-10-15T08:00:00Z",
  "endTime": "2026-10-15T10:00:00Z",
  "room": "BE-201",
  "maxGroups": 3,
  "minReviewers": 1,
  "maxReviewers": 3,
  "status": "Open"
}
```

---

## 10) GroupSlotRegistrations APIs (Sinh vien dang ky slot)

### GET `/api/GroupSlotRegistrations?pageSize=20&pageNumber=1`
### GET `/api/GroupSlotRegistrations/{id}`
### GET `/api/GroupSlotRegistrations/count`
### GET `/api/GroupSlotRegistrations/slot/{slotId}`
### GET `/api/GroupSlotRegistrations/group/{groupId}`

### POST `/api/GroupSlotRegistrations`
Request body:
```json
{
  "groupId": 10,
  "slotId": 12,
  "registeredBy": 21
}
```

### PUT `/api/GroupSlotRegistrations/{registrationId}/cancel`
Huy dang ky slot cua nhom.

GroupSlotRegistrationDto response shape:
```json
{
  "registrationId": 200,
  "groupId": 10,
  "slotId": 12,
  "registeredBy": 21,
  "registeredAt": "2026-03-31T10:00:00Z",
  "status": "Registered"
}
```

---

## 11) ReviewerSlotRegistrations APIs (GV review dang ky slot)

### GET `/api/ReviewerSlotRegistrations?pageSize=20&pageNumber=1`
### GET `/api/ReviewerSlotRegistrations/{id}`
### GET `/api/ReviewerSlotRegistrations/count`
### GET `/api/ReviewerSlotRegistrations/slot/{slotId}`
### GET `/api/ReviewerSlotRegistrations/reviewer/{reviewerId}`

### POST `/api/ReviewerSlotRegistrations`
Request body:
```json
{
  "reviewerId": 8,
  "slotId": 12
}
```

### PUT `/api/ReviewerSlotRegistrations/{registrationId}/cancel`

ReviewerSlotRegistrationDto response shape:
```json
{
  "reviewerRegistrationId": 300,
  "reviewerId": 8,
  "slotId": 12,
  "registeredAt": "2026-03-31T10:00:00Z",
  "status": "Registered"
}
```

---

## 12) ReviewerSlotConfigs APIs

### GET `/api/ReviewerSlotConfigs?pageSize=20&pageNumber=1`
### GET `/api/ReviewerSlotConfigs/{id}`
### GET `/api/ReviewerSlotConfigs/round/{roundId}`

`/round/{roundId}` co the `404` neu round chua co config.

### POST `/api/ReviewerSlotConfigs`
Request body:
```json
{
  "roundId": 5,
  "minSlots": 1,
  "maxSlots": 3,
  "updatedBy": 4
}
```

### PUT `/api/ReviewerSlotConfigs/{id}`
Request body:
```json
{
  "minSlots": 1,
  "maxSlots": 4,
  "updatedBy": 4
}
```

### DELETE `/api/ReviewerSlotConfigs/{id}`

ReviewerSlotConfigDto response shape:
```json
{
  "configId": 55,
  "roundId": 5,
  "minSlots": 1,
  "maxSlots": 3,
  "updatedBy": 4
}
```

---

## 13) Notifications APIs

### GET `/api/Notifications?pageSize=20&pageNumber=1`
### GET `/api/Notifications/{id}`
### GET `/api/Notifications/count?userId=21`
Neu khong truyen `userId` se dem tat ca notification.

### GET `/api/Notifications/user/{userId}?pageSize=20&pageNumber=1`
Lay notification theo user.

### POST `/api/Notifications`
Request body:
```json
{
  "userId": 21,
  "title": "Nhac nho dang ky slot",
  "message": "Ban can dang ky slot truoc 23:59",
  "type": "Reminder"
}
```

### PUT `/api/Notifications/{id}/read`
Danh dau da doc 1 notification.

### PUT `/api/Notifications/user/{userId}/read-all`
Danh dau da doc tat ca notification cua user.

### DELETE `/api/Notifications/{id}`

NotificationDto response shape:
```json
{
  "notificationId": 700,
  "userId": 21,
  "title": "Nhac nho dang ky slot",
  "message": "Ban can dang ky slot truoc 23:59",
  "type": "Reminder",
  "isRead": false,
  "createdAt": "2026-03-31T10:00:00Z"
}
```

---

## 14) SignalR Realtime (cho trang Slot cua FE)

Hub endpoint:
- `GET /hubs/slots` (SignalR connection)

Server methods co the goi tu FE:
- `JoinRound("round-{roundId}")`
- `LeaveRound("round-{roundId}")`

Server event FE can nghe:
- `slotStatusChanged`

Payload event:
```json
{
  "slotId": 12,
  "roundId": 5,
  "currentGroupCount": 2,
  "maxGroups": 3,
  "availabilityStatus": "dang co nhom dat"
}
```

Gia tri `availabilityStatus`:
- `con trong`
- `dang co nhom dat`
- `da het cho`

---

## 15) Ghi chu cho FE mock

- De mock nhanh, co the dung response mau trong tai lieu nay lam static JSON.
- Cac endpoint `POST/PUT` co validate data annotations, sai format co the tra `400`.
- Cac rule nghiep vu (slot full, round dong, duplicate dang ky, conflict GVHD) se tra `400` voi `error` message.
- Hien tai controller chua gan `[Authorize]`, nhung login van tra JWT de FE su dung theo dung flow thuc te.
