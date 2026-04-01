/**
 * API service layer cho CapReview.
 * Export cùng tên hàm với mock/api.ts để hooks chỉ cần đổi import path.
 *
 * Mỗi hàm gọi BE endpoint thực, map response DTO → FE type.
 */
import { apiClient } from './client'
import {
  mapUser,
  mapSemester,
  mapRound,
  mapSlot,
  mapGroup,
  mapGroupMember,
  mapGroupRegistration,
  mapReviewerRegistration,
  mapReviewerConfig,
  mapNotification,
  feToBeRoundStatus,
  feToBeSlotStatus,
  type LoginResponseDto,
  type UserDto,
  type SemesterDto,
  type ReviewRoundDto,
  type SlotDto,
  type GroupDto,
  type GroupMemberDto,
  type GroupSlotRegistrationDto,
  type ReviewerSlotRegistrationDto,
  type ReviewerSlotConfigDto,
  type NotificationDto,
} from './mappers'
import { useAuthStore } from '@/stores/authStore'
import type {
  User,
  Semester,
  ReviewRound,
  Slot,
  SlotWithDetails,
  Group,
  GroupMember,
  GroupSlotRegistration,
  ReviewerSlotRegistration,
  ReviewerSlotConfig,
  Notification,
} from '@/types'

// ====================================================================
// Helper: giải mã JWT payload (không verify — chỉ lấy claims)
// ====================================================================
function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return {}
  }
}

// ====================================================================
// AUTH
// ====================================================================

export async function loginApi(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<LoginResponseDto>('/Auth/login', {
    email,
    password,
  })

  // Lưu token vào store ngay
  useAuthStore.getState().setToken(data.token)

  // Lấy claims từ JWT để fallback khi response body thiếu trường
  const claims = parseJwtPayload(data.token)

  // UserId: ưu tiên response body, fallback JWT claims
  const rawId =
    data.userId ??
    claims.nameid ??
    claims.sub ??
    claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    0
  const userId = Number(rawId) || 0

  // Role: ưu tiên response body, fallback JWT claims
  const rawRole = String(
    data.role ??
      claims.role ??
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      '',
  )

  const roleMap: Record<string, User['role']> = {
    Student: 'STUDENT',
    GvReview: 'GV_REVIEW',
    Gvhd: 'GVHD',
    Moderator: 'MODERATOR',
  }

  // Email: ưu tiên response body, fallback JWT claims, cuối cùng dùng email đã nhập
  const userEmail = String(
    data.email ??
      claims.email ??
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
      email,
  )

  // FullName: ưu tiên response body, fallback JWT claims
  const fullName = String(
    data.fullName ??
      claims.unique_name ??
      claims.name ??
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
      '',
  )

  return {
    user_id: userId,
    full_name: fullName,
    email: userEmail,
    role: roleMap[rawRole] ?? 'STUDENT',
    created_at: '',
    updated_at: '',
  }
}

// ====================================================================
// USERS
// ====================================================================

export async function getUsers(pageSize = 100, pageNumber = 1): Promise<User[]> {
  const { data } = await apiClient.get<UserDto[]>('/Users', {
    params: { pageSize, pageNumber },
  })
  return data.map(mapUser)
}

export async function getUserById(userId: number): Promise<User> {
  const { data } = await apiClient.get<UserDto>(`/Users/${userId}`)
  return mapUser(data)
}

// ====================================================================
// SEMESTERS
// ====================================================================

export async function getActiveSemester(): Promise<Semester | null> {
  try {
    const { data } = await apiClient.get<SemesterDto>('/Semesters/active')
    return mapSemester(data)
  } catch {
    // 404 = chưa có semester active → trả null
    return null
  }
}

export async function getSemesters(pageSize = 100, pageNumber = 1): Promise<Semester[]> {
  const { data } = await apiClient.get<SemesterDto[]>('/Semesters', {
    params: { pageSize, pageNumber },
  })
  return data.map(mapSemester)
}

export async function createSemester(
  semesterData: Omit<Semester, 'semester_id' | 'created_at'>,
): Promise<Semester> {
  const { data } = await apiClient.post<SemesterDto>('/Semesters', {
    semesterName: semesterData.semester_name,
    startDate: semesterData.start_date,
    endDate: semesterData.end_date,
    isActive: semesterData.is_active,
  })
  return mapSemester(data)
}

export async function updateSemester(
  semester_id: number,
  semesterData: Partial<Semester>,
): Promise<Semester> {
  const body: Record<string, unknown> = {}
  if (semesterData.semester_name !== undefined) body.semesterName = semesterData.semester_name
  if (semesterData.start_date !== undefined) body.startDate = semesterData.start_date
  if (semesterData.end_date !== undefined) body.endDate = semesterData.end_date
  if (semesterData.is_active !== undefined) body.isActive = semesterData.is_active

  const { data } = await apiClient.put<SemesterDto>(`/Semesters/${semester_id}`, body)
  return mapSemester(data)
}

export async function deleteSemester(semester_id: number): Promise<void> {
  await apiClient.delete(`/Semesters/${semester_id}`)
}

// ====================================================================
// REVIEW ROUNDS
// ====================================================================

export async function getRoundsForSemester(semester_id: number): Promise<ReviewRound[]> {
  try {
    // Thử endpoint semester-specific trước
    const { data } = await apiClient.get<ReviewRoundDto[]>(
      `/ReviewRounds/semester/${semester_id}`,
    )
    return data.map(mapRound)
  } catch {
    // Fallback: lấy tất cả rounds rồi filter theo semesterId
    const { data } = await apiClient.get<ReviewRoundDto[]>('/ReviewRounds', {
      params: { pageSize: 100 },
    })
    return data.filter((r) => r.semesterId === semester_id).map(mapRound)
  }
}

export async function getOpenRounds(): Promise<ReviewRound[]> {
  const { data } = await apiClient.get<ReviewRoundDto[]>('/ReviewRounds/open')
  return data.map(mapRound)
}

export async function getRoundById(roundId: number): Promise<ReviewRound> {
  const { data } = await apiClient.get<ReviewRoundDto>(`/ReviewRounds/${roundId}`)
  return mapRound(data)
}

export async function createRound(
  roundData: Omit<ReviewRound, 'round_id'>,
): Promise<ReviewRound> {
  const { data } = await apiClient.post<ReviewRoundDto>('/ReviewRounds', {
    semesterId: roundData.semester_id,
    roundNumber: roundData.round_number,
    roundName: roundData.round_name,
    registrationOpenAt: roundData.registration_open_at,
    registrationCloseAt: roundData.registration_close_at,
    reviewDateFrom: roundData.review_date_from,
    reviewDateTo: roundData.review_date_to,
  })
  return mapRound(data)
}

export async function updateRound(
  round_id: number,
  roundData: Partial<ReviewRound>,
): Promise<ReviewRound> {
  const body: Record<string, unknown> = {}
  if (roundData.round_name !== undefined) body.roundName = roundData.round_name
  if (roundData.registration_open_at !== undefined)
    body.registrationOpenAt = roundData.registration_open_at
  if (roundData.registration_close_at !== undefined)
    body.registrationCloseAt = roundData.registration_close_at
  if (roundData.review_date_from !== undefined)
    body.reviewDateFrom = roundData.review_date_from
  if (roundData.review_date_to !== undefined)
    body.reviewDateTo = roundData.review_date_to
  if (roundData.status !== undefined)
    body.status = feToBeRoundStatus[roundData.status]

  const { data } = await apiClient.put<ReviewRoundDto>(
    `/ReviewRounds/${round_id}`,
    body,
  )
  return mapRound(data)
}

export async function deleteRound(round_id: number): Promise<void> {
  await apiClient.delete(`/ReviewRounds/${round_id}`)
}

// ====================================================================
// SLOTS
// ====================================================================

/**
 * Lấy danh sách slot kèm chi tiết (registered groups, reviewers) cho 1 round.
 *
 * Cần gọi nhiều endpoint rồi ghép lại vì BE không có endpoint "slot with details".
 */
export async function getSlotsForRound(
  round_id: number,
): Promise<SlotWithDetails[]> {
  // 1. Round info
  const { data: roundDto } = await apiClient.get<ReviewRoundDto>(
    `/ReviewRounds/${round_id}`,
  )
  const round = mapRound(roundDto)

  // 2. Tất cả slot của round
  const { data: slotDtos } = await apiClient.get<SlotDto[]>(
    `/Slots/round/${round_id}`,
  )
  const slots = slotDtos.map(mapSlot)
  if (slots.length === 0) return []

  // 3. Group registrations & reviewer registrations cho mỗi slot (song song)
  const [allGroupRegs, allReviewerRegs] = await Promise.all([
    Promise.all(
      slots.map((s) =>
        apiClient
          .get<GroupSlotRegistrationDto[]>(
            `/GroupSlotRegistrations/slot/${s.slot_id}`,
          )
          .then((r) => r.data.map(mapGroupRegistration))
          .catch(() => [] as GroupSlotRegistration[]),
      ),
    ),
    Promise.all(
      slots.map((s) =>
        apiClient
          .get<ReviewerSlotRegistrationDto[]>(
            `/ReviewerSlotRegistrations/slot/${s.slot_id}`,
          )
          .then((r) => r.data.map(mapReviewerRegistration))
          .catch(() => [] as ReviewerSlotRegistration[]),
      ),
    ),
  ])

  // 4. Thu thập unique IDs
  const groupIds = new Set<number>()
  const userIds = new Set<number>()
  allGroupRegs.forEach((regs) =>
    regs.forEach((r) => {
      if (r.status === 'REGISTERED') groupIds.add(r.group_id)
    }),
  )
  allReviewerRegs.forEach((regs) =>
    regs.forEach((r) => {
      if (r.status === 'REGISTERED') userIds.add(r.reviewer_id)
    }),
  )

  // 5. Fetch groups & users song song
  const [groups, users] = await Promise.all([
    Promise.all(
      [...groupIds].map((id) =>
        apiClient
          .get<GroupDto>(`/Groups/${id}`)
          .then((r) => mapGroup(r.data))
          .catch(() => null),
      ),
    ),
    Promise.all(
      [...userIds].map((id) =>
        apiClient
          .get<UserDto>(`/Users/${id}`)
          .then((r) => mapUser(r.data))
          .catch(() => null),
      ),
    ),
  ])

  const groupMap = new Map(
    groups.filter((g): g is Group => g !== null).map((g) => [g.group_id, g]),
  )
  const userMap = new Map(
    users.filter((u): u is User => u !== null).map((u) => [u.user_id, u]),
  )

  // 6. Ghép thành SlotWithDetails
  return slots.map((slot, i) => {
    const gRegs = allGroupRegs[i].filter((r) => r.status === 'REGISTERED')
    const rRegs = allReviewerRegs[i].filter((r) => r.status === 'REGISTERED')

    const registered_groups = gRegs
      .map((r) => groupMap.get(r.group_id))
      .filter((g): g is Group => g !== undefined)

    const registered_reviewers = rRegs
      .map((r) => userMap.get(r.reviewer_id))
      .filter((u): u is User => u !== undefined)

    return {
      ...slot,
      current_group_count: registered_groups.length,
      round,
      registered_groups,
      registered_reviewers,
    }
  })
}

export async function createSlot(
  slotData: Omit<Slot, 'slot_id' | 'current_group_count'>,
): Promise<Slot> {
  const { data } = await apiClient.post<SlotDto>('/Slots', {
    roundId: slotData.round_id,
    startTime: slotData.start_time,
    endTime: slotData.end_time,
    room: slotData.room,
    maxGroups: slotData.max_groups,
    minReviewers: slotData.min_reviewers,
    maxReviewers: slotData.max_reviewers,
    createdBy: slotData.created_by,
  })
  return mapSlot(data)
}

export async function updateSlot(
  slot_id: number,
  slotData: Partial<Slot>,
): Promise<Slot> {
  const body: Record<string, unknown> = {}
  if (slotData.start_time !== undefined) body.startTime = slotData.start_time
  if (slotData.end_time !== undefined) body.endTime = slotData.end_time
  if (slotData.room !== undefined) body.room = slotData.room
  if (slotData.max_groups !== undefined) body.maxGroups = slotData.max_groups
  if (slotData.min_reviewers !== undefined)
    body.minReviewers = slotData.min_reviewers
  if (slotData.max_reviewers !== undefined)
    body.maxReviewers = slotData.max_reviewers
  if (slotData.status !== undefined)
    body.status = feToBeSlotStatus[slotData.status]

  const { data } = await apiClient.put<SlotDto>(`/Slots/${slot_id}`, body)
  return mapSlot(data)
}

export async function deleteSlot(slot_id: number): Promise<void> {
  await apiClient.delete(`/Slots/${slot_id}`)
}

// ====================================================================
// GROUP SLOT REGISTRATIONS  (Sinh viên đăng ký slot)
// ====================================================================

export async function registerGroupSlot(
  group_id: number,
  slot_id: number,
  registered_by: number,
): Promise<GroupSlotRegistration> {
  const { data } = await apiClient.post<GroupSlotRegistrationDto>(
    '/GroupSlotRegistrations',
    { groupId: group_id, slotId: slot_id, registeredBy: registered_by },
  )
  return mapGroupRegistration(data)
}

export async function cancelGroupRegistration(
  registration_id: number,
): Promise<void> {
  await apiClient.put(`/GroupSlotRegistrations/${registration_id}/cancel`)
}

export async function getGroupRegistrations(
  groupId: number,
): Promise<GroupSlotRegistration[]> {
  const { data } = await apiClient.get<GroupSlotRegistrationDto[]>(
    `/GroupSlotRegistrations/group/${groupId}`,
  )
  return data.map(mapGroupRegistration)
}

export async function getSlotGroupRegistrations(
  slotId: number,
): Promise<GroupSlotRegistration[]> {
  const { data } = await apiClient.get<GroupSlotRegistrationDto[]>(
    `/GroupSlotRegistrations/slot/${slotId}`,
  )
  return data.map(mapGroupRegistration)
}

// ====================================================================
// REVIEWER SLOT REGISTRATIONS  (GV review đăng ký slot)
// ====================================================================

export async function registerReviewerSlot(
  reviewer_id: number,
  slot_id: number,
): Promise<ReviewerSlotRegistration> {
  const { data } = await apiClient.post<ReviewerSlotRegistrationDto>(
    '/ReviewerSlotRegistrations',
    { reviewerId: reviewer_id, slotId: slot_id },
  )
  return mapReviewerRegistration(data)
}

export async function cancelReviewerRegistration(
  reviewer_registration_id: number,
): Promise<void> {
  await apiClient.put(
    `/ReviewerSlotRegistrations/${reviewer_registration_id}/cancel`,
  )
}

export async function getReviewerRegistrations(
  reviewerId: number,
): Promise<ReviewerSlotRegistration[]> {
  const { data } = await apiClient.get<ReviewerSlotRegistrationDto[]>(
    `/ReviewerSlotRegistrations/reviewer/${reviewerId}`,
  )
  return data.map(mapReviewerRegistration)
}

// ====================================================================
// REVIEWER SLOT CONFIG
// ====================================================================

export async function getReviewerConfig(
  round_id: number,
): Promise<ReviewerSlotConfig> {
  const { data } = await apiClient.get<ReviewerSlotConfigDto>(
    `/ReviewerSlotConfigs/round/${round_id}`,
  )
  return mapReviewerConfig(data)
}

export async function updateReviewerConfig(
  round_id: number,
  min_slots: number,
  max_slots: number,
): Promise<ReviewerSlotConfig> {
  // Lấy config hiện tại để biết configId
  const { data: existing } = await apiClient.get<ReviewerSlotConfigDto>(
    `/ReviewerSlotConfigs/round/${round_id}`,
  )
  const { data } = await apiClient.put<ReviewerSlotConfigDto>(
    `/ReviewerSlotConfigs/${existing.configId}`,
    {
      minSlots: min_slots,
      maxSlots: max_slots,
      updatedBy: useAuthStore.getState().currentUser?.user_id ?? 0,
    },
  )
  return mapReviewerConfig(data)
}

export async function createReviewerConfig(
  round_id: number,
  min_slots: number,
  max_slots: number,
): Promise<ReviewerSlotConfig> {
  const { data } = await apiClient.post<ReviewerSlotConfigDto>(
    '/ReviewerSlotConfigs',
    {
      roundId: round_id,
      minSlots: min_slots,
      maxSlots: max_slots,
      updatedBy: useAuthStore.getState().currentUser?.user_id ?? 0,
    },
  )
  return mapReviewerConfig(data)
}

// ====================================================================
// GROUPS & GROUP MEMBERS
// ====================================================================

export async function getGroups(
  pageSize = 200,
  pageNumber = 1,
): Promise<Group[]> {
  const { data } = await apiClient.get<GroupDto[]>('/Groups', {
    params: { pageSize, pageNumber },
  })
  return data.map(mapGroup)
}

export async function getGroupById(groupId: number): Promise<Group> {
  const { data } = await apiClient.get<GroupDto>(`/Groups/${groupId}`)
  return mapGroup(data)
}

export async function getGroupsBySemester(
  semesterId: number,
): Promise<Group[]> {
  const { data } = await apiClient.get<GroupDto[]>(
    `/Groups/semester/${semesterId}`,
  )
  return data.map(mapGroup)
}

export async function getGroupMembers(
  pageSize = 500,
  pageNumber = 1,
): Promise<GroupMember[]> {
  const { data } = await apiClient.get<GroupMemberDto[]>('/GroupMembers', {
    params: { pageSize, pageNumber },
  })
  return data.map(mapGroupMember)
}

export async function getGroupMembersByGroup(
  groupId: number,
): Promise<GroupMember[]> {
  const { data } = await apiClient.get<GroupMemberDto[]>(
    `/GroupMembers/group/${groupId}`,
  )
  return data.map(mapGroupMember)
}

export async function createGroup(
  groupData: Omit<Group, 'group_id' | 'created_at' | 'updated_at'>,
): Promise<Group> {
  const { data } = await apiClient.post<GroupDto>('/Groups', {
    groupName: groupData.group_name,
    projectTitle: groupData.project_title,
    semesterId: groupData.semester_id,
    gvhdId: groupData.gvhd_id,
  })
  return mapGroup(data)
}

export async function updateGroup(
  group_id: number,
  groupData: Partial<Group>,
): Promise<Group> {
  const body: Record<string, unknown> = {}
  if (groupData.group_name !== undefined) body.groupName = groupData.group_name
  if (groupData.project_title !== undefined) body.projectTitle = groupData.project_title
  if (groupData.gvhd_id !== undefined) body.gvhdId = groupData.gvhd_id

  const { data } = await apiClient.put<GroupDto>(`/Groups/${group_id}`, body)
  return mapGroup(data)
}

export async function deleteGroup(group_id: number): Promise<void> {
  await apiClient.delete(`/Groups/${group_id}`)
}

export async function addGroupMember(
  groupId: number,
  studentId: number,
): Promise<GroupMember> {
  const { data } = await apiClient.post<GroupMemberDto>('/GroupMembers', {
    groupId,
    studentId,
  })
  return mapGroupMember(data)
}

export async function getGroupMemberByStudent(
  studentId: number,
): Promise<GroupMember | null> {
  try {
    // BE có thể trả array hoặc single object
    const { data } = await apiClient.get<GroupMemberDto | GroupMemberDto[]>(
      `/GroupMembers/student/${studentId}`,
    )
    // Nếu trả array → lấy phần tử đầu
    const dto = Array.isArray(data) ? data[0] : data
    if (!dto || !dto.groupId) return null
    return mapGroupMember(dto)
  } catch {
    try {
      // Fallback: lấy tất cả members rồi tìm theo studentId
      const { data } = await apiClient.get<GroupMemberDto[]>('/GroupMembers', {
        params: { pageSize: 500 },
      })
      const found = data.find((m) => m.studentId === studentId)
      return found ? mapGroupMember(found) : null
    } catch {
      return null
    }
  }
}

export async function removeGroupMember(memberId: number): Promise<void> {
  await apiClient.delete(`/GroupMembers/${memberId}`)
}

// ====================================================================
// NOTIFICATIONS
// ====================================================================

export async function getNotificationsForUser(
  user_id: number,
): Promise<Notification[]> {
  const { data } = await apiClient.get<NotificationDto[]>(
    `/Notifications/user/${user_id}`,
    { params: { pageSize: 100 } },
  )
  return data.map(mapNotification)
}

export async function markAllAsRead(user_id: number): Promise<void> {
  await apiClient.put(`/Notifications/user/${user_id}/read-all`)
}

export async function markNotificationAsRead(
  notification_id: number,
): Promise<void> {
  await apiClient.put(`/Notifications/${notification_id}/read`)
}

export async function sendReminder(
  user_id: number,
  message: string,
): Promise<Notification> {
  const { data } = await apiClient.post<NotificationDto>('/Notifications', {
    userId: user_id,
    title: 'Nhắc nhở',
    message,
    type: 'Reminder',
  })
  return mapNotification(data)
}

// ====================================================================
// MODERATOR DASHBOARD  (composite query — không có endpoint riêng trên BE)
// ====================================================================

export async function getModeratorDashboardData(
  round_id: number,
): Promise<{
  slotStats: { slot: SlotWithDetails; hasReviewer: boolean }[]
  reviewerStats: {
    reviewer: User
    registeredCount: number
    minRequired: number
    isSufficient: boolean
  }[]
  groupStats: {
    group: Group
    registeredSlots: Slot[]
    hasRegistered: boolean
  }[]
}> {
  // 1. Slot details (round info đã embed trong SlotWithDetails)
  const slotDetails = await getSlotsForRound(round_id)
  const round =
    slotDetails.length > 0
      ? slotDetails[0].round
      : await getRoundById(round_id)

  // 2. Slot stats
  const slotStats = slotDetails.map((slot) => ({
    slot,
    hasReviewer: slot.registered_reviewers.length > 0,
  }))

  // 3. Reviewer config
  let config: ReviewerSlotConfig
  try {
    config = await getReviewerConfig(round_id)
  } catch {
    config = {
      config_id: 0,
      round_id,
      min_slots: 0,
      max_slots: 0,
      updated_by: 0,
      updated_at: '',
    }
  }

  // 4. Tất cả GV Review
  const allUsers = await getUsers(500)
  const reviewers = allUsers.filter((u) => u.role === 'GV_REVIEW')

  const reviewerStats = reviewers.map((reviewer) => {
    const registeredCount = slotDetails.filter((slot) =>
      slot.registered_reviewers.some((r) => r.user_id === reviewer.user_id),
    ).length
    return {
      reviewer,
      registeredCount,
      minRequired: config.min_slots,
      isSufficient: registeredCount >= config.min_slots,
    }
  })

  // 5. Tất cả nhóm trong semester
  const groups = await getGroupsBySemester(round.semester_id)

  const groupRegResults = await Promise.all(
    groups.map((g) =>
      getGroupRegistrations(g.group_id).catch(
        () => [] as GroupSlotRegistration[],
      ),
    ),
  )

  const groupStats = groups.map((group, i) => {
    const activeRegs = groupRegResults[i].filter(
      (r) => r.status === 'REGISTERED',
    )
    const registeredSlotIds = new Set(
      activeRegs
        .filter((r) =>
          slotDetails.some((s) => s.slot_id === r.slot_id),
        )
        .map((r) => r.slot_id),
    )
    const registeredSlots = slotDetails.filter((s) =>
      registeredSlotIds.has(s.slot_id),
    )
    return {
      group,
      registeredSlots,
      hasRegistered: registeredSlots.length > 0,
    }
  })

  return { slotStats, reviewerStats, groupStats }
}
